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

// Get lab orders (batch orders)
exports.getOrders = async (req, res) => {
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
            status: true
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

    res.json({ batchOrders });
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

    // Check if batch order exists
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
    const service = batchOrder.services.find(s => s.id === data.serviceId);
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

    // Update service status to IN_PROGRESS if it was QUEUED
    if (service.status === 'QUEUED') {
      await prisma.batchOrderService.update({
        where: { id: data.serviceId },
        data: { status: 'IN_PROGRESS' }
      });
    }

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
    const allServicesHaveResults = batchOrder.services.every(service => {
      return service.status === 'COMPLETED' || service.status === 'IN_PROGRESS';
    });

    if (!allServicesHaveResults) {
      return res.status(400).json({ error: 'All services must have results before sending to doctor' });
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

    // Update visit status to AWAITING_RESULTS_REVIEW
    await prisma.visit.update({
      where: { id: batchOrder.visitId },
      data: { status: 'AWAITING_RESULTS_REVIEW' }
    });

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
