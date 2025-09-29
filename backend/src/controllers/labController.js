const prisma = require('../config/database');
const { z } = require('zod');
const { checkVisitInvestigationCompletion } = require('../utils/investigationUtils');

// Validation schemas
const fillResultSchema = z.object({
  result: z.string(),
  additionalNotes: z.string().optional(),
  attachments: z.array(z.object({
    path: z.string(),
    type: z.string(),
    originalName: z.string()
  })).optional(),
});

exports.getOrders = async (req, res) => {
  try {
    // Get batch orders instead of individual lab orders
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
            status: true,
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

exports.fillResult = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { result, additionalNotes, serviceResults } = req.body;

    console.log('Lab result submission:', { orderId, result, additionalNotes, serviceResults });

    // Update batch order
    const updatedBatchOrder = await prisma.batchOrder.update({
      where: { id: parseInt(orderId) },
      data: {
        result: result || 'No result provided',
        additionalNotes: additionalNotes || '',
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

    // Check if all investigations for this visit are completed
    try {
      await checkVisitInvestigationCompletion(updatedBatchOrder.visitId);
    } catch (error) {
      console.error('Error checking investigation completion:', error);
      // Don't fail the request if investigation completion check fails
    }

    res.json({
      message: 'Lab result recorded successfully',
      batchOrder: updatedBatchOrder
    });
  } catch (error) {
    console.error('Fill result error:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getInvestigationTypes = async (req, res) => {
  try {
    const types = await prisma.investigationType.findMany({ 
      where: { category: 'LAB' },
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            category: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ types });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if batch order exists
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(orderId) },
      include: { patient: true }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Create file record
    const fileRecord = await prisma.file.create({
      data: {
        patientId: batchOrder.patientId,
        batchOrderId: batchOrder.id,
        path: file.path,
        type: file.mimetype,
        accessLog: [`Uploaded by ${req.user.fullname} at ${new Date().toISOString()}`]
      }
    });

    res.json({
      message: 'File uploaded successfully',
      file: fileRecord
    });
  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Test endpoint to bypass validation issues
exports.testResult = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('Test endpoint called with orderId:', orderId);
    console.log('Request body:', req.body);
    
    res.json({
      message: 'Test endpoint working',
      orderId: orderId,
      body: req.body,
      user: req.user.id
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
};

// New per-test result management functions
const createLabResultSchema = z.object({
  orderId: z.number(),
  testTypeId: z.number(),
  resultText: z.string().optional(),
  additionalNotes: z.string().optional()
});

const uploadLabResultFileSchema = z.object({
  resultId: z.string(),
  fileUrl: z.string(),
  fileName: z.string().optional(),
  fileType: z.string().optional()
});

exports.createLabResult = async (req, res) => {
  try {
    const data = createLabResultSchema.parse(req.body);
    const technicianId = req.user.id;

    // Check if lab order exists and is in correct status
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: data.orderId },
      include: {
        patient: true,
        visit: true
      }
    });

    if (!labOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    if (labOrder.status !== 'QUEUED' && labOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Lab order is not in correct status for result entry' });
    }

    // Create lab result
    const labResult = await prisma.labResult.create({
      data: {
        orderId: data.orderId,
        testTypeId: data.testTypeId,
        resultText: data.resultText,
        additionalNotes: data.additionalNotes,
        status: 'COMPLETED'
      },
      include: {
        testType: true,
        attachments: true
      }
    });

    // Update lab order status if this is the last result
    const allResults = await prisma.labResult.findMany({
      where: { orderId: data.orderId }
    });

    if (allResults.length > 0) {
      await prisma.labOrder.update({
        where: { id: data.orderId },
        data: { status: 'COMPLETED' }
      });

      // Check if all investigations for this visit are completed
      try {
        await checkVisitInvestigationCompletion(labOrder.visitId);
      } catch (error) {
        console.error('Error checking investigation completion:', error);
        // Don't fail the request if investigation completion check fails
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: technicianId,
        action: 'CREATE_LAB_RESULT',
        entity: 'LabResult',
        entityId: labResult.id,
        details: JSON.stringify({
          orderId: data.orderId,
          testTypeId: data.testTypeId,
          resultText: data.resultText
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ labResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadLabResultFile = async (req, res) => {
  try {
    const { resultId } = req.params;
    const file = req.file;
    const technicianId = req.user.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if lab result exists
    const labResult = await prisma.labResult.findUnique({
      where: { id: resultId },
      include: {
        order: {
          include: {
            patient: true
          }
        }
      }
    });

    if (!labResult) {
      return res.status(404).json({ error: 'Lab result not found' });
    }

    // Create file record
    const labResultFile = await prisma.labResultFile.create({
      data: {
        resultId: resultId,
        fileUrl: file.path,
        fileName: file.originalname,
        fileType: file.mimetype,
        uploadedBy: technicianId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: technicianId,
        action: 'UPLOAD_LAB_RESULT_FILE',
        entity: 'LabResultFile',
        entityId: labResultFile.id,
        details: JSON.stringify({
          resultId: resultId,
          fileName: file.originalname,
          fileType: file.mimetype
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ labResultFile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLabResults = async (req, res) => {
  try {
    const { orderId } = req.params;

    const labResults = await prisma.labResult.findMany({
      where: { orderId: parseInt(orderId) },
      include: {
        testType: true,
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ labResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};