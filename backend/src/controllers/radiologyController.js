const prisma = require('../config/database');
const { z } = require('zod');
const { checkVisitInvestigationCompletion } = require('../utils/investigationUtils');

// Validation schemas
const fillReportSchema = z.object({
  orderId: z.number(),
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
    // Get batch orders instead of individual radiology orders
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
            status: true
          }
        },
        attachments: true
      },
      orderBy: [
        { createdAt: 'asc' } // First come, first served
      ]
    });
    res.json({ batchOrders });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.fillReport = async (req, res) => {
  try {
    const { orderId, result, additionalNotes, attachments } = fillReportSchema.parse(req.body);
    const radiologistId = req.user.id;

    // Check if batch order exists and is in correct status
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: orderId },
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
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        },
        attachments: true
      }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Radiology batch order not found' });
    }

    if (batchOrder.status !== 'QUEUED') {
      return res.status(400).json({ error: 'Order is not in queue for processing' });
    }

    // Update batch order with result
    const updatedBatchOrder = await prisma.batchOrder.update({
      where: { id: orderId },
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

    // Update individual service results
    for (const service of batchOrder.services) {
      await prisma.batchOrderService.update({
        where: { id: service.id },
        data: {
          result: result || 'No result provided',
          status: 'COMPLETED'
        }
      });
    }

    // Handle file attachments if provided
    if (attachments && attachments.length > 0) {
      for (const attachment of attachments) {
        await prisma.file.create({
          data: {
            patientId: batchOrder.patientId,
            batchOrderId: orderId,
            path: attachment.path,
            type: attachment.type,
            accessLog: JSON.stringify([{
              accessedAt: new Date(),
              accessedBy: radiologistId,
              action: 'UPLOADED'
            }])
          }
        });
      }
    }

    // Create medical history entry
    await prisma.medicalHistory.create({
      data: {
        patientId: batchOrder.patientId,
        details: JSON.stringify({ 
          type: 'RADIOLOGY_RESULT',
          batchOrderId: batchOrder.id,
          services: batchOrder.services.map(s => s.investigationType?.name).join(', '),
          result: result,
          additionalNotes: additionalNotes,
          completedAt: new Date(),
          completedBy: radiologistId
        })
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: radiologistId,
        action: 'FILL_RADIOLOGY_REPORT',
        entity: 'BatchOrder',
        entityId: batchOrder.id,
        details: JSON.stringify({
          batchOrderId: batchOrder.id,
          patientId: batchOrder.patientId,
          services: batchOrder.services.map(s => s.investigationType?.name).join(', '),
          result: result,
          additionalNotes: additionalNotes
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Check if all investigations for this visit are completed
    try {
      const completionResult = await checkVisitInvestigationCompletion(batchOrder.visitId);
      console.log(`📋 Visit ${batchOrder.visitId} completion check result:`, completionResult.isComplete);
    } catch (error) {
      console.error('Error checking investigation completion:', error);
      
      // Fallback: manually check and update if needed
      try {
        const visit = await prisma.visit.findUnique({
          where: { id: batchOrder.visitId },
          include: { batchOrders: true }
        });
        
        if (visit && visit.batchOrders.every(order => order.status === 'COMPLETED')) {
          await prisma.visit.update({
            where: { id: batchOrder.visitId },
            data: {
              status: 'AWAITING_RESULTS_REVIEW',
              queueType: 'RESULTS_REVIEW',
              updatedAt: new Date()
            }
          });
          console.log(`🔄 Fallback: Visit ${batchOrder.visitId} updated to AWAITING_RESULTS_REVIEW`);
        }
      } catch (fallbackError) {
        console.error('Fallback visit update failed:', fallbackError?.message || fallbackError);
      }
    }

    res.json({
      message: 'Radiology report completed successfully',
      batchOrder: updatedBatchOrder
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInvestigationTypes = async (req, res) => {
  try {
    const types = await prisma.investigationType.findMany({ 
      where: { category: 'RADIOLOGY' },
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

    // Check if order exists
    const order = await prisma.radiologyOrder.findUnique({
      where: { id: parseInt(orderId) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Radiology order not found' });
    }

    // Create file record
    const fileRecord = await prisma.file.create({
      data: {
        patientId: order.patientId,
        radiologyOrderId: order.id,
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
    res.status(500).json({ error: error.message });
  }
};

// New per-test result management functions
const createRadiologyResultSchema = z.object({
  orderId: z.number(),
  testTypeId: z.number(),
  resultText: z.string().optional(),
  additionalNotes: z.string().optional()
});

exports.createRadiologyResult = async (req, res) => {
  try {
    const data = createRadiologyResultSchema.parse(req.body);
    const radiologistId = req.user.id;

    // Check if radiology order exists and is in correct status
    const radiologyOrder = await prisma.radiologyOrder.findUnique({
      where: { id: data.orderId },
      include: {
        patient: true,
        visit: true
      }
    });

    if (!radiologyOrder) {
      return res.status(404).json({ error: 'Radiology order not found' });
    }

    if (radiologyOrder.status !== 'QUEUED' && radiologyOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Radiology order is not in correct status for result entry' });
    }

    // Create radiology result
    const radiologyResult = await prisma.radiologyResult.create({
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

    // Update radiology order status if this is the last result
    const allResults = await prisma.radiologyResult.findMany({
      where: { orderId: data.orderId }
    });

    if (allResults.length > 0) {
      await prisma.radiologyOrder.update({
        where: { id: data.orderId },
        data: { status: 'COMPLETED' }
      });

      // Check if all investigations for this visit are completed
      try {
        await checkVisitInvestigationCompletion(radiologyOrder.visitId);
      } catch (error) {
        console.error('Error checking investigation completion:', error);
        // Don't fail the request if investigation completion check fails
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: radiologistId,
        action: 'CREATE_RADIOLOGY_RESULT',
        entity: 'RadiologyResult',
        entityId: radiologyResult.id,
        details: JSON.stringify({
          orderId: data.orderId,
          testTypeId: data.testTypeId,
          resultText: data.resultText
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ radiologyResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadRadiologyResultFile = async (req, res) => {
  try {
    const { resultId } = req.params;
    const file = req.file;
    const radiologistId = req.user.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if radiology result exists
    const radiologyResult = await prisma.radiologyResult.findUnique({
      where: { id: resultId },
      include: {
        order: {
          include: {
            patient: true
          }
        }
      }
    });

    if (!radiologyResult) {
      return res.status(404).json({ error: 'Radiology result not found' });
    }

    // Create file record
    const radiologyResultFile = await prisma.radiologyResultFile.create({
      data: {
        resultId: resultId,
        fileUrl: file.path,
        fileName: file.originalname,
        fileType: file.mimetype,
        uploadedBy: radiologistId
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: radiologistId,
        action: 'UPLOAD_RADIOLOGY_RESULT_FILE',
        entity: 'RadiologyResultFile',
        entityId: radiologyResultFile.id,
        details: JSON.stringify({
          resultId: resultId,
          fileName: file.originalname,
          fileType: file.mimetype
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({ radiologyResultFile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRadiologyResults = async (req, res) => {
  try {
    const { orderId } = req.params;

    const radiologyResults = await prisma.radiologyResult.findMany({
      where: { orderId: parseInt(orderId) },
      include: {
        testType: true,
        attachments: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ radiologyResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// New batch order radiology result functions
exports.createBatchRadiologyResult = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    const { testTypeId, resultText, additionalNotes } = req.body;
    const radiologistId = req.user.id;

    // Check if batch order exists and is in correct status
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(batchOrderId) },
      include: {
        services: {
          include: {
            investigationType: true
          }
        },
        patient: true,
        visit: true
      }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Batch order not found' });
    }

    if (!['QUEUED', 'IN_PROGRESS', 'COMPLETED'].includes(batchOrder.status)) {
      return res.status(400).json({ error: 'Order must be queued, in progress, or completed to add results' });
    }

    // Verify the test type is part of this batch order
    const serviceExists = batchOrder.services.some(service => 
      service.investigationType && 
      service.investigationType.id === testTypeId && 
      service.investigationType.category === 'RADIOLOGY'
    );

    if (!serviceExists) {
      return res.status(400).json({ error: 'Test type is not part of this batch order' });
    }

    // Check if result already exists for this test type
    const existingResult = await prisma.radiologyResult.findFirst({
      where: {
        batchOrderId: parseInt(batchOrderId),
        testTypeId: testTypeId
      }
    });

    if (existingResult) {
      return res.status(400).json({ error: 'Result already exists for this test type' });
    }

    // Create radiology result directly linked to batch order
    const radiologyResult = await prisma.radiologyResult.create({
      data: {
        batchOrderId: parseInt(batchOrderId),
        testTypeId: testTypeId,
        resultText: resultText,
        additionalNotes: additionalNotes,
        status: 'COMPLETED'
      },
      include: {
        testType: true,
        attachments: true
      }
    });

    // Check if all radiology tests in this batch order are completed
    const radiologyServices = batchOrder.services.filter(service => 
      service.investigationType && service.investigationType.category === 'RADIOLOGY'
    );

    let allServicesCompleted = true;
    for (const service of radiologyServices) {
      const result = await prisma.radiologyResult.findFirst({
        where: {
          testTypeId: service.investigationType.id,
          batchOrderId: parseInt(batchOrderId)
        }
      });
      if (!result) {
        allServicesCompleted = false;
        break;
      }
    }

    // If all radiology tests are completed, update batch order status
    if (allServicesCompleted) {
      await prisma.batchOrder.update({
        where: { id: parseInt(batchOrderId) },
        data: {
          status: 'COMPLETED',
          result: resultText, // Use the latest result as general result
          additionalNotes: additionalNotes,
          updatedAt: new Date()
        }
      });

      // Check if all investigations for this visit are completed
      try {
        await checkVisitInvestigationCompletion(batchOrder.visitId);
      } catch (error) {
        console.error('Error checking investigation completion:', error);
      }
    }

    res.json({
      message: 'Radiology result created successfully',
      radiologyResult: radiologyResult
    });

  } catch (error) {
    console.error('Error creating batch radiology result:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.uploadBatchRadiologyResultFile = async (req, res) => {
  try {
    const { batchOrderId, resultId } = req.params;
    const file = req.file;
    const radiologistId = req.user.id;

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if radiology result exists and belongs to the batch order
    const radiologyResult = await prisma.radiologyResult.findFirst({
      where: { 
        id: resultId,
        batchOrderId: parseInt(batchOrderId)
      }
    });

    if (!radiologyResult) {
      return res.status(404).json({ error: 'Radiology result not found' });
    }

    // Create file record
    const fileRecord = await prisma.radiologyResultFile.create({
      data: {
        resultId: resultId,
        fileUrl: file.path,
        fileName: file.originalname,
        fileType: file.mimetype,
        uploadedBy: radiologistId
      }
    });

    res.json({
      message: 'File uploaded successfully',
      file: fileRecord
    });

  } catch (error) {
    console.error('Error uploading batch radiology result file:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getBatchRadiologyResults = async (req, res) => {
  try {
    const { batchOrderId } = req.params;

    // Get the batch order to find the visit and patient
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(batchOrderId) },
      include: {
        services: {
          include: {
            investigationType: true
          }
        }
      }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Batch order not found' });
    }

    // Get radiology results for this batch order
    const radiologyResults = await prisma.radiologyResult.findMany({
      where: {
        batchOrderId: parseInt(batchOrderId)
      },
      include: {
        testType: true,
        attachments: true,
        batchOrder: true
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ radiologyResults });

  } catch (error) {
    console.error('Error fetching batch radiology results:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.completeBatchRadiologyOrder = async (req, res) => {
  try {
    const { batchOrderId } = req.params;
    const radiologistId = req.user.id;

    // Get the batch order
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: parseInt(batchOrderId) },
      include: {
        services: {
          include: {
            investigationType: true
          }
        },
        visit: true
      }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Batch order not found' });
    }

    if (batchOrder.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Batch order is already completed' });
    }

    // Update batch order status to completed
    const updatedBatchOrder = await prisma.batchOrder.update({
      where: { id: parseInt(batchOrderId) },
      data: {
        status: 'COMPLETED',
        updatedAt: new Date()
      },
      include: {
        services: {
          include: {
            investigationType: true
          }
        },
        visit: true
      }
    });

    // Check if all investigations for this visit are completed
    try {
      const { checkVisitInvestigationCompletion } = require('../utils/investigationUtils');
      await checkVisitInvestigationCompletion(batchOrder.visitId);
    } catch (error) {
      console.error('Error checking investigation completion:', error);
      // Don't fail the request if investigation completion check fails
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: radiologistId,
        action: 'COMPLETE_RADIOLOGY_BATCH_ORDER',
        entity: 'BatchOrder',
        entityId: parseInt(batchOrderId),
        details: JSON.stringify({
          batchOrderId: parseInt(batchOrderId),
          visitId: batchOrder.visitId,
          services: batchOrder.services.map(s => s.investigationType?.name).join(', ')
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Radiology batch order completed successfully',
      batchOrder: updatedBatchOrder
    });

  } catch (error) {
    console.error('Error completing radiology batch order:', error);
    res.status(500).json({ error: error.message });
  }
};