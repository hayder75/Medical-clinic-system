const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createBatchOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  type: z.enum(['LAB', 'RADIOLOGY', 'MIXED']),
  instructions: z.string().optional(),
  services: z.array(z.object({
    serviceId: z.string(),
    investigationTypeId: z.number().optional(),
    instructions: z.string().optional()
  })).min(1, 'At least one service is required')
});

// Create a batch order
exports.createBatchOrder = async (req, res) => {
  try {
    const { visitId, patientId, type, instructions, services } = createBatchOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is in correct status
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Validate all services exist
    const serviceIds = services.map(s => s.serviceId);
    const investigationTypeIds = services.map(s => s.investigationTypeId).filter(Boolean);
    
    console.log('Debug - serviceIds:', serviceIds);
    console.log('Debug - investigationTypeIds:', investigationTypeIds);
    
    const [validServices, validInvestigationTypes] = await Promise.all([
      prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true, price: true, category: true }
      }),
      investigationTypeIds.length > 0 ? prisma.investigationType.findMany({
        where: { id: { in: investigationTypeIds } },
        select: { id: true, name: true, price: true, category: true, serviceId: true }
      }) : []
    ]);

    console.log('Debug - validServices:', validServices);
    console.log('Debug - validInvestigationTypes:', validInvestigationTypes);
    console.log('Debug - service count match:', validServices.length === serviceIds.length);
    console.log('Debug - investigation type count match:', validInvestigationTypes.length === investigationTypeIds.length);

    if (validServices.length !== serviceIds.length) {
      return res.status(404).json({ error: 'One or more services not found' });
    }

    if (investigationTypeIds.length > 0 && validInvestigationTypes.length !== investigationTypeIds.length) {
      return res.status(404).json({ error: 'One or more investigation types not found' });
    }

    // Calculate total amount
    const totalAmount = services.reduce((total, service) => {
      const serviceData = validServices.find(s => s.id === service.serviceId);
      const investigationData = service.investigationTypeId ? 
        validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
      
      // Use investigation type price if available, otherwise service price
      const price = investigationData ? investigationData.price : serviceData.price;
      return total + price;
    }, 0);

    // Create batch order with services
    const batchOrder = await prisma.batchOrder.create({
      data: {
        visitId,
        patientId,
        doctorId,
        type,
        instructions,
        status: 'UNPAID',
        services: {
          create: services.map(service => ({
            serviceId: service.serviceId,
            investigationTypeId: service.investigationTypeId || null,
            instructions: service.instructions || null
          }))
        }
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
            type: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        }
      }
    });

    // Create billing for the batch order
    const billing = await prisma.billing.create({
      data: {
        patientId,
        visitId,
        totalAmount,
        status: 'PENDING',
        notes: `Batch ${type.toLowerCase()} order - ${services.length} service(s)`,
        services: {
          create: services.map(service => {
            const serviceData = validServices.find(s => s.id === service.serviceId);
            const investigationData = service.investigationTypeId ? 
              validInvestigationTypes.find(i => i.id === service.investigationTypeId) : null;
            const price = investigationData ? investigationData.price : serviceData.price;
            
            return {
              serviceId: service.serviceId,
              quantity: 1,
              unitPrice: price,
              totalPrice: price
            };
          })
        }
      }
    });

    // Update visit status based on order type
    let newStatus = visit.status;
    if (type === 'LAB') {
      newStatus = 'SENT_TO_LAB';
    } else if (type === 'RADIOLOGY') {
      newStatus = 'SENT_TO_RADIOLOGY';
    } else if (type === 'MIXED') {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    res.status(201).json({
      message: 'Batch order created successfully',
      batchOrder,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount
      },
      visitStatus: newStatus
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get batch orders for lab department
exports.getLabBatchOrders = async (req, res) => {
  try {
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        OR: [
          { type: 'LAB' },
          { type: 'MIXED' }
        ],
        status: {
          in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
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
            vitals: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ batchOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get batch orders for radiology department
exports.getRadiologyBatchOrders = async (req, res) => {
  try {
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        OR: [
          { type: 'RADIOLOGY' },
          { type: 'MIXED' }
        ],
        status: {
          in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
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
            vitals: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ batchOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update batch order results
exports.updateBatchOrderResults = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    const { result, additionalNotes, serviceResults } = req.body;

    // Update batch order
    const updatedBatchOrder = await prisma.batchOrder.update({
      where: { id: parseInt(batchOrderId) },
      data: {
        result: result || null,
        additionalNotes: additionalNotes || null,
        status: 'COMPLETED',
        updatedAt: new Date()
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
            type: true
          }
        },
        doctor: {
          select: {
            id: true,
            fullname: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        }
      }
    });

    // Update individual service results if provided
    if (serviceResults && Array.isArray(serviceResults)) {
      for (const serviceResult of serviceResults) {
        if (serviceResult.batchOrderServiceId && serviceResult.result) {
          await prisma.batchOrderService.update({
            where: { id: serviceResult.batchOrderServiceId },
            data: {
              result: serviceResult.result,
              status: 'COMPLETED'
            }
          });
        }
      }
    }

    res.json({
      message: 'Batch order results updated successfully',
      batchOrder: updatedBatchOrder
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload attachment for batch order
exports.uploadBatchOrderAttachment = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the batch order to find the patientId
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(batchOrderId) },
      select: { patientId: true }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Batch order not found' });
    }

    const file = await prisma.file.create({
      data: {
        patientId: batchOrder.patientId,
        path: req.file.path,
        type: req.file.mimetype,
        batchOrderId: parseInt(batchOrderId),
        accessLog: [JSON.stringify({
          action: 'UPLOADED',
          timestamp: new Date().toISOString(),
          userId: req.user.id
        })]
      }
    });

    res.json({
      message: 'File uploaded successfully',
      file: {
        id: file.id,
        path: file.path,
        type: file.type
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
