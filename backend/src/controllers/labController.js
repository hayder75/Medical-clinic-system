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

// New validation schema for detailed lab results
const detailedLabResultSchema = z.object({
  labOrderId: z.number().int(),
  templateId: z.string(),
  results: z.record(z.string(), z.any()), // JSON object with field values
  additionalNotes: z.string().optional(),
});

// Get lab test templates
exports.getLabTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    
    let whereClause = { isActive: true };
    if (category) {
      whereClause.category = category;
    }

    const templates = await prisma.labTestTemplate.findMany({
      where: whereClause,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get specific lab test template
exports.getLabTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;

    const template = await prisma.labTestTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Lab template not found' });
    }

    res.json({ template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit detailed lab results
exports.submitDetailedResults = async (req, res) => {
  try {
    const data = detailedLabResultSchema.parse(req.body);
    const labTechnicianId = req.user.id;

    // Check if batch order exists (using the current system structure)
    const batchOrder = await prisma.batchOrder.findUnique({
      where: { id: data.labOrderId },
      include: {
        visit: true,
        patient: true,
        services: {
          include: {
            service: true,
            investigationType: true
          }
        }
      }
    });

    if (!batchOrder) {
      return res.status(404).json({ error: 'Lab order not found' });
    }

    // Check if template exists
    const template = await prisma.labTestTemplate.findUnique({
      where: { id: data.templateId }
    });

    if (!template) {
      return res.status(404).json({ error: 'Lab template not found' });
    }

    // Validate results against template fields
    const validationErrors = validateLabResults(data.results, template.fields);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation errors in lab results',
        validationErrors 
      });
    }

    // Create detailed lab result for the batch order
    const detailedResult = await prisma.detailedLabResult.create({
      data: {
        labOrderId: data.labOrderId,
        templateId: data.templateId,
        results: data.results,
        additionalNotes: data.additionalNotes,
        status: 'COMPLETED',
        verifiedBy: labTechnicianId,
        verifiedAt: new Date()
      }
    });

    // Update batch order status
    await prisma.batchOrder.update({
      where: { id: data.labOrderId },
      data: { 
        status: 'COMPLETED',
        result: `Lab results completed for ${template.name}`,
        additionalNotes: data.additionalNotes
      }
    });

    // Ensure visit status is moved to AWAITING_RESULTS_REVIEW if all investigations are done
    try {
      const completionResult = await checkVisitInvestigationCompletion(batchOrder.visitId);
      console.log(`📋 Visit ${batchOrder.visitId} completion check result:`, completionResult.isComplete);
    } catch (e) {
      // Safely log but do not block response
      console.error('checkVisitInvestigationCompletion failed:', e?.message || e);
      
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
      message: 'Detailed lab results submitted successfully',
      result: detailedResult
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get detailed lab results for a batch order
exports.getDetailedResults = async (req, res) => {
  try {
    const { labOrderId } = req.params;

    const detailedResults = await prisma.detailedLabResult.findMany({
      where: { labOrderId: parseInt(labOrderId) },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            fields: true
          }
        }
      }
    });

    res.json({ detailedResults });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to validate lab results against template fields
function validateLabResults(results, templateFields) {
  const errors = [];
  
  templateFields.forEach(field => {
    const value = results[field.name];
    
    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: field.name,
        message: `${field.label} is required`
      });
      return;
    }

    // Skip validation if field is not required and empty
    if (!field.required && (value === undefined || value === null || value === '')) {
      return;
    }

    // Validate number fields
    if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        errors.push({
          field: field.name,
          message: `${field.label} must be a valid number`
        });
        return;
      }

      if (field.min !== undefined && numValue < field.min) {
        errors.push({
          field: field.name,
          message: `${field.label} value (${numValue}) is below minimum (${field.min})`
        });
      }

      if (field.max !== undefined && numValue > field.max) {
        errors.push({
          field: field.name,
          message: `${field.label} value (${numValue}) is above maximum (${field.max})`
        });
      }
    }

    // Validate select fields
    if (field.type === 'select' && field.options && !field.options.includes(value)) {
      errors.push({
        field: field.name,
        message: `${field.label} must be one of: ${field.options.join(', ')}`
      });
    }
  });

  return errors;
}

// Helper function to update lab order status
async function updateLabOrderStatus(labOrderId) {
  // Check if all detailed results are completed
  const pendingResults = await prisma.detailedLabResult.count({
    where: {
      labOrderId: labOrderId,
      status: { not: 'COMPLETED' }
    }
  });

  if (pendingResults === 0) {
    // Update lab order status to completed
    await prisma.labOrder.update({
      where: { id: labOrderId },
      data: { status: 'COMPLETED' }
    });

    // Update visit status if all lab orders are completed
    const labOrder = await prisma.labOrder.findUnique({
      where: { id: labOrderId },
      include: { visit: true }
    });

    if (labOrder) {
      const pendingLabOrders = await prisma.labOrder.count({
        where: {
          visitId: labOrder.visitId,
          status: { not: 'COMPLETED' }
        }
      });

      if (pendingLabOrders === 0) {
        await prisma.visit.update({
          where: { id: labOrder.visitId },
          data: { status: 'RETURNED_WITH_RESULTS' }
        });
      }
    }
  }
}

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
          // Update batch order service
          await prisma.batchOrderService.update({
            where: { id: serviceResult.batchOrderServiceId },
            data: {
              result: serviceResult.result,
              status: 'COMPLETED'
            }
          });
          
          // Create separate LabResult record for consistency with radiology system
          const batchOrderService = await prisma.batchOrderService.findUnique({
            where: { id: serviceResult.batchOrderServiceId },
            include: {
              investigationType: true
            }
          });
          
          if (batchOrderService && batchOrderService.investigationType) {
            await prisma.labResult.create({
              data: {
                orderId: parseInt(orderId),
                testTypeId: batchOrderService.investigationType.id,
                resultText: serviceResult.result,
                additionalNotes: serviceResult.additionalNotes || '',
                status: 'COMPLETED'
              }
            });
          }
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