const prisma = require('../config/database');
const { z } = require('zod');
const { checkMedicationOrderingAllowed } = require('../utils/investigationUtils');

// Validation schemas
const labOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  typeId: z.number(),
  instructions: z.string().optional(),
});

const multipleLabOrdersSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  orders: z.array(z.object({
    typeId: z.number(),
    instructions: z.string().optional(),
  })).min(1, 'At least one order is required'),
});

const radiologyOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  typeId: z.number(),
  instructions: z.string().optional(),
});

const createMultipleRadiologyOrdersSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  orders: z.array(z.object({
    typeId: z.number(),
    instructions: z.string().optional(),
  })).min(1, 'At least one radiology order is required'),
});

const medicationOrderSchema = z.object({
  visitId: z.number(),
  patientId: z.string(),
  name: z.string(),
  dosageForm: z.string(),
  strength: z.string(),
  quantity: z.number(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string(),
  additionalNotes: z.string().optional(),
  category: z.enum(['TABLETS', 'CAPSULES', 'INJECTIONS', 'SYRUPS', 'OINTMENTS', 'DROPS', 'INHALERS', 'PATCHES', 'INFUSIONS']).optional(),
  isContinuousInfusion: z.boolean().optional(),
  continuousInfusionDays: z.number().optional(),
  dailyDose: z.string().optional(),
});

const selectVisitSchema = z.object({
  visitId: z.number(),
});

const updateVisitSchema = z.object({
  diagnosis: z.string().optional(),
  diagnosisDetails: z.string().optional(),
  instructions: z.string().optional(),
});

const completeVisitSchema = z.object({
  visitId: z.number(),
  diagnosis: z.string(),
  diagnosisDetails: z.string().optional(), // Rich text diagnosis details
  instructions: z.string().optional(), // Patient instructions
  finalNotes: z.string().optional(),
  needsAppointment: z.boolean().optional(),
  appointmentDate: z.string().optional(),
  appointmentTime: z.string().optional(),
  appointmentNotes: z.string().optional(),
});

exports.getQueue = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get visits assigned to this doctor that are waiting for doctor review or returned with results
    const queue = await prisma.visit.findMany({
      where: { 
        status: {
          in: ['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW']
        },
        assignmentId: {
          not: null
        }
      },
      include: {
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          } 
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                service: true,
                investigationType: true
              }
            }
          }
        },
        medicationOrders: true,
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        }
      },
      orderBy: [
        { createdAt: 'asc' } // First come, first served
      ]
    });

    res.json({ queue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResultsQueue = async (req, res) => {
  try {
    const doctorId = req.user.id;
    
    // Get visits assigned to this doctor that have results ready for review
    const resultsQueue = await prisma.visit.findMany({
      where: { 
        status: 'AWAITING_RESULTS_REVIEW',
        queueType: 'RESULTS_REVIEW',
        assignmentId: {
          not: null
        }
      },
      include: {
        patient: { 
          select: { 
            id: true, 
            name: true, 
            type: true,
            mobile: true,
            email: true,
            dob: true,
            gender: true,
            bloodType: true
          } 
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        batchOrders: {
          include: {
            services: {
              include: {
                service: true,
                investigationType: true
              }
            }
          }
        },
        medicationOrders: true,
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        }
      },
      orderBy: [
        { createdAt: 'asc' } // First come, first served
      ]
    });

    // Add result type labels for each visit
    const queueWithLabels = resultsQueue.map(visit => {
      let resultLabels = [];
      
      if (visit.labOrders.some(order => order.labResults.length > 0)) {
        resultLabels.push('Lab Results Available');
      }
      
      if (visit.radiologyOrders.some(order => order.radiologyResults.length > 0)) {
        resultLabels.push('Radiology Results Available');
      }
      
      if (visit.batchOrders.some(order => order.status === 'COMPLETED')) {
        resultLabels.push('Batch Results Available');
      }

      return {
        ...visit,
        resultLabels
      };
    });

    res.json({ resultsQueue: queueWithLabels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.selectVisit = async (req, res) => {
  try {
    const { visitId } = selectVisitSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is in correct status
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        vitals: true,
        labOrders: {
          include: {
            type: true,
            labResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        radiologyOrders: {
          include: {
            type: true,
            radiologyResults: {
              include: {
                testType: true,
                attachments: true
              }
            }
          }
        },
        medicationOrders: true,
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (!['WAITING_FOR_DOCTOR', 'RETURNED_WITH_RESULTS', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'AWAITING_LAB_RESULTS', 'AWAITING_RADIOLOGY_RESULTS', 'UNDER_DOCTOR_REVIEW'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit is not available for doctor review' });
    }

    // Check if the visit is assigned to this doctor
    if (visit.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: visit.assignmentId },
        select: { doctorId: true }
      });
      
      if (!assignment || assignment.doctorId !== doctorId) {
        return res.status(403).json({ error: 'You are not assigned to this patient' });
      }
    } else {
      return res.status(400).json({ error: 'Visit is not assigned to any doctor' });
    }

    // Update visit status to under doctor review
    const updatedVisit = await prisma.visit.update({
      where: { id: visitId },
      data: { status: 'UNDER_DOCTOR_REVIEW' }
    });

    // Determine stage based on existing orders
    const hasLabOrders = visit.labOrders.length > 0;
    const hasRadiologyOrders = visit.radiologyOrders.length > 0;
    const hasCompletedLab = visit.labOrders.some(order => order.status === 'COMPLETED');
    const hasCompletedRadiology = visit.radiologyOrders.some(order => order.status === 'COMPLETED');
    
    const stage = (hasLabOrders || hasRadiologyOrders) && (hasCompletedLab || hasCompletedRadiology) 
      ? 'POST_DIAGNOSTICS' 
      : 'PRE_DIAGNOSTICS';

    res.json({
      message: 'Visit selected for review',
      visit: updatedVisit,
      stage,
      canOrderMedications: stage === 'POST_DIAGNOSTICS'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.updateVisit = async (req, res) => {
  try {
    const { visitId } = req.params;
    const { diagnosis, diagnosisDetails, instructions } = updateVisitSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: parseInt(visitId) },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'RETURNED_WITH_RESULTS', 'AWAITING_LAB_RESULTS', 'AWAITING_RADIOLOGY_RESULTS'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit is not available for doctor review' });
    }

    // Update visit with diagnosis and instructions
    const updatedVisit = await prisma.visit.update({
      where: { id: parseInt(visitId) },
      data: {
        diagnosis,
        diagnosisDetails,
        instructions,
        status: 'UNDER_DOCTOR_REVIEW'
      },
      include: {
        patient: true,
        vitals: true,
        labOrders: true,
        radiologyOrders: true,
        medicationOrders: true,
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        }
      }
    });

    res.json({
      message: 'Visit updated successfully',
      visit: updatedVisit
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createLabOrder = async (req, res) => {
  try {
    const { visitId, patientId, typeId, instructions } = labOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Get investigation type with service
    const investigation = await prisma.investigationType.findUnique({ 
      where: { id: typeId, category: 'LAB' },
      include: { service: true }
    });

    if (!investigation) {
      return res.status(404).json({ error: 'Lab investigation type not found' });
    }

    if (!investigation.service) {
      return res.status(400).json({ error: 'Investigation type is not linked to a service' });
    }

    // Create lab order
    const order = await prisma.labOrder.create({
      data: { 
        visitId,
        doctorId, 
        patientId, 
        typeId, 
        instructions,
        status: 'UNPAID'
      },
      include: {
        type: {
          include: {
            service: true
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

    // Check if diagnostics billing already exists for this visit
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        notes: {
          contains: 'diagnostics'
        },
        status: 'PENDING'
      }
    });

    if (!billing) {
      // Create combined diagnostics billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: investigation.service.price,
          status: 'PENDING',
          notes: 'Combined diagnostics billing - lab and radiology'
        }
      });
    } else {
      // Update existing diagnostics billing
      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: billing.totalAmount + investigation.service.price
        }
      });
    }

    // Add service to billing
    await prisma.billingService.create({
      data: {
        billingId: billing.id,
        serviceId: investigation.service.id,
        quantity: 1,
        unitPrice: investigation.service.price,
        totalPrice: investigation.service.price
      }
    });

    // Update visit status based on existing orders
    const visitWithOrders = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    let newStatus = 'SENT_TO_LAB';
    if (visitWithOrders.radiologyOrders.length > 0) {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: doctorId,
        action: 'CREATE_LAB_ORDER',
        entity: 'LabOrder',
        entityId: order.id,
        details: JSON.stringify({
          visitId,
          patientId,
          typeId,
          instructions,
          investigationType: order.type.name,
          serviceCode: order.type.service.code,
          servicePrice: order.type.service.price
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Lab order created successfully',
      order,
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

exports.createMultipleLabOrders = async (req, res) => {
  try {
    const { visitId, patientId, orders } = multipleLabOrdersSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Check if consultation fee has been paid
    const consultationBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        services: {
          some: {
            service: {
              code: 'CONS001' // Consultation service code
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    if (!consultationBilling || consultationBilling.status !== 'PAID') {
      return res.status(400).json({ error: 'Consultation fee must be paid before ordering lab tests' });
    }

    // Get the correct service IDs for each investigation type
    const investigationTypes = await prisma.investigationType.findMany({
      where: { 
        id: { in: orders.map(o => o.typeId) },
        category: 'LAB'
      },
      select: { id: true, serviceId: true }
    });

    // Convert individual orders to batch order format
    const batchOrderData = {
      visitId,
      patientId,
      type: 'LAB',
      instructions: 'Lab tests ordered by doctor',
      services: orders.map(order => {
        const investigation = investigationTypes.find(i => i.id === order.typeId);
        return {
          serviceId: investigation?.serviceId || '2d25da56-c20f-4a51-b207-755073afd6d0',
          investigationTypeId: order.typeId,
          instructions: order.instructions || 'Lab test'
        };
      })
    };

    // Create batch order using the batch order controller
    const batchOrderController = require('./batchOrderController');
    req.body = batchOrderData;
    return await batchOrderController.createBatchOrder(req, res);

    // Validate all investigation types
    const investigationIds = orders.map(order => order.typeId);
    const investigations = await prisma.investigationType.findMany({
      where: { 
        id: { in: investigationIds },
        category: 'LAB'
      },
      include: { service: true }
    });

    if (investigations.length !== investigationIds.length) {
      return res.status(404).json({ error: 'One or more lab investigation types not found' });
    }

    // Check all investigations have services
    const missingServices = investigations.filter(inv => !inv.service);
    if (missingServices.length > 0) {
      return res.status(400).json({ error: 'One or more investigation types are not linked to services' });
    }

    // Create all lab orders
    const createdOrders = [];
    for (const orderData of orders) {
      const investigation = investigations.find(inv => inv.id === orderData.typeId);
      
      const order = await prisma.labOrder.create({
        data: { 
          visitId,
          doctorId, 
          patientId, 
          typeId: orderData.typeId, 
          instructions: orderData.instructions,
          status: 'UNPAID'
        },
        include: {
          type: {
            include: {
              service: true
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
      createdOrders.push(order);
    }

    // Check if diagnostics billing already exists for this visit
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        notes: {
          contains: 'diagnostics'
        },
        status: 'PENDING'
      }
    });

    const totalAmount = investigations.reduce((sum, inv) => sum + inv.service.price, 0);

    if (!billing) {
      // Create combined diagnostics billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount,
          status: 'PENDING',
          notes: 'Combined diagnostics billing - lab and radiology'
        }
      });
    } else {
      // Update existing diagnostics billing
      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: billing.totalAmount + totalAmount
        }
      });
    }

    // Add services to billing (handle duplicates)
    for (const investigation of investigations) {
      // Check if service already exists in billing
      const existingService = await prisma.billingService.findFirst({
        where: {
          billingId: billing.id,
          serviceId: investigation.service.id
        }
      });

      if (existingService) {
        // Update quantity if service already exists
        await prisma.billingService.update({
          where: { id: existingService.id },
          data: {
            quantity: existingService.quantity + 1,
            totalPrice: (existingService.quantity + 1) * investigation.service.price
          }
        });
      } else {
        // Create new service entry
        await prisma.billingService.create({
          data: {
            billingId: billing.id,
            serviceId: investigation.service.id,
            quantity: 1,
            unitPrice: investigation.service.price,
            totalPrice: investigation.service.price
          }
        });
      }
    }

    // Update visit status based on existing orders
    const visitWithOrders = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    let newStatus = 'SENT_TO_LAB';
    if (visitWithOrders.radiologyOrders.length > 0) {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    res.json({
      message: 'Multiple lab orders created successfully',
      orders: createdOrders,
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

exports.createRadiologyOrder = async (req, res) => {
  try {
    const { visitId, patientId, typeId, instructions } = radiologyOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Get investigation type with service
    const investigation = await prisma.investigationType.findUnique({ 
      where: { id: typeId, category: 'RADIOLOGY' },
      include: { service: true }
    });

    if (!investigation) {
      return res.status(404).json({ error: 'Radiology investigation type not found' });
    }

    if (!investigation.service) {
      return res.status(400).json({ error: 'Investigation type is not linked to a service' });
    }

    // Create radiology order
    const order = await prisma.radiologyOrder.create({
      data: { 
        visitId,
        doctorId, 
        patientId, 
        typeId, 
        instructions,
        status: 'UNPAID'
      },
      include: {
        type: {
          include: {
            service: true
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

    // Check if diagnostics billing already exists for this visit
    let billing = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        notes: {
          contains: 'diagnostics'
        },
        status: 'PENDING'
      }
    });

    if (!billing) {
      // Create combined diagnostics billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: investigation.service.price,
          status: 'PENDING',
          notes: 'Combined diagnostics billing - lab and radiology'
        }
      });
    } else {
      // Update existing diagnostics billing
      await prisma.billing.update({
        where: { id: billing.id },
        data: {
          totalAmount: billing.totalAmount + investigation.service.price
        }
      });
    }

    // Add service to billing
    await prisma.billingService.create({
      data: {
        billingId: billing.id,
        serviceId: investigation.service.id,
        quantity: 1,
        unitPrice: investigation.service.price,
        totalPrice: investigation.service.price
      }
    });

    // Update visit status based on existing orders
    const visitWithOrders = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    let newStatus = 'SENT_TO_RADIOLOGY';
    if (visitWithOrders.labOrders.length > 0) {
      newStatus = 'SENT_TO_BOTH';
    }

    await prisma.visit.update({
      where: { id: visitId },
      data: { status: newStatus }
    });

    res.json({
      message: 'Radiology order created successfully',
      order,
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

exports.createMultipleRadiologyOrders = async (req, res) => {
  try {
    const { visitId, patientId, orders } = createMultipleRadiologyOrdersSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Check if consultation fee has been paid
    const consultationBilling = await prisma.billing.findFirst({
      where: {
        visitId: visitId,
        services: {
          some: {
            service: {
              code: 'CONS001' // Consultation service code
            }
          }
        }
      },
      include: {
        payments: true
      }
    });

    if (!consultationBilling || consultationBilling.status !== 'PAID') {
      return res.status(400).json({ error: 'Consultation fee must be paid before ordering radiology tests' });
    }

    // Get the correct service IDs for each investigation type
    const investigationTypes = await prisma.investigationType.findMany({
      where: { 
        id: { in: orders.map(o => o.typeId) },
        category: 'RADIOLOGY'
      },
      select: { id: true, serviceId: true }
    });

    // Convert individual orders to batch order format
    const batchOrderData = {
      visitId,
      patientId,
      type: 'RADIOLOGY',
      instructions: 'Radiology tests ordered by doctor',
      services: orders.map(order => {
        const investigation = investigationTypes.find(i => i.id === order.typeId);
        return {
          serviceId: investigation?.serviceId || 'd849879f-4522-4523-8d67-53fa558c99ef', // Chest X-Ray service
          investigationTypeId: order.typeId,
          instructions: order.instructions || 'Radiology test'
        };
      })
    };

    // Create batch order using the batch order controller
    const batchOrderController = require('./batchOrderController');
    req.body = batchOrderData;
    return await batchOrderController.createBatchOrder(req, res);

    // Validate all investigation types
    const investigationIds = orders.map(order => order.typeId);
    const investigations = await prisma.investigationType.findMany({
      where: { 
        id: { in: investigationIds },
        category: 'RADIOLOGY'
      },
      include: { service: true }
    });

    if (investigations.length !== investigationIds.length) {
      return res.status(400).json({ error: 'One or more invalid radiology investigation types' });
    }

    // Create all radiology orders
    const radiologyOrders = [];
    let totalAmount = 0;

    for (const order of orders) {
      const investigation = investigations.find(inv => inv.id === order.typeId);
      
      const radiologyOrder = await prisma.radiologyOrder.create({
        data: {
          visitId,
          patientId,
          doctorId,
          typeId: order.typeId,
          instructions: order.instructions || null,
          status: 'UNPAID'
        },
        include: {
          type: {
            include: { service: true }
          },
          visit: {
            select: { id: true, visitUid: true }
          }
        }
      });

      radiologyOrders.push(radiologyOrder);
      totalAmount += investigation.price;
    }

    // Create separate billings for each radiology order to avoid unique constraint
    const billings = [];
    
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const investigation = investigations.find(inv => inv.id === order.typeId);
      
      const billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: investigation.price,
          status: 'PENDING',
          notes: `Radiology order - ${investigation.name}`
        }
      });
      
      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: investigation.serviceId,
          quantity: 1,
          unitPrice: investigation.price,
          totalPrice: investigation.price
        }
      });
      
      billings.push(billing);
    }

    // Update visit status to sent to radiology
    await prisma.visit.update({
      where: { id: visitId },
      data: { status: 'SENT_TO_RADIOLOGY' }
    });

    res.json({
      message: 'Multiple radiology orders created successfully',
      orders: radiologyOrders,
      billings: billings.map(b => ({
        id: b.id,
        totalAmount: b.totalAmount
      })),
      totalAmount: totalAmount,
      visitStatus: 'SENT_TO_RADIOLOGY'
    });

  } catch (error) {
    console.error('Multiple radiology orders creation error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.createMedicationOrder = async (req, res) => {
  try {
    const data = medicationOrderSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId },
      include: {
        labOrders: true,
        radiologyOrders: true
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow orders to be created if visit is waiting for doctor, under doctor review, or sent to lab
    if (!['WAITING_FOR_DOCTOR', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
      return res.status(400).json({ error: 'Visit must be waiting for doctor, under doctor review, or sent to lab/radiology to create orders' });
    }

    // Check if medication ordering is allowed based on investigation completion
    const medicationCheck = await checkMedicationOrderingAllowed(data.visitId);
    
    if (!medicationCheck.allowed) {
      return res.status(400).json({ 
        error: medicationCheck.reason
      });
    }

    // Create medication order
    const order = await prisma.medicationOrder.create({
      data: { 
        visitId: data.visitId,
        doctorId, 
        patientId: data.patientId, 
        name: data.name,
        dosageForm: data.dosageForm,
        strength: data.strength,
        quantity: data.quantity,
        frequency: data.frequency,
        duration: data.duration,
        instructions: data.instructions,
        additionalNotes: data.additionalNotes,
        category: data.category,
        status: 'UNPAID'
      },
      include: {
        visit: {
          select: {
            id: true,
            visitUid: true
          }
        }
      }
    });

    // If it's a continuous infusion, create the infusion record and nurse tasks
    if (data.isContinuousInfusion && data.continuousInfusionDays && data.dailyDose) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + data.continuousInfusionDays);

      const continuousInfusion = await prisma.continuousInfusion.create({
        data: {
          medicationOrderId: order.id,
          startDate,
          endDate,
          dailyDose: data.dailyDose,
          frequency: data.frequency,
          days: data.continuousInfusionDays,
          status: 'UNPAID'
        }
      });

      // Create nurse administration tasks for each day
      const nurseTasks = [];
      for (let i = 0; i < data.continuousInfusionDays; i++) {
        const scheduledFor = new Date(startDate);
        scheduledFor.setDate(scheduledFor.getDate() + i);
        scheduledFor.setHours(9, 0, 0, 0); // Default to 9 AM

        nurseTasks.push({
          continuousInfusionId: continuousInfusion.id,
          scheduledFor,
          completed: false
        });
      }

      await prisma.nurseAdministration.createMany({
        data: nurseTasks
      });
    }

    // Find medication service
    const medicationService = await prisma.service.findFirst({
      where: {
        name: { contains: data.name, mode: 'insensitive' },
        category: 'MEDICATION'
      }
    });

    if (!medicationService) {
      return res.status(404).json({ error: 'Medication service not found. Please add this medication to the service catalog first.' });
    }

    // Create pharmacy invoice for medications
    const servicePrice = medicationService.price * data.quantity;

    const pharmacyInvoice = await prisma.pharmacyInvoice.create({
        data: {
          patientId: data.patientId,
          visitId: data.visitId,
          totalAmount: servicePrice,
          status: 'PENDING',
        notes: data.isContinuousInfusion ? 'Continuous infusion medication billing' : 'Medication order billing'
      }
    });

    // For continuous infusion, create daily billing services
    if (data.isContinuousInfusion && data.continuousInfusionDays && data.dailyDose) {
      for (let i = 0; i < data.continuousInfusionDays; i++) {
        await prisma.billingService.create({
          data: {
            billingId: pharmacyInvoice.id,
            serviceId: medicationService.id,
            quantity: 1,
            unitPrice: medicationService.price,
            totalPrice: medicationService.price
          }
        });
      }
    }

    res.json({
      message: 'Medication order created successfully',
      order,
      pharmacyInvoice: {
        id: pharmacyInvoice.id,
        totalAmount: pharmacyInvoice.totalAmount
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get comprehensive patient history
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        insurance: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get all visits with complete details
    const visits = await prisma.visit.findMany({
      where: { patientId },
      include: {
        createdBy: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        },
        vitals: {
          orderBy: { createdAt: 'desc' }
        },
        labOrders: {
          include: {
            type: true,
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        radiologyOrders: {
          include: {
            type: true,
            attachments: true
          },
          orderBy: { createdAt: 'desc' }
        },
        medicationOrders: {
          include: {
            continuousInfusion: {
              include: {
                nurseTasks: {
                  include: {
                    administeredBy: {
                      select: {
                        id: true,
                        fullname: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            },
            payments: true
          }
        },
        pharmacyInvoices: {
          include: {
            dispensedMedicines: {
              include: {
                medicationOrder: true
              }
            }
          }
        },
        appointments: {
          include: {
            doctor: {
              select: {
                id: true,
                fullname: true,
                specialties: true
              }
            }
          },
          orderBy: { date: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get medical history
    const medicalHistory = await prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      patient,
      visits,
      medicalHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.completeVisit = async (req, res) => {
  try {
    const { visitId, diagnosis, diagnosisDetails, instructions, finalNotes, needsAppointment, appointmentDate, appointmentTime, appointmentNotes } = completeVisitSchema.parse(req.body);
    const doctorId = req.user.id;

    // Check if visit exists and is under doctor review
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: {
        patient: true,
        vitals: true,
        labOrders: true,
        radiologyOrders: true,
        medicationOrders: true,
        bills: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.status !== 'UNDER_DOCTOR_REVIEW') {
      return res.status(400).json({ error: 'Visit must be under doctor review to complete' });
    }

    // Create medical history snapshot
    const medicalHistoryData = {
      visitId: visit.id,
      visitUid: visit.visitUid,
      patientId: visit.patientId,
      diagnosis,
      diagnosisDetails,
      instructions,
      finalNotes,
      vitals: visit.vitals,
      labOrders: visit.labOrders.map(order => ({
        id: order.id,
        type: order.type,
        result: order.result,
        status: order.status,
        attachments: order.attachments
      })),
      radiologyOrders: visit.radiologyOrders.map(order => ({
        id: order.id,
        type: order.type,
        result: order.result,
        status: order.status,
        attachments: order.attachments
      })),
      medicationOrders: visit.medicationOrders.map(order => ({
        id: order.id,
        name: order.name,
        dosageForm: order.dosageForm,
        strength: order.strength,
        quantity: order.quantity,
        frequency: order.frequency,
        duration: order.duration,
        instructions: order.instructions,
        status: order.status
      })),
      bills: visit.bills.map(bill => ({
        id: bill.id,
        total: bill.total,
        status: bill.status,
        payments: bill.payments
      })),
      completedAt: new Date(),
      completedBy: doctorId
    };

    // Update visit status and create medical history
    await prisma.$transaction(async (tx) => {
      // Create appointment if needed
      let appointment = null;
      if (needsAppointment && appointmentDate && appointmentTime) {
        appointment = await tx.appointment.create({
          data: {
            patientId: visit.patientId,
            doctorId: doctorId,
            date: new Date(appointmentDate),
            time: appointmentTime,
            type: 'FOLLOW_UP',
            status: 'PENDING',
            notes: appointmentNotes || 'Follow-up appointment'
          }
        });
      }

      // Update visit
      await tx.visit.update({
        where: { id: visitId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          diagnosis,
          diagnosisDetails,
          instructions,
          notes: finalNotes ? `${visit.notes || ''}\n\nFinal Notes: ${finalNotes}` : visit.notes
        }
      });

      // Add appointment to medical history data
      if (appointment) {
        medicalHistoryData.appointment = {
          id: appointment.id,
          date: appointment.date,
          time: appointment.time,
          type: appointment.type,
          status: appointment.status,
          notes: appointment.notes
        };
      }

      // Create medical history
      await tx.medicalHistory.create({
        data: {
          patientId: visit.patientId,
          details: JSON.stringify(medicalHistoryData)
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: doctorId,
          action: 'COMPLETE_VISIT',
          entity: 'Visit',
          entityId: visitId,
          details: JSON.stringify({
            visitId,
            diagnosis,
            diagnosisDetails,
            instructions,
            finalNotes,
            needsAppointment,
            appointmentDate,
            appointmentTime,
            appointmentNotes
          }),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      // Update medication orders to QUEUED if they're PAID
      await tx.medicationOrder.updateMany({
        where: {
          visitId: visitId,
          status: 'PAID'
        },
        data: {
          status: 'QUEUED'
        }
      });
    });

    res.json({
      message: 'Visit completed successfully',
      visitId: visit.id,
      visitUid: visit.visitUid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};