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

    // Check if visit exists and is in correct status
    const visit = await prisma.visit.findUnique({
      where: { id: data.visitId }
    });

    if (!visit) {
      return res.status(404).json({ error: 'Visit not found' });
    }

    if (visit.status !== 'WAITING_FOR_TRIAGE' && visit.status !== 'TRIAGED') {
      return res.status(400).json({ error: 'Cannot record vitals for this visit status' });
    }

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

    // Create audit log
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
          bmi: data.bmi
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

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
        assignmentId: assignment.id
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

    // Create consultation billing
    const billing = await prisma.billing.create({
      data: {
        patientId,
        visitId,
        totalAmount: doctor.consultationFee || consultationService.price,
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
        unitPrice: doctor.consultationFee || consultationService.price,
        totalPrice: doctor.consultationFee || consultationService.price
      }
    });

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

// Get daily tasks for continuous infusions
exports.getTodayTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.nurseTask.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'PENDING'
      },
      include: {
        continuousInfusion: {
          include: {
            medicationOrder: {
              include: {
                visit: {
                  include: {
                    patient: {
                      select: {
                        id: true,
                        name: true,
                        type: true
                      }
                    }
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
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    res.json({ tasks });
  } catch (error) {
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