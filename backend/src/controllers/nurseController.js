const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const vitalsSchema = z.object({
  patientId: z.string(),
  visitId: z.number(),
  bloodPressure: z.string().optional(),
  temperature: z.number().optional(),
  tempUnit: z.enum(['C', 'F']).default('C'),
  heartRate: z.number().optional(),
  respirationRate: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  bloodType: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  painScoreRest: z.number().optional(),
  painScoreMovement: z.number().optional(),
  sedationScore: z.number().optional(),
  gcsEyes: z.number().optional(),
  gcsVerbal: z.number().optional(),
  gcsMotor: z.number().optional(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  // Additional fields from frontend
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  onsetOfSymptoms: z.string().optional(),
  durationOfSymptoms: z.string().optional(),
  severityOfSymptoms: z.string().optional(),
  associatedSymptoms: z.string().optional(),
  relievingFactors: z.string().optional(),
  aggravatingFactors: z.string().optional(),
  generalAppearance: z.string().optional(),
  headAndNeck: z.string().optional(),
  cardiovascularExam: z.string().optional(),
  respiratoryExam: z.string().optional(),
  abdominalExam: z.string().optional(),
  extremities: z.string().optional(),
  neurologicalExam: z.string().optional()
});

// Schema for continuous vitals (visitId is optional)
const continuousVitalsSchema = z.object({
  patientId: z.string(),
  visitId: z.number().optional(),
  bloodPressure: z.string().optional(),
  temperature: z.number().optional(),
  tempUnit: z.enum(['C', 'F']).default('C'),
  heartRate: z.number().optional(),
  respirationRate: z.number().optional(),
  height: z.number().optional(),
  weight: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  bloodType: z.string().optional(),
  condition: z.string().optional(),
  notes: z.string().optional(),
  painScoreRest: z.number().optional(),
  painScoreMovement: z.number().optional(),
  sedationScore: z.number().optional(),
  gcsEyes: z.number().optional(),
  gcsVerbal: z.number().optional(),
  gcsMotor: z.number().optional(),
  bloodPressureSystolic: z.number().optional(),
  bloodPressureDiastolic: z.number().optional(),
  
  // Chief Complaint & History (Optional)
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  onsetOfSymptoms: z.string().optional(),
  durationOfSymptoms: z.string().optional(),
  severityOfSymptoms: z.string().optional(),
  associatedSymptoms: z.string().optional(),
  relievingFactors: z.string().optional(),
  aggravatingFactors: z.string().optional(),
  
  // Physical Examination (Optional)
  generalAppearance: z.string().optional(),
  headAndNeck: z.string().optional(),
  cardiovascularExam: z.string().optional(),
  respiratoryExam: z.string().optional(),
  abdominalExam: z.string().optional(),
  extremities: z.string().optional(),
  neurologicalExam: z.string().optional(),
});

const assignmentSchema = z.object({
  patientId: z.string(),
  visitId: z.number(),
  doctorId: z.string(),
});

const administerTaskSchema = z.object({
  taskId: z.number(),
  notes: z.string().optional(),
});

exports.recordVitals = async (req, res) => {
  try {
    const data = vitalsSchema.parse(req.body);
    
    // Auto-calculate BMI if height and weight are provided
    if (data.weight && data.height) {
      data.bmi = data.weight / (data.height ** 2);
    }

    // Check if visit exists
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // Allow recording vitals for any visit status (including completed visits for monitoring purposes)

    const vital = await prisma.vitalSign.create({ 
      data,
      include: {
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
            visitUid: true,
            status: true
          }
        }
      }
    });

    // Update patient's blood type permanently if provided
    if (data.bloodType) {
      await prisma.patient.update({
        where: { id: data.patientId },
        data: { bloodType: data.bloodType }
      });
    }

    // Create audit log (optional - don't fail if user ID is invalid)
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'RECORD_VITALS',
          entity: 'VitalSign',
          entityId: vital.id,
          details: JSON.stringify({
            patientId: data.patientId,
            visitId: data.visitId,
            bloodPressure: data.bloodPressure,
            temperature: data.temperature,
            heartRate: data.heartRate,
            bloodType: data.bloodType,
            bmi: data.bmi
          }),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (auditError) {
      console.warn('Failed to create audit log:', auditError.message);
      // Continue without failing the main operation
    }

    // Update visit status to TRIAGED if it was WAITING_FOR_TRIAGE
    if (visit.status === 'WAITING_FOR_TRIAGE') {
      await prisma.visit.update({
        where: { id: data.visitId },
        data: { status: 'TRIAGED' }
      });
    }

    res.json({
      message: 'Vitals recorded successfully',
      vital
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get doctors by specialty
exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.query;

    let whereClause = {
      role: 'DOCTOR',
      availability: true
    };

    // If specialty is specified, filter by it
    if (specialty && specialty !== 'General') {
      whereClause.specialties = {
        has: specialty
      };
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        specialties: true,
        consultationFee: true
      },
      orderBy: { fullname: 'asc' }
    });

    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors by specialty:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.assignDoctor = async (req, res) => {
  try {
    console.log('Assignment request body:', JSON.stringify(req.body, null, 2));
    // const { patientId, visitId, doctorId } = assignmentSchema.parse(req.body);
    const { patientId, visitId, doctorId } = req.body;

    // Check if visit exists
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    // All patients must be triaged before assigning doctor
    if (visit.status !== 'TRIAGED') {
      return res.status(400).json({ error: 'Visit must be triaged before assigning doctor' });
    }

    // Check if doctor exists and is available
    const doctor = await prisma.user.findUnique({
      where: { id: doctorId, role: 'DOCTOR', availability: true }
    });

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found or not available' });
    }

    // Check if assignment already exists
    let assignment = await prisma.assignment.findFirst({
      where: {
        patientId,
        doctorId,
        status: { in: ['Pending', 'Active'] }
      }
    });

    // Create assignment if it doesn't exist
    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          patientId,
          doctorId,
          status: 'Pending'
        }
      });
    } else {
      // Update existing assignment to Pending if it was completed
      assignment = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'Pending' }
      });
    }

    // Update visit status and link assignment
    await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: 'WAITING_FOR_DOCTOR',
        assignmentId: assignment.id,
        suggestedDoctorId: doctorId  // Also set suggestedDoctorId for admin tracking
      }
    });

    // Find consultation service
    const consultationService = await prisma.service.findFirst({
      where: {
        category: 'CONSULTATION',
        name: { contains: 'Consultation', mode: 'insensitive' }
      }
    });

    if (!consultationService) {
      return res.status(404).json({ error: 'Consultation service not found. Please add consultation service to the catalog.' });
    }

    const consultationPrice = doctor.consultationFee || consultationService.price;

    // Check if this is an emergency visit
    const emergencyVisit = await prisma.visit.findUnique({
      where: { id: visitId }
    });

    let billing;
    if (emergencyVisit.isEmergency) {
      // For emergency patients, add consultation to emergency billing
      console.log('🚨 Emergency patient - Adding consultation to emergency billing');
      
      // Import emergency controller function
      const { getOrCreateEmergencyBilling } = require('./emergencyController');
      
      // Get or create emergency billing
      const emergencyBilling = await getOrCreateEmergencyBilling(visitId);
      
      // Add consultation service to emergency billing
      await prisma.billingService.create({
        data: {
          billingId: emergencyBilling.id,
          serviceId: consultationService.id,
          quantity: 1,
          unitPrice: consultationPrice,
          totalPrice: consultationPrice
        }
      });

      // Update emergency billing total
      await prisma.billing.update({
        where: { id: emergencyBilling.id },
        data: {
          totalAmount: {
            increment: consultationPrice
          }
        }
      });

      billing = emergencyBilling;
      console.log(`✅ Consultation added to emergency billing: ${emergencyBilling.id}, Total: ${emergencyBilling.totalAmount + consultationPrice}`);
    } else {
      // For regular patients, create normal billing
      billing = await prisma.billing.create({
        data: {
          patientId,
          visitId,
          totalAmount: consultationPrice,
          status: 'PENDING',
          notes: 'Doctor consultation fee'
        }
      });

      // Add consultation service to billing
      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: consultationService.id,
          quantity: 1,
          unitPrice: consultationPrice,
          totalPrice: consultationPrice
        }
      });
    }

    res.json({
      message: 'Doctor assigned successfully',
      assignment,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount,
        status: billing.status
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getPatientQueue = async (req, res) => {
  try {
    const queue = await prisma.visit.findMany({
      where: { 
        status: 'WAITING_FOR_TRIAGE'
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true,
            mobile: true,
            email: true,
            gender: true,
            dob: true,
            bloodType: true,
            address: true
          }
        },
        vitals: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            labOrders: true,
            radiologyOrders: true,
            medicationOrders: true
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

exports.getDoctors = async (req, res) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        availability: true
      },
      select: {
        id: true,
        fullname: true,
        specialties: true,
        consultationFee: true
      },
      orderBy: {
        fullname: 'asc'
      }
    });

    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.markAdministered = async (req, res) => {
  try {
    const { taskId, notes } = req.body;
    const administeredById = req.user.id;

    const task = await prisma.nurseAdministration.findUnique({
      where: { id: taskId },
      include: {
        continuousInfusion: {
          include: {
            medicationOrder: {
              include: {
                patient: true
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.completed) {
      return res.status(400).json({ error: 'Task already completed' });
    }

    // Update task
    const updatedTask = await prisma.nurseAdministration.update({
      where: { id: taskId },
      data: {
        administeredById,
        administeredAt: new Date(),
        notes,
        completed: true
      },
      include: {
        administeredBy: {
          select: {
            id: true,
            fullname: true
          }
        }
      }
    });

    // Create medical history entry
    await prisma.medicalHistory.create({
      data: {
        patientId: task.continuousInfusion.medicationOrder.patientId,
        details: JSON.stringify({
          type: 'CSI_ADMINISTRATION',
          taskId: task.id,
          medication: task.continuousInfusion.medicationOrder.name,
          administeredAt: new Date(),
          administeredBy: req.user.fullname,
          notes: notes
        })
      }
    });

    res.json({
      message: 'Administration marked as completed',
      task: updatedTask
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get nurse services (for triage)
exports.getNurseServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { 
        category: 'NURSE',
        isActive: true 
      },
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        price: true,
        description: true,
        isActive: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ services });
  } catch (error) {
    console.error('Error fetching nurse services:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all nurses (for triage assignment)
exports.getNurses = async (req, res) => {
  try {
    const nurses = await prisma.user.findMany({
      where: { 
        role: 'NURSE',
        availability: true 
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phone: true,
        specialties: true,
        availability: true
      },
      orderBy: { fullname: 'asc' }
    });

    res.json({ nurses });
  } catch (error) {
    console.error('Error fetching nurses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get daily tasks for continuous infusions
exports.getTodayTasks = async (req, res) => {
  try {
    const nurseId = req.user.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch nurse service assignments with billing information (both triage and doctor ordered)
    const nurseServiceTasks = await prisma.nurseServiceAssignment.findMany({
      where: {
        assignedNurseId: nurseId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        visit: {
          select: {
            id: true,
            visitUid: true,
            patient: {
              select: { id: true, name: true }
            }
          }
        },
        service: {
          select: { id: true, name: true, price: true, description: true }
        },
        assignedBy: {
          select: { id: true, fullname: true, role: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group tasks by patient and filter only paid services
    const groupedTasks = {};
    
    for (const task of nurseServiceTasks) {
      const patientId = task.visit.patient.id;
      const patientName = task.visit.patient.name;
      
      // Check if the billing for this visit is paid
      // Find the specific billing record for nurse services (not consultation or entry fees)
      const billing = await prisma.billing.findFirst({
        where: {
          visitId: task.visitId,
          services: {
            some: {
              service: {
                category: 'NURSE'
              }
            }
          }
        },
        include: {
          payments: true,
          services: {
            include: {
              service: true
            }
          }
        }
      });
      
      // Only include tasks for paid services
      if (billing) {
        // Calculate total payments
        const totalPayments = billing.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const isFullyPaid = billing.status === 'PAID' || totalPayments >= billing.totalAmount;
        
        // Only include if fully paid
        if (isFullyPaid) {
          if (!groupedTasks[patientId]) {
            groupedTasks[patientId] = {
              patientId,
              patientName,
              visitId: task.visitId,
              visitUid: task.visit.visitUid,
              services: [],
              totalAmount: 0,
              assignedBy: task.assignedBy.fullname,
              assignedByRole: task.assignedBy.role,
              orderType: task.orderType || 'TRIAGE_ORDERED',
              createdAt: task.createdAt,
              type: 'nurseService',
              billingStatus: billing.status,
              totalPayments: totalPayments,
              isFullyPaid: isFullyPaid
            };
          }
        
          groupedTasks[patientId].services.push({
            id: task.id,
            serviceId: task.service.id,
            serviceName: task.service.name,
            servicePrice: task.service.price,
            serviceDescription: task.service.description,
            status: task.status,
            notes: task.notes,
            orderType: task.orderType || 'TRIAGE_ORDERED',
            assignedBy: task.assignedBy.fullname,
            assignedByRole: task.assignedBy.role
          });
          
          groupedTasks[patientId].totalAmount += task.service.price;
        }
      }
    }

    // Fetch continuous infusion tasks for today (any nurse can handle these)
    const continuousInfusionTasks = await prisma.nurseAdministration.findMany({
      where: {
        scheduledFor: {
          gte: today,
          lt: tomorrow
        },
        completed: false
      },
      include: {
        continuousInfusion: {
          include: {
            medicationOrder: {
              include: {
                patient: true,
                visit: {
                  select: {
                    id: true,
                    visitUid: true,
                    patient: {
                      select: { id: true, name: true }
                    }
                  }
                },
                continuousInfusion: true
              }
            }
          }
        }
      },
      orderBy: { scheduledFor: 'asc' }
    });

    // Add continuous infusion tasks to grouped tasks
    for (const task of continuousInfusionTasks) {
      const patientId = task.continuousInfusion.medicationOrder.patientId;
      const patientName = task.continuousInfusion.medicationOrder.patient.name;
      const visitId = task.continuousInfusion.medicationOrder.visitId;
      const visitUid = task.continuousInfusion.medicationOrder.visit?.visitUid;
      
      if (!groupedTasks[patientId]) {
        groupedTasks[patientId] = {
          patientId,
          patientName,
          visitId,
          visitUid,
          services: [],
          totalAmount: 0,
          assignedBy: 'Doctor',
          createdAt: task.continuousInfusion.createdAt,
          type: 'continuousInfusion',
          billingStatus: 'PAID', // Continuous infusions are already paid when created
          totalPayments: 0,
          isFullyPaid: true
        };
      }
      
      // Add continuous infusion data to medication order
      const medicationOrderWithInfusion = {
        ...task.continuousInfusion.medicationOrder,
        continuousInfusion: task.continuousInfusion
      };

      groupedTasks[patientId].services.push({
        id: task.id,
        serviceId: task.continuousInfusion.id,
        serviceName: `Continuous Infusion: ${task.continuousInfusion.medicationOrder.name}`,
        servicePrice: 0, // No additional cost for administration
        serviceDescription: `${task.continuousInfusion.dailyDose} - ${task.continuousInfusion.frequency}`,
        status: task.completed ? 'COMPLETED' : 'PENDING',
        notes: task.notes,
        scheduledFor: task.scheduledFor,
        medicationOrder: medicationOrderWithInfusion
      });
    }

    // Convert grouped tasks to array
    const allTasks = Object.values(groupedTasks);

    res.json({ tasks: allTasks });
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    res.status(500).json({ error: error.message });
  }
};

// Administer medication task
exports.administerTask = async (req, res) => {
  try {
    const { taskId, notes } = administerTaskSchema.parse(req.body);
    const nurseId = req.user.id;

    const task = await prisma.nurseTask.findUnique({
      where: { id: taskId },
      include: {
        continuousInfusion: {
          include: {
            medicationOrder: {
              include: {
                visit: {
                  include: {
                    patient: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.status !== 'PENDING') {
      return res.status(400).json({ error: 'Task already completed or cancelled' });
    }

    // Update task status
    const updatedTask = await prisma.nurseTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        administeredBy: nurseId,
        administeredAt: new Date(),
        notes
      },
      include: {
        continuousInfusion: {
          include: {
            medicationOrder: {
              include: {
                visit: {
                  include: {
                    patient: true
                  }
                }
              }
            }
          }
        },
        administeredBy: {
          select: {
            id: true,
            fullname: true
          }
        }
      }
    });

    // Create medical history entry
    await prisma.medicalHistory.create({
      data: {
        patientId: task.continuousInfusion.medicationOrder.visit.patientId,
        details: JSON.stringify({
          type: 'MEDICATION_ADMINISTRATION',
          taskId: task.id,
          medication: task.continuousInfusion.medicationOrder.name,
          dosage: task.continuousInfusion.dailyDose,
          scheduledDate: task.scheduledDate,
          administeredAt: new Date(),
          administeredBy: req.user.fullname,
          notes
        })
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: nurseId,
        action: 'ADMINISTER_MEDICATION',
        entity: 'NurseTask',
        entityId: taskId,
        details: JSON.stringify({
          taskId,
          medication: task.continuousInfusion.medicationOrder.name,
          dosage: task.continuousInfusion.dailyDose,
          patientId: task.continuousInfusion.medicationOrder.visit.patientId,
          notes
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Medication administered successfully',
      task: updatedTask
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Record continuous vitals (not tied to a specific visit)
exports.recordContinuousVitals = async (req, res) => {
  try {
    const data = continuousVitalsSchema.parse(req.body);
    
    // Auto-calculate BMI if height and weight are provided
    if (data.weight && data.height) {
      data.bmi = data.weight / (data.height ** 2);
    }

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Set visitId to null for continuous vitals
    data.visitId = null;

    const vital = await prisma.vitalSign.create({ 
      data,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true
          }
        }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'RECORD_CONTINUOUS_VITALS',
        entity: 'VitalSign',
        entityId: vital.id,
        details: JSON.stringify({
          patientId: data.patientId,
          bloodPressure: data.bloodPressure,
          temperature: data.temperature,
          heartRate: data.heartRate,
          bmi: data.bmi,
          type: 'continuous'
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Continuous vitals recorded successfully',
      vital
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all vitals for a patient (including continuous vitals)
exports.getPatientVitals = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        type: true,
        mobile: true,
        email: true,
        dob: true,
        gender: true
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get all vitals for this patient (both visit-based and continuous)
    const vitals = await prisma.vitalSign.findMany({
      where: {
        patientId: patientId
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        visit: {
          select: {
            id: true,
            visitUid: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    res.json({
      patient,
      vitals: vitals.map(vital => ({
        id: vital.id,
        bloodPressure: vital.bloodPressure,
        bloodPressureSystolic: vital.bloodPressureSystolic,
        bloodPressureDiastolic: vital.bloodPressureDiastolic,
        temperature: vital.temperature,
        tempUnit: vital.tempUnit,
        heartRate: vital.heartRate,
        respirationRate: vital.respirationRate,
        height: vital.height,
        weight: vital.weight,
        bmi: vital.bmi,
        oxygenSaturation: vital.oxygenSaturation,
        condition: vital.condition,
        notes: vital.notes,
        painScoreRest: vital.painScoreRest,
        painScoreMovement: vital.painScoreMovement,
        sedationScore: vital.sedationScore,
        gcsEyes: vital.gcsEyes,
        gcsVerbal: vital.gcsVerbal,
        gcsMotor: vital.gcsMotor,
        chiefComplaint: vital.chiefComplaint,
        historyOfPresentIllness: vital.historyOfPresentIllness,
        onsetOfSymptoms: vital.onsetOfSymptoms,
        durationOfSymptoms: vital.durationOfSymptoms,
        severityOfSymptoms: vital.severityOfSymptoms,
        associatedSymptoms: vital.associatedSymptoms,
        relievingFactors: vital.relievingFactors,
        aggravatingFactors: vital.aggravatingFactors,
        generalAppearance: vital.generalAppearance,
        headAndNeck: vital.headAndNeck,
        cardiovascularExam: vital.cardiovascularExam,
        respiratoryExam: vital.respiratoryExam,
        abdominalExam: vital.abdominalExam,
        extremities: vital.extremities,
        neurologicalExam: vital.neurologicalExam,
        createdAt: vital.createdAt,
        updatedAt: vital.updatedAt,
        visitId: vital.visitId,
        visit: vital.visit,
        isContinuous: vital.visitId === null
      }))
    });
  } catch (error) {
    console.error('Error fetching patient vitals:', error);
    res.status(500).json({ error: error.message });
  }
};

// Assign single nurse service to a patient (legacy function)
exports.assignNurseService = async (req, res) => {
  try {
    console.log('Nurse service assignment request body:', JSON.stringify(req.body, null, 2));
    const { patientId, visitId, serviceId, assignedNurseId, notes } = req.body;

    // Check if visit exists
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.status !== 'TRIAGED' && visit.status !== 'WAITING_FOR_NURSE_SERVICE') {
      return res.status(400).json({ error: 'Visit must be triaged before assigning nurse service' });
    }

    // Check if service exists and is a nurse service
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.category !== 'NURSE') {
      return res.status(400).json({ error: 'Service must be a nurse service' });
    }

    // Check if assigned nurse exists and is available
    const assignedNurse = await prisma.user.findUnique({
      where: { id: assignedNurseId, role: 'NURSE', availability: true }
    });

    if (!assignedNurse) {
      return res.status(404).json({ error: 'Nurse not found or not available' });
    }

    // Create nurse service assignment
    const nurseAssignment = await prisma.nurseServiceAssignment.create({
      data: {
        visitId,
        serviceId,
        assignedNurseId,
        assignedById: req.user.id, // Current nurse who is assigning
        status: 'PENDING',
        notes
      },
      include: {
        service: true,
        assignedNurse: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        }
      }
    });

    // Update visit status
    await prisma.visit.update({
      where: { id: visitId },
      data: {
        status: 'WAITING_FOR_NURSE_SERVICE'
      }
    });

    // Create billing for nurse service
    const billing = await prisma.billing.create({
      data: {
        patientId,
        visitId,
        totalAmount: service.price,
        status: 'PENDING',
        notes: `Nurse service: ${service.name}`
      }
    });

    // Add nurse service to billing
    await prisma.billingService.create({
      data: {
        billingId: billing.id,
        serviceId: service.id,
        quantity: 1,
        unitPrice: service.price,
        totalPrice: service.price
      }
    });

    res.json({
      message: 'Nurse service assigned successfully',
      assignment: nurseAssignment,
      billing: {
        id: billing.id,
        totalAmount: billing.totalAmount,
        status: billing.status
      }
    });

  } catch (error) {
    console.error('Error assigning nurse service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Assign multiple nurse services to a patient (new approach)
exports.assignNurseServices = async (req, res) => {
  try {
    console.log('Nurse services assignment request body:', JSON.stringify(req.body, null, 2));
    const { patientId, visitId, serviceIds, notes } = req.body;
    let { assignedNurseId } = req.body;

    // Check if visit exists
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.status !== 'TRIAGED' && visit.status !== 'WAITING_FOR_NURSE_SERVICE') {
      return res.status(400).json({ error: 'Visit must be triaged before assigning nurse service' });
    }

    // Check if all services exist and are nurse services
    const services = await prisma.service.findMany({
      where: { 
        id: { in: serviceIds },
        category: 'NURSE'
      }
    });

    if (services.length !== serviceIds.length) {
      return res.status(404).json({ error: 'One or more services not found or not nurse services' });
    }

    // Auto-assign current nurse if no nurse is specified
    if (!assignedNurseId) {
      assignedNurseId = req.user.id; // Use current logged-in nurse
    }

    // Check if assigned nurse exists and is available
    const assignedNurse = await prisma.user.findUnique({
      where: { id: assignedNurseId, role: 'NURSE', availability: true }
    });

    if (!assignedNurse) {
      return res.status(404).json({ error: 'Nurse not found or not available' });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Create nurse service assignments for each service
      const nurseAssignments = [];
      for (const serviceId of serviceIds) {
        const assignment = await tx.nurseServiceAssignment.create({
          data: {
            visitId,
            serviceId,
            assignedNurseId,
            assignedById: req.user.id, // Current nurse who is assigning
            status: 'PENDING',
            notes
          },
          include: {
            service: true,
            assignedNurse: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            },
            assignedBy: {
              select: {
                id: true,
                fullname: true,
                username: true
              }
            }
          }
        });
        nurseAssignments.push(assignment);
      }

      // Update visit status
      await tx.visit.update({
        where: { id: visitId },
        data: {
          status: 'WAITING_FOR_NURSE_SERVICE'
        }
      });

      // Calculate total amount for all services
      const totalAmount = services.reduce((sum, service) => sum + service.price, 0);

      // Check if this is an emergency visit
      const visit = await tx.visit.findUnique({
        where: { id: visitId }
      });

      let billing;
      if (visit.isEmergency) {
        // For emergency patients, add nurse services to emergency billing
        console.log('🚨 Emergency patient - Adding nurse services to emergency billing');
        
        // Import emergency controller function
        const { getOrCreateEmergencyBilling } = require('./emergencyController');
        
        // Get or create emergency billing
        const emergencyBilling = await getOrCreateEmergencyBilling(visitId);
        
        // Add all nurse services to emergency billing
        for (const service of services) {
          await tx.billingService.create({
            data: {
              billingId: emergencyBilling.id,
              serviceId: service.id,
              quantity: 1,
              unitPrice: service.price,
              totalPrice: service.price
            }
          });
        }

        // Update emergency billing total
        await tx.billing.update({
          where: { id: emergencyBilling.id },
          data: {
            totalAmount: {
              increment: totalAmount
            }
          }
        });

        billing = emergencyBilling;
        console.log(`✅ Nurse services added to emergency billing: ${emergencyBilling.id}, Total: ${emergencyBilling.totalAmount + totalAmount}`);
      } else {
        // For regular patients, create normal billing
        billing = await tx.billing.create({
          data: {
            patientId,
            visitId,
            totalAmount,
            status: 'PENDING',
            notes: `Nurse services: ${services.map(s => s.name).join(', ')}`
          }
        });

        // Add all services to the single billing entry
        for (const service of services) {
          await tx.billingService.create({
            data: {
              billingId: billing.id,
              serviceId: service.id,
              quantity: 1,
              unitPrice: service.price,
              totalPrice: service.price
            }
          });
        }
      }

      return { nurseAssignments, billing };
    });

    res.json({
      message: `${serviceIds.length} nurse service(s) assigned successfully`,
      assignments: result.nurseAssignments,
      billing: {
        id: result.billing.id,
        totalAmount: result.billing.totalAmount,
        status: result.billing.status
      }
    });

  } catch (error) {
    console.error('Error assigning nurse service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Combined assignment: nurse services + doctor assignment in one transaction
exports.assignCombined = async (req, res) => {
  try {
    console.log('Combined assignment request body:', JSON.stringify(req.body, null, 2));
    const { patientId, visitId, serviceIds, doctorId, notes } = req.body;
    let { assignedNurseId } = req.body;

    // Check if visit exists
    const visit = await prisma.visit.findUnique({
      where: { id: visitId },
      include: { patient: true }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    console.log('Visit status:', visit.status);
    console.log('Visit ID:', visit.id);
    
    if (visit.status !== 'TRIAGED' && visit.status !== 'WAITING_FOR_NURSE_SERVICE' && visit.status !== 'WAITING_FOR_TRIAGE') {
      console.log('Visit status not allowed:', visit.status);
      return res.status(400).json({ error: `Visit must be triaged before assignment. Current status: ${visit.status}` });
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      const assignments = [];
      const billingServices = [];
      let totalAmount = 0;

      // Handle nurse services if provided
      if (serviceIds && serviceIds.length > 0) {
        // Auto-assign current nurse if no nurse is specified
        if (!assignedNurseId) {
          assignedNurseId = req.user.id; // Use current logged-in nurse
        }

        // Check if all services exist and are nurse services
        const services = await tx.service.findMany({
          where: { 
            id: { in: serviceIds },
            category: 'NURSE'
          }
        });

        if (services.length !== serviceIds.length) {
          throw new Error('One or more services not found or not nurse services');
        }

        // Check if assigned nurse exists and is available
        const assignedNurse = await tx.user.findUnique({
          where: { id: assignedNurseId, role: 'NURSE', availability: true }
        });

        if (!assignedNurse) {
          throw new Error('Nurse not found or not available');
        }

        // Create nurse service assignments for each service
        for (const serviceId of serviceIds) {
          const assignment = await tx.nurseServiceAssignment.create({
            data: {
              visitId,
              serviceId,
              assignedNurseId,
              assignedById: req.user.id, // Current nurse who is assigning
              status: 'PENDING',
              notes
            },
            include: {
              service: true,
              assignedNurse: {
                select: {
                  id: true,
                  fullname: true,
                  username: true
                }
              },
              assignedBy: {
                select: {
                  id: true,
                  fullname: true,
                  username: true
                }
              }
            }
          });
          assignments.push(assignment);

          // Add to billing services
          const service = services.find(s => s.id === serviceId);
          billingServices.push({
            serviceId: service.id,
            quantity: 1,
            unitPrice: service.price,
            totalPrice: service.price
          });
          totalAmount += service.price;
        }
      }

      // Handle doctor assignment if provided
      if (doctorId) {
        // Check if doctor exists and is available
        const doctor = await tx.user.findUnique({
          where: { id: doctorId, role: 'DOCTOR', availability: true }
        });

        if (!doctor) {
          throw new Error('Doctor not found or not available');
        }

        // Create doctor assignment
        const doctorAssignment = await tx.assignment.create({
          data: {
            patientId,
            doctorId,
            status: 'Pending'
          },
          include: {
            doctor: {
              select: {
                id: true,
                fullname: true,
                username: true,
                specialties: true,
                consultationFee: true
              }
            },
            patient: {
              select: {
                id: true,
                name: true,
                dob: true,
                gender: true,
                mobile: true
              }
            }
          }
        });
        assignments.push(doctorAssignment);

        // Find consultation service
        const consultationService = await tx.service.findFirst({
          where: {
            category: 'CONSULTATION',
            name: { contains: 'Consultation', mode: 'insensitive' }
          }
        });

        if (!consultationService) {
          throw new Error('Consultation service not found. Please add consultation service to the catalog.');
        }

        // Add consultation to billing services
        const consultationPrice = doctor.consultationFee || consultationService.price;
        billingServices.push({
          serviceId: consultationService.id,
          quantity: 1,
          unitPrice: consultationPrice,
          totalPrice: consultationPrice
        });
        totalAmount += consultationPrice;
      }

      // Determine visit status based on what was assigned
      let newStatus;
      if (serviceIds && serviceIds.length > 0 && doctorId) {
        newStatus = 'WAITING_FOR_NURSE_SERVICE'; // Nurse services take priority
      } else if (serviceIds && serviceIds.length > 0) {
        newStatus = 'WAITING_FOR_NURSE_SERVICE';
      } else if (doctorId) {
        newStatus = 'WAITING_FOR_DOCTOR';
      } else {
        throw new Error('No services or doctor assigned');
      }

      // Update visit status and suggestedDoctorId if doctor was assigned
      await tx.visit.update({
        where: { id: visitId },
        data: {
          status: newStatus,
          ...(doctorId && { suggestedDoctorId: doctorId }) // Set suggestedDoctorId for admin tracking
        }
      });

      // Check if this is an emergency visit
      const visit = await tx.visit.findUnique({
        where: { id: visitId }
      });

      let billing;
      if (visit.isEmergency) {
        // For emergency patients, add all services to emergency billing
        console.log('🚨 Emergency patient - Adding combined services to emergency billing');
        
        // Import emergency controller function
        const { getOrCreateEmergencyBilling } = require('./emergencyController');
        
        // Get or create emergency billing
        const emergencyBilling = await getOrCreateEmergencyBilling(visitId);
        
        // Add all services to emergency billing
        for (const serviceData of billingServices) {
          await tx.billingService.create({
            data: {
              billingId: emergencyBilling.id,
              ...serviceData
            }
          });
        }

        // Update emergency billing total
        await tx.billing.update({
          where: { id: emergencyBilling.id },
          data: {
            totalAmount: {
              increment: totalAmount
            }
          }
        });

        billing = emergencyBilling;
        console.log(`✅ Combined services added to emergency billing: ${emergencyBilling.id}, Total: ${emergencyBilling.totalAmount + totalAmount}`);
      } else {
        // For regular patients, create normal billing
        billing = await tx.billing.create({
          data: {
            patientId,
            visitId,
            totalAmount,
            status: 'PENDING',
            notes: `Combined assignment: ${serviceIds?.length ? `${serviceIds.length} nurse service(s)` : ''}${serviceIds?.length && doctorId ? ' + ' : ''}${doctorId ? 'doctor consultation' : ''}`
          }
        });

        // Add all services to the single billing entry
        for (const serviceData of billingServices) {
          await tx.billingService.create({
            data: {
              billingId: billing.id,
              ...serviceData
            }
          });
        }
      }

      return { assignments, billing };
    });

    res.json({
      message: 'Combined assignment completed successfully',
      assignments: result.assignments,
      billing: {
        id: result.billing.id,
        totalAmount: result.billing.totalAmount,
        status: result.billing.status
      }
    });

  } catch (error) {
    console.error('Error in combined assignment:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get nurse daily tasks (nurse service assignments)
exports.getNurseDailyTasks = async (req, res) => {
  try {
    const nurseId = req.user.id;
    
    const tasks = await prisma.nurseServiceAssignment.findMany({
      where: {
        assignedNurseId: nurseId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        visit: {
          include: {
            patient: {
              select: {
                id: true,
                name: true,
                dob: true,
                gender: true,
                mobile: true
              }
            }
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            code: true
          }
        },
        assignedBy: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching nurse daily tasks:', error);
    res.status(500).json({ error: error.message });
  }
};

// Complete nurse service
exports.completeNurseService = async (req, res) => {
  try {
    const { assignmentId, notes } = req.body;
    const nurseId = req.user.id;

    // Check if assignment exists and belongs to current nurse
    const assignment = await prisma.nurseServiceAssignment.findFirst({
      where: {
        id: assignmentId,
        assignedNurseId: nurseId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      },
      include: {
        visit: {
          include: {
            patient: true
          }
        },
        service: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found or already completed' });
    }

    // Update assignment status
    await prisma.nurseServiceAssignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: notes || assignment.notes
      }
    });

    // Check if all nurse services for this visit are completed
    const remainingServices = await prisma.nurseServiceAssignment.count({
      where: {
        visitId: assignment.visitId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    // Check if there's a doctor assigned to this visit
    const doctorAssignment = await prisma.assignment.findFirst({
      where: {
        patientId: assignment.visit.patientId
      }
    });

    const visitWithAssignment = await prisma.visit.findUnique({
      where: { id: assignment.visitId }
    });

    let newVisitStatus;
    if (remainingServices === 0) {
      // All nurse services completed
      if (doctorAssignment) {
        // Doctor is assigned - keep current status, don't change it
        // The doctor will see completed nurse services in the UI
        newVisitStatus = visitWithAssignment?.status || 'WAITING_FOR_NURSE_SERVICE';
      } else {
        // No doctor assigned - complete the visit
        newVisitStatus = 'COMPLETED';
      }
    } else {
      // Some nurse services still pending - keep current status
      newVisitStatus = visitWithAssignment?.status || 'WAITING_FOR_NURSE_SERVICE';
    }

    // Update visit status
    await prisma.visit.update({
      where: { id: assignment.visitId },
      data: {
        status: newVisitStatus,
        ...(newVisitStatus === 'COMPLETED' && { completedAt: new Date() })
      }
    });

    // Add to patient history
    await prisma.medicalHistory.create({
      data: {
        patientId: assignment.visit.patientId,
        visitId: assignment.visitId,
        doctorId: null, // Don't set doctorId for nurse services
        visitUid: assignment.visit.visitUid,
        visitDate: assignment.visit.date,
        completedDate: new Date(),
        details: JSON.stringify({
          serviceType: 'NURSE_SERVICE',
          serviceName: assignment.service.name,
          serviceCode: assignment.service.code,
          servicePrice: assignment.service.price,
          serviceDescription: assignment.service.description,
          completedBy: req.user.fullname,
          completedByRole: req.user.role,
          notes: notes || assignment.notes,
          completedAt: new Date()
        }),
        diagnosis: `Nurse Service: ${assignment.service.name}`,
        diagnosisDetails: assignment.service.description,
        instructions: notes || assignment.notes
      }
    });

    res.json({
      message: 'Nurse service completed successfully',
      assignment: {
        id: assignment.id,
        serviceName: assignment.service.name,
        patientName: assignment.visit.patient.name,
        completedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Error completing nurse service:', error);
    res.status(500).json({ error: error.message });
  }
};
