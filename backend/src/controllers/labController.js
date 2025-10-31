const prisma = require('../config/database');
const { z } = require('zod');

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

// Get lab orders (batch orders + walk-in orders)
exports.getOrders = async (req, res) => {
  try {
    // Get batch orders
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

    res.json({ batchOrders, walkInOrders: groupedWalkInOrders });
  } catch (error) {
    console.error('Error fetching lab orders:', error);
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

    // Prefer walk-in orders if present to avoid ID collisions with batch orders
    let labOrder = await prisma.labOrder.findUnique({
      where: { id: data.labOrderId },
      include: {
        patient: true,
        type: true
      }
    });

    let isWalkIn = !!labOrder?.isWalkIn;

    if (labOrder && isWalkIn) {
      // For walk-in orders, save to LabResult model immediately
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
      return; // walk-in handled
    }

    // Otherwise, handle batch order flow
    const batchOrder = await prisma.batchOrder.findUnique({
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

    if (!batchOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Check if service exists in this batch order
    // Frontend may send either the batchOrderService.id or the underlying serviceId/investigationTypeId
    const numericServiceId = typeof data.serviceId === 'string' ? parseInt(data.serviceId, 10) : data.serviceId;
    let service = batchOrder.services.find(s => s.id === numericServiceId);
    if (!service) service = batchOrder.services.find(s => s.serviceId === data.serviceId);
    if (!service && data.investigationTypeId) service = batchOrder.services.find(s => s.investigationTypeId === data.investigationTypeId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found in this order' });
    }

    // Check if template exists
    const template = await prisma.labTestTemplate.findUnique({
      where: { id: data.templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Lab template not found' });
    }

    // Check if result already exists for this service
    const existingResult = await prisma.detailedLabResult.findFirst({
      where: {
        labOrderId: data.labOrderId,
        serviceId: service.id,
        templateId: data.templateId
      }
    });

    if (existingResult) {
      // Update existing result
      const updatedResult = await prisma.detailedLabResult.update({
        where: { id: existingResult.id },
        data: {
          results: data.results,
          additionalNotes: data.additionalNotes,
          updatedAt: new Date()
        }
      });

      res.json({
        message: 'Lab result updated successfully',
        result: updatedResult
      });
    } else {
      // Create new result
      const newResult = await prisma.detailedLabResult.create({
        data: {
          labOrderId: data.labOrderId,
          serviceId: service.id,
          templateId: data.templateId,
          results: data.results,
          additionalNotes: data.additionalNotes
        }
      });

      res.json({
        message: 'Lab result saved successfully',
        result: newResult
      });
    }

    // Update service status to COMPLETED when result is saved
    await prisma.batchOrderService.update({
      where: { id: service.id },
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
    
    const detailedResults = await prisma.detailedLabResult.findMany({
      where: {
        labOrderId: parseInt(orderId)
      },
      include: {
        template: true
      },
      orderBy: { createdAt: 'desc' }
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

    // Check if all investigations (lab + radiology) are completed before setting AWAITING_RESULTS_REVIEW
    // This allows multiple rounds of tests - only set AWAITING_RESULTS_REVIEW when ALL are done
    const { checkVisitInvestigationCompletion } = require('../utils/investigationUtils');
    try {
      await checkVisitInvestigationCompletion(batchOrder.visitId);
    } catch (completionError) {
      console.error('Error checking investigation completion:', completionError);
      // If check fails, still update status to AWAITING_RESULTS_REVIEW as fallback
      // (in case this is the only order)
      await prisma.visit.update({
        where: { id: batchOrder.visitId },
        data: { status: 'AWAITING_RESULTS_REVIEW' }
      });
    }

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

    res.json({
      message: 'Lab results sent to doctor successfully',
      batchOrderId: parseInt(labOrderId),
      visitStatus: 'AWAITING_RESULTS_REVIEW'
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
