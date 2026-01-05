const prisma = require('../config/database');
const { z } = require('zod');
const PdfPrinter = require('pdfmake');
const fs = require('fs');

const fonts = {
  Roboto: {
    normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
    bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
    italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
    bolditalics: 'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf',
  },
};

const printer = new PdfPrinter(fonts);

// Validation schemas
const individualLabResultSchema = z.object({
  labOrderId: z.number(),
  serviceId: z.number(),
  templateId: z.string(),
  results: z.object({}).passthrough(), // Dynamic object for template fields
  additionalNotes: z.string().optional()
});

// Get lab templates
exports.getTemplates = async (req, res) => {
  try {
    const templates = await prisma.labTestTemplate.findMany({
      where: { isActive: true },
      orderBy: { category: 'asc' }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Error fetching lab templates:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get lab orders (batch orders + walk-in orders + new lab test orders)
exports.getOrders = async (req, res) => {
  try {
    console.log('📋 [getOrders] Fetching lab orders...');
    // Get NEW lab test orders (new system)
    const labTestOrders = await prisma.labTestOrder.findMany({
      where: {
        OR: [
          {
            visitId: { not: null },
            status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED'] }
          },
          {
            isWalkIn: true,
            status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED'] }
          },
          {
            visitId: { not: null },
            status: 'UNPAID',
            visit: { isEmergency: true }
          }
        ]
      },
      include: {
        labTest: {
          include: {
            service: true,
            group: true,
            resultFields: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true,
            specialties: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true,
            isEmergency: true
          }
        },
        results: {
          include: {
            attachments: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get batch orders (old system - for backward compatibility)
    // BUT: Exclude batchOrders that have labTestOrders (new system) - they'll be in labTestOrders array
    const batchOrderIdsWithLabTestOrders = new Set(
      labTestOrders.map(order => order.batchOrderId).filter(Boolean)
    );
    
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        AND: [
          {
            OR: [
              { type: 'LAB' },
              { type: 'MIXED' }
            ]
          },
          {
            OR: [
              // Regular orders that are paid
              {
                status: {
                  in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
                }
              },
              // Emergency orders that are unpaid (treated as pre-paid)
              {
                status: 'UNPAID',
                visit: {
                  isEmergency: true
                }
              }
            ]
          },
          // EXCLUDE batchOrders that have labTestOrders (new system)
          {
            id: {
              notIn: Array.from(batchOrderIdsWithLabTestOrders)
            }
          }
        ]
      },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true,
            specialties: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true,
            isEmergency: true
          }
        },
        attachments: true,
        detailedResults: {
          include: {
            template: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Get walk-in lab orders
    const walkInOrders = await prisma.labOrder.findMany({
      where: {
        isWalkIn: true,
        status: {
          in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true
          }
        },
        type: true,
        labResults: {
          include: {
            testType: true,
            attachments: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group walk-in orders by patient and billing
    const groupedOrders = {};
    walkInOrders.forEach(order => {
      const key = `${order.patientId}-${order.billingId || 'no-billing'}`;
      if (!groupedOrders[key]) {
        groupedOrders[key] = {
          id: order.id, // Use first order ID as the group ID
          patientId: order.patientId,
          patient: order.patient,
          billingId: order.billingId,
          status: order.status,
          instructions: order.instructions,
          createdAt: order.createdAt,
          isWalkIn: true,
          services: [] // Array of individual orders as services
        };
      }
      
      // Add this order as a service
      groupedOrders[key].services.push({
        id: order.id,
        service: order.type, // The investigation type
        investigationType: order.type,
        labResults: order.labResults
      });
      
      // Update group status if this order has a different status
      if (order.status !== groupedOrders[key].status) {
        // If any order is completed, group is completed
        if (order.status === 'COMPLETED') {
          groupedOrders[key].status = 'COMPLETED';
        }
        // If any order is IN_PROGRESS but not all COMPLETED, group is IN_PROGRESS
        else if (order.status === 'IN_PROGRESS' && groupedOrders[key].status !== 'COMPLETED') {
          groupedOrders[key].status = 'IN_PROGRESS';
        }
      }
    });

    const groupedWalkInOrders = Object.values(groupedOrders);

    // Group new lab test orders by patient/visit for easier display
    // Group new lab test orders by visit + billingId (or batchOrderId) to separate different orders
    // CRITICAL: Must group by billingId/batchOrderId to prevent mixing orders from different billings
    const groupedLabTestOrders = {};
    labTestOrders.forEach(order => {
      // For visit-based orders: group by visitId + billingId (or batchOrderId as fallback)
      // This ensures orders from different billings are kept separate
      // For walk-in orders: group by patientId + billingId
      const key = order.visitId 
        ? `visit-${order.visitId}-billing-${order.billingId || order.batchOrderId || 'no-billing'}` 
        : `walkin-${order.patientId}-billing-${order.billingId || 'no-billing'}`;
      
      if (!groupedLabTestOrders[key]) {
        groupedLabTestOrders[key] = {
          id: order.id, // Use first order ID as group ID
          batchOrderId: order.batchOrderId, // Include batchOrderId for reference
          visitId: order.visitId,
          patientId: order.patientId,
          patient: order.patient,
          doctor: order.doctor,
          visit: order.visit,
          status: order.status,
          instructions: order.instructions || 'Lab tests ordered by doctor',
          createdAt: order.createdAt,
          isWalkIn: order.isWalkIn,
          billingId: order.billingId,
          orders: [] // This will contain all individual lab test orders
        };
      }
      
      // Always add the order to the orders array - this is critical for frontend to display
      // Include ALL necessary fields for the frontend to display properly
      groupedLabTestOrders[key].orders.push({
        id: order.id,
        labTestId: order.labTestId,
        batchOrderId: order.batchOrderId,
        labTest: order.labTest ? {
          id: order.labTest.id,
          name: order.labTest.name,
          code: order.labTest.code,
          description: order.labTest.description,
          price: order.labTest.price,
          category: order.labTest.category,
          resultFields: order.labTest.resultFields || [], // CRITICAL: Must include resultFields
          group: order.labTest.group || null
        } : null,
        status: order.status,
        instructions: order.instructions,
        results: order.results || [], // Array of LabTestResult objects
        patientId: order.patientId,
        visitId: order.visitId,
        doctorId: order.doctorId,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      });
      
      // Update group status based on ALL orders in the group
      // Group is COMPLETED only if ALL orders are completed
      // Group is IN_PROGRESS if at least one is in progress and none are completed
      const groupOrders = groupedLabTestOrders[key].orders;
      const allCompleted = groupOrders.every(o => o.status === 'COMPLETED');
      const anyInProgress = groupOrders.some(o => o.status === 'IN_PROGRESS');
      
      if (allCompleted) {
        groupedLabTestOrders[key].status = 'COMPLETED';
      } else if (anyInProgress) {
        groupedLabTestOrders[key].status = 'IN_PROGRESS';
      } else {
        // If there are PAID orders, status should be PAID (for new orders waiting to be processed)
        groupedLabTestOrders[key].status = order.status;
      }
    });

    // Convert grouped orders to array and log details
    const groupedOrdersArray = Object.values(groupedLabTestOrders);
    
    // Log detailed info about each grouped order
    groupedOrdersArray.forEach((group, idx) => {
      console.log(`📦 [getOrders] Group ${idx + 1}:`, {
        id: group.id,
        visitId: group.visitId,
        patientName: group.patient?.name,
        ordersCount: group.orders?.length || 0,
        ordersWithLabTest: group.orders?.filter(o => o.labTest).length || 0,
        status: group.status
      });
      
      // Log each order in the group
      if (group.orders && group.orders.length > 0) {
        group.orders.forEach((o, oidx) => {
          console.log(`   Order ${oidx + 1}:`, {
            id: o.id,
            labTestName: o.labTest?.name || 'MISSING',
            hasLabTest: !!o.labTest,
            status: o.status
          });
        });
      } else {
        console.warn(`   ⚠️ Group ${idx + 1} has NO orders in array!`);
      }
    });

    console.log('📋 [getOrders] Summary:', {
      batchOrders: batchOrders.length,
      batchOrdersExcluded: batchOrderIdsWithLabTestOrders.size,
      walkInOrders: groupedWalkInOrders.length,
      labTestOrders: groupedOrdersArray.length,
      totalLabTestOrders: labTestOrders.length,
      groupsWithOrders: groupedOrdersArray.filter(g => g.orders && g.orders.length > 0).length,
      groupsWithoutOrders: groupedOrdersArray.filter(g => !g.orders || g.orders.length === 0).length
    });
    
    // Log each grouped order to verify structure
    groupedOrdersArray.forEach((group, idx) => {
      console.log(`📦 Group ${idx + 1}:`, {
        id: group.id,
        visitId: group.visitId,
        patientName: group.patient?.name,
        ordersCount: group.orders?.length || 0,
        orderNames: group.orders?.map(o => o.labTest?.name).filter(Boolean).join(', ') || 'NONE'
      });
    });

    res.json({ 
      batchOrders, // Old system
      walkInOrders: groupedWalkInOrders, // Old system walk-ins
      labTestOrders: groupedOrdersArray // New system
    });
  } catch (error) {
    console.error('❌ [getOrders] Error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Save individual lab result
exports.saveIndividualLabResult = async (req, res) => {
  try {
    console.log('🔍 Individual lab result endpoint hit:', req.body);
    console.log('🔍 Request method:', req.method);
    console.log('🔍 Request URL:', req.url);
    console.log('🔍 Request headers:', req.headers);

    const data = individualLabResultSchema.parse(req.body);
    const labTechnicianId = req.user.id;

    // Check if it's a batch order or regular lab order (walk-in)
    let batchOrder = await prisma.batchOrder.findUnique({
      where: { id: data.labOrderId },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        patient: true,
        visit: true
      }
    });

    let isWalkIn = false;
    let labOrder = null;

    if (!batchOrder) {
      // Check if it's a regular lab order (walk-in)
      labOrder = await prisma.labOrder.findUnique({
        where: { id: data.labOrderId },
        include: {
          patient: true,
          type: true
        }
      });

      if (!labOrder) {
        return res.status(404).json({ error: 'Lab order not found' });
      }

      isWalkIn = labOrder.isWalkIn;

      // For walk-in orders, save to LabResult model
      if (isWalkIn) {
        const template = await prisma.labTestTemplate.findUnique({
          where: { id: data.templateId }
        });

        if (!template) {
          return res.status(404).json({ error: 'Lab template not found' });
        }

        // Check if result already exists
        const existingResult = await prisma.labResult.findFirst({
          where: {
            orderId: data.labOrderId,
            testTypeId: labOrder.typeId
          }
        });

        if (existingResult) {
          // Update existing result
          const updatedResult = await prisma.labResult.update({
            where: { id: existingResult.id },
            data: {
              resultText: JSON.stringify(data.results),
              additionalNotes: data.additionalNotes,
              status: 'COMPLETED'
            }
          });

          return res.json({
            message: 'Lab result updated successfully',
            result: updatedResult
          });
        } else {
          // Create new result
          const newResult = await prisma.labResult.create({
            data: {
              orderId: data.labOrderId,
              testTypeId: labOrder.typeId,
              resultText: JSON.stringify(data.results),
              additionalNotes: data.additionalNotes,
              status: 'COMPLETED'
            },
            include: {
              testType: true
            }
          });

          return res.json({
            message: 'Lab result saved successfully',
            result: newResult
          });
        }
      }
    }

    // Check if service exists in this batch order
    const service = batchOrder.services.find(s => s.id === data.serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found in this order' });
    }

    // Check if template exists (only if templateId is provided)
    let template = null;
    if (data.templateId) {
      template = await prisma.labTestTemplate.findUnique({
        where: { id: data.templateId }
      });

      if (!template) {
        return res.status(404).json({ error: 'Lab template not found' });
      }
    } else {
      // If no template, additionalNotes is optional (all fields are now optional)
      // No validation needed
    }

    // Check if result already exists for this service
    const existingResult = await prisma.detailedLabResult.findFirst({
      where: {
        labOrderId: data.labOrderId,
        serviceId: data.serviceId,
        templateId: data.templateId || null
      }
    });

    if (existingResult) {
      // Update existing result
      console.log('📝 Updating existing result:', {
        resultId: existingResult.id,
        serviceId: data.serviceId,
        resultsCount: Object.keys(data.results || {}).length,
        templateId: data.templateId
      });
      
      const updatedResult = await prisma.detailedLabResult.update({
        where: { id: existingResult.id },
        data: {
          results: data.results || {},
          additionalNotes: data.additionalNotes || '',
          updatedAt: new Date()
        }
      });

      console.log('✅ Result updated:', {
        resultId: updatedResult.id,
        resultsCount: Object.keys(updatedResult.results || {}).length
      });

      res.json({
        message: 'Lab result updated successfully',
        result: updatedResult
      });
    } else {
      // Create new result
      console.log('📝 Creating new result:', {
        labOrderId: data.labOrderId,
        serviceId: data.serviceId,
        templateId: data.templateId,
        resultsCount: Object.keys(data.results || {}).length
      });
      
      const newResult = await prisma.detailedLabResult.create({
        data: {
          labOrderId: data.labOrderId,
          serviceId: data.serviceId,
          templateId: data.templateId || null, // Allow null for services without templates
          results: data.results || {},
          additionalNotes: data.additionalNotes || ''
        }
      });

      console.log('✅ Result created:', {
        resultId: newResult.id,
        resultsCount: Object.keys(newResult.results || {}).length
      });

      res.json({
        message: 'Lab result saved successfully',
        result: newResult
      });
    }

    // Update service status to COMPLETED when result is saved
    await prisma.batchOrderService.update({
      where: { id: data.serviceId },
      data: { status: 'COMPLETED' }
    });

  } catch (error) {
    console.error('Error saving lab result:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get detailed lab results for a specific order
exports.getDetailedResults = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('📋 Fetching detailed results for orderId:', orderId);
    
    const detailedResults = await prisma.detailedLabResult.findMany({
      where: {
        labOrderId: parseInt(orderId)
      },
      include: {
        template: true
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 Found', detailedResults.length, 'detailed results');
    detailedResults.forEach(result => {
      console.log('  - ServiceId:', result.serviceId, 'TemplateId:', result.templateId, 'Results keys:', Object.keys(result.results || {}).length);
    });

    res.json({ detailedResults });
  } catch (error) {
    console.error('Error fetching detailed lab results:', error);
    res.status(500).json({ error: error.message });
  }
};

// Send lab results to doctor
exports.sendToDoctor = async (req, res) => {
  try {
    const { labOrderId } = req.params;
    const labTechnicianId = req.user.id;

    // Check if batch order exists
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(labOrderId) },
      include: {
        services: true,
        visit: true
      }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Check if all services have results
    // For emergency patients, allow sending if at least one service has results
    // For regular patients, require all services to have results
    let allServicesHaveResults;
    
    if (batchOrder.visit.isEmergency) {
      // Emergency patients: at least one service must have results
      allServicesHaveResults = batchOrder.services.some(service => {
        return service.status === 'COMPLETED' || service.status === 'IN_PROGRESS';
      });
    } else {
      // Regular patients: all services must have results
      allServicesHaveResults = batchOrder.services.every(service => {
        return service.status === 'COMPLETED' || service.status === 'IN_PROGRESS';
      });
    }

    if (!allServicesHaveResults) {
      const errorMessage = batchOrder.visit.isEmergency 
        ? 'At least one service must have results before sending to doctor' 
        : 'All services must have results before sending to doctor';
      return res.status(400).json({ error: errorMessage });
    }

    // Update batch order status to COMPLETED
    await prisma.batchOrder.update({
      where: { id: parseInt(labOrderId) },
      data: { 
        status: 'COMPLETED'
      }
    });

    // Update all services to COMPLETED
    await prisma.batchOrderService.updateMany({
      where: { batchOrderId: parseInt(labOrderId) },
      data: { status: 'COMPLETED' }
    });

    // Update visit status back to IN_DOCTOR_QUEUE so doctor can continue treatment
    await checkAndUpdateVisitStatus(batchOrder.visitId);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: labTechnicianId,
        action: 'LAB_RESULTS_SENT_TO_DOCTOR',
        entity: 'BatchOrder',
        entityId: parseInt(labOrderId),
        details: JSON.stringify({
          batchOrderId: parseInt(labOrderId),
          servicesCount: batchOrder.services.length,
          visitId: batchOrder.visitId
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    const updatedVisit = await prisma.visit.findUnique({
      where: { id: batchOrder.visitId },
      select: { status: true }
    });

    res.json({
      message: 'Lab results sent to doctor successfully',
      batchOrderId: parseInt(labOrderId),
      visitStatus: updatedVisit?.status || 'IN_DOCTOR_QUEUE'
    });

  } catch (error) {
    console.error('Error sending lab results to doctor:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateLabOrderStatus = async (req, res) => {
  try {
    const { labOrderId } = req.params;
    const { status } = req.body;
    const updatedOrder = await prisma.labOrder.update({ where: { id: parseInt(labOrderId) }, data: { status } });
    res.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Error updating lab order status:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate PDF for lab results (both batch orders and walk-in orders)
exports.generateLabResultsPDF = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    const labTechnicianId = req.user.id;
    const orderId = parseInt(batchOrderId);

    // Try to get batch order first
    let batchOrder = await prisma.batchOrder.findUnique({
      where: { id: orderId },
      include: {
        patient: true,
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        detailedResults: {
          include: {
            template: true
          }
        },
        doctor: {
          select: {
            fullname: true
          }
        }
      }
    });

    let isWalkIn = false;
    let walkInOrder = null;
    let walkInResults = [];

    // If not a batch order, check if it's a walk-in order
    if (!batchOrder) {
      walkInOrder = await prisma.labOrder.findUnique({
        where: { id: orderId },
        include: {
          patient: true,
          type: true,
          labResults: {
            include: {
              testType: true
            }
          }
        }
      });

      if (!walkInOrder) {
        return res.status(404).json({ error: 'Lab order not found' });
      }

      if (!walkInOrder.isWalkIn) {
        return res.status(400).json({ error: 'This endpoint only supports batch orders and walk-in orders' });
      }

      isWalkIn = true;

      // Get templates for walk-in results
      for (const labResult of walkInOrder.labResults) {
        if (labResult.resultText) {
          try {
            const template = await prisma.labTestTemplate.findFirst({
              where: {
                category: labResult.testType.category || 'GENERAL'
              }
            });

            if (template) {
              walkInResults.push({
                serviceName: labResult.testType.name,
                results: JSON.parse(labResult.resultText || '{}'),
                additionalNotes: labResult.additionalNotes || '',
                template: template
              });
            } else {
              // Fallback: create a simple result without template
              walkInResults.push({
                serviceName: labResult.testType.name,
                results: JSON.parse(labResult.resultText || '{}'),
                additionalNotes: labResult.additionalNotes || '',
                template: null
              });
            }
          } catch (err) {
            console.error('Error processing walk-in result:', err);
          }
        }
      }
    }

    // Get lab technician info
    const labTechnician = await prisma.user.findUnique({
      where: { id: labTechnicianId },
      select: { fullname: true, username: true }
    });

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const formatDateTime = (date) => {
      return new Date(date).toLocaleString('en-US');
    };

    // Get patient and order info (from either batch order or walk-in order)
    const patient = batchOrder?.patient || walkInOrder?.patient;
    const orderDate = batchOrder?.createdAt || walkInOrder?.createdAt;
    const orderStatus = batchOrder?.status || walkInOrder?.status;

    // Build PDF content
    const content = [
      // Header
      {
        text: 'Selihom Medical Clinic',
        style: 'clinicName',
        alignment: 'center',
        margin: [0, 0, 0, 5]
      },
      {
        text: 'Laboratory Test Results',
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 20]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
        margin: [0, 0, 0, 15]
      },

      // Patient Information
      {
        text: 'Patient Information',
        style: 'sectionTitle',
        margin: [0, 0, 0, 10]
      },
      {
        columns: [
          { text: `Name: ${patient.name}`, style: 'field' },
          { text: `ID: ${patient.id}`, style: 'field' },
          { text: `Gender: ${patient.gender || 'N/A'}`, style: 'field' }
        ],
        margin: [0, 0, 0, 5]
      },
      {
        columns: [
          { text: `Age: ${patient.age || 'N/A'}`, style: 'field' },
          { text: `Blood Type: ${patient.bloodType || 'N/A'}`, style: 'field' },
          { text: `Phone: ${patient.mobile || 'N/A'}`, style: 'field' }
        ],
        margin: [0, 0, 0, 15]
      },
      {
        text: `Order ID: ${orderId} | Date: ${formatDate(orderDate)} | Status: ${orderStatus.replace(/_/g, ' ')}`,
        style: 'field',
        margin: [0, 0, 0, 15]
      },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1 }],
        margin: [0, 0, 0, 15]
      },

      // Test Results
      {
        text: 'Laboratory Test Results',
        style: 'sectionTitle',
        margin: [0, 0, 0, 10]
      }
    ];

    // Add each test result - handle both batch orders and walk-in orders
    if (isWalkIn) {
      // Walk-in order results
      walkInResults.forEach((result, index) => {
        content.push({
          text: `${index + 1}. ${result.serviceName}`,
          style: 'testTitle',
          margin: [0, 10, 0, 5]
        });

        // Add template fields if template exists
        if (result.template && result.template.fields) {
          const tableBody = [];
          Object.entries(result.template.fields).forEach(([fieldName, fieldConfig]) => {
            const rawValue = result.results[fieldName];
            const value = (rawValue === null || rawValue === undefined || rawValue === '' || String(rawValue).trim() === '') ? '-' : rawValue;
            const unit = fieldConfig.unit ? ` (${fieldConfig.unit})` : '';
            tableBody.push([
              { text: fieldName + unit, style: 'tableHeader', bold: true },
              { text: String(value), style: 'tableCell' }
            ]);
          });

          content.push({
            table: {
              headerRows: 0,
              widths: ['*', '*'],
              body: tableBody
            },
            style: 'resultsTable',
            margin: [0, 0, 0, 10]
          });
        } else {
          // No template - just show results as key-value pairs
          const tableBody = [];
          Object.entries(result.results).forEach(([key, rawValue]) => {
            const value = (rawValue === null || rawValue === undefined || rawValue === '' || String(rawValue).trim() === '') ? '-' : rawValue;
            tableBody.push([
              { text: key, style: 'tableHeader', bold: true },
              { text: String(value), style: 'tableCell' }
            ]);
          });

          if (tableBody.length > 0) {
            content.push({
              table: {
                headerRows: 0,
                widths: ['*', '*'],
                body: tableBody
              },
              style: 'resultsTable',
              margin: [0, 0, 0, 10]
            });
          }
        }

        // Add additional notes if present
        if (result.additionalNotes) {
          content.push({
            text: `Notes: ${result.additionalNotes}`,
            style: 'notes',
            margin: [0, 0, 0, 10]
          });
        }
      });
    } else {
      // Batch order results
      batchOrder.detailedResults.forEach((result, index) => {
        // Find the service - serviceId in DetailedLabResult refers to BatchOrderService.id
        const service = batchOrder.services.find(s => s.id === result.serviceId);
        const serviceName = service?.service?.name || 'Unknown Test';

        content.push({
          text: `${index + 1}. ${serviceName}`,
          style: 'testTitle',
          margin: [0, 10, 0, 5]
        });

        // Add template fields
        if (result.template && result.template.fields) {
          const tableBody = [];
          Object.entries(result.template.fields).forEach(([fieldName, fieldConfig]) => {
            const rawValue = result.results[fieldName];
            const value = (rawValue === null || rawValue === undefined || rawValue === '' || String(rawValue).trim() === '') ? '-' : rawValue;
            const unit = fieldConfig.unit ? ` (${fieldConfig.unit})` : '';
            tableBody.push([
              { text: fieldName + unit, style: 'tableHeader', bold: true },
              { text: String(value), style: 'tableCell' }
            ]);
          });

          content.push({
            table: {
              headerRows: 0,
              widths: ['*', '*'],
              body: tableBody
            },
            style: 'resultsTable',
            margin: [0, 0, 0, 10]
          });
        }

        // Add additional notes if present
        if (result.additionalNotes) {
          content.push({
            text: `Notes: ${result.additionalNotes}`,
            style: 'notes',
            margin: [0, 0, 0, 10]
          });
        }
      });
    }

    // Footer with lab technician signature
    content.push(
      { text: '', margin: [0, 30, 0, 0] },
      {
        canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2 }],
        margin: [0, 0, 0, 15]
      },
      {
        columns: [
          {
            text: [
              { text: 'Lab Technician: ', style: 'signatureLabel' },
              { text: labTechnician?.fullname || 'N/A', style: 'signatureName' }
            ],
            alignment: 'left'
          },
          {
            text: [
              { text: 'Date: ', style: 'signatureLabel' },
              { text: formatDateTime(new Date()), style: 'signatureName' }
            ],
            alignment: 'right'
          }
        ],
        margin: [0, 10, 0, 10]
      },
      {
        text: 'Signature: _________________________',
        style: 'signatureLabel',
        margin: [0, 20, 0, 5]
      },
      {
        text: 'Stamp:',
        style: 'signatureLabel',
        margin: [0, 10, 0, 0]
      },
      {
        text: 'Selihom Medical Clinic',
        style: 'footer',
        alignment: 'center',
        margin: [0, 20, 0, 0]
      },
      {
        text: `Generated on: ${formatDateTime(new Date())}`,
        style: 'footer',
        alignment: 'center',
        margin: [0, 5, 0, 0]
      }
    );

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: content,
      styles: {
        clinicName: {
          fontSize: 18,
          bold: true,
          color: '#000'
        },
        subheader: {
          fontSize: 14,
          color: '#666'
        },
        sectionTitle: {
          fontSize: 14,
          bold: true,
          color: '#000',
          decoration: 'underline'
        },
        field: {
          fontSize: 11,
          color: '#000'
        },
        testTitle: {
          fontSize: 12,
          bold: true,
          color: '#000'
        },
        resultsTable: {
          fontSize: 10
        },
        tableHeader: {
          fontSize: 10,
          color: '#000',
          fillColor: '#f0f0f0'
        },
        tableCell: {
          fontSize: 10,
          color: '#000'
        },
        notes: {
          fontSize: 10,
          color: '#000',
          italics: true
        },
        signatureLabel: {
          fontSize: 10,
          color: '#666'
        },
        signatureName: {
          fontSize: 12,
          bold: true,
          color: '#000'
        },
        footer: {
          fontSize: 9,
          color: '#666'
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const fileName = `lab-results-${orderId}-${Date.now()}.pdf`;
    const filePath = `uploads/${fileName}`;

    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.end();

    await new Promise((resolve) => {
      pdfDoc.on('end', resolve);
    });

    res.json({
      message: 'PDF generated successfully',
      fileName,
      filePath: `/uploads/${fileName}`,
      order: batchOrder || walkInOrder,
      isWalkIn
    });
  } catch (error) {
    console.error('Error generating lab results PDF:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// NEW LAB TEST SYSTEM - Save Results
// ============================================

// Save lab test result (new system)
exports.saveLabTestResult = async (req, res) => {
  try {
    const { orderId, labTestId, results, additionalNotes } = req.body;
    const labTechnicianId = req.user.id;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }
    
    // Results can be empty object (all fields optional)
    if (results === undefined) {
      return res.status(400).json({ error: 'results object is required (can be empty)' });
    }

    // Get the lab test order
    const order = await prisma.labTestOrder.findUnique({
      where: { id: orderId },
      include: {
        labTest: {
          include: {
            resultFields: {
              orderBy: { displayOrder: 'asc' }
            }
          }
        },
        patient: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Lab test order not found' });
    }

    // All fields are now optional - no validation needed
    // Technicians can skip any field they want

    // Check if result already exists
    const existingResult = await prisma.labTestResult.findUnique({
      where: {
        orderId_testId: {
          orderId: orderId,
          testId: order.labTestId
        }
      }
    });

    let result;
    if (existingResult) {
      // Update existing result
      result = await prisma.labTestResult.update({
        where: { id: existingResult.id },
        data: {
          results: results,
          additionalNotes: additionalNotes || null,
          verifiedBy: labTechnicianId,
          verifiedAt: new Date(),
          status: 'COMPLETED'
        },
        include: {
          test: {
            include: {
              resultFields: true
            }
          }
        }
      });
    } else {
      // Create new result
      result = await prisma.labTestResult.create({
        data: {
          orderId: orderId,
          testId: order.labTestId,
          results: results,
          additionalNotes: additionalNotes || null,
          verifiedBy: labTechnicianId,
          verifiedAt: new Date(),
          status: 'COMPLETED'
        },
        include: {
          test: {
            include: {
              resultFields: true
            }
          }
        }
      });
    }

    // Update order status
    await prisma.labTestOrder.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' }
    });

    // Check if all orders for this visit are completed, then update visit status back to IN_DOCTOR_QUEUE
    if (order.visitId) {
      await checkAndUpdateVisitStatus(order.visitId);
    }

    // Call helper function to check and update visit status
    await checkAndUpdateVisitStatus(order.visitId);

    res.json({
      message: 'Lab test result saved successfully',
      result
    });

  } catch (error) {
    console.error('Error saving lab test result:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to check if all lab orders are completed and update visit status
async function checkAndUpdateVisitStatus(visitId) {
  if (!visitId) return;

  try {
    // Check for active lab test orders (new system)
    const activeLabTestOrders = await prisma.labTestOrder.count({
      where: {
        visitId: visitId,
        status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
      }
    });

    // Check for active old system lab orders
    const activeOldLabOrders = await prisma.labOrder.count({
      where: {
        visitId: visitId,
        status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
      }
    });

    // Check for active batch orders (old system)
    // Only count batch orders that have services OR don't have corresponding labTestOrders
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        visitId: visitId,
        type: { in: ['LAB', 'MIXED'] },
        status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
      },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });

    // Check if batch orders have corresponding labTestOrders (new system)
    const batchOrderIds = batchOrders.map(bo => bo.id);
    let labTestOrdersWithBatchIds = 0;
    if (batchOrderIds.length > 0) {
      labTestOrdersWithBatchIds = await prisma.labTestOrder.count({
        where: {
          visitId: visitId,
          batchOrderId: { in: batchOrderIds }
        }
      });
    }

    // Active batch orders are those that have services (empty batch orders with labTestOrders are replaced)
    const activeBatchOrders = batchOrders.filter(bo => bo._count.services > 0).length;

    const hasActiveLabOrders = activeLabTestOrders > 0 || activeOldLabOrders > 0 || activeBatchOrders > 0;

    if (!hasActiveLabOrders) {
      // All lab orders are completed, check visit status and update if needed
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        select: { status: true }
      });

      if (visit && ['SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
        // Check if there are any pending radiology orders
        const pendingRadiologyOrders = await prisma.radiologyOrder.count({
          where: {
            visitId: visitId,
            status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
          }
        });

        if (pendingRadiologyOrders === 0) {
          // No pending radiology orders, return to doctor queue
          await prisma.visit.update({
            where: { id: visitId },
            data: { status: 'IN_DOCTOR_QUEUE' }
          });
          console.log(`✅ Updated visit ${visitId} status to IN_DOCTOR_QUEUE (all lab orders completed)`);
        } else if (visit.status === 'SENT_TO_LAB') {
          // There are radiology orders pending, update to SENT_TO_BOTH
          await prisma.visit.update({
            where: { id: visitId },
            data: { status: 'SENT_TO_BOTH' }
          });
          console.log(`✅ Updated visit ${visitId} status to SENT_TO_BOTH (lab completed, radiology pending)`);
        }
      }
    }
  } catch (error) {
    console.error(`Error checking/updating visit status for visit ${visitId}:`, error);
  }
}
