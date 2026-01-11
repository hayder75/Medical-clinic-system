const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  dob: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  mobile: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  bloodType: z.enum(['A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'AB_PLUS', 'AB_MINUS', 'O_PLUS', 'O_MINUS', 'UNKNOWN']).optional(),
  maritalStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'UNKNOWN']).optional(),
  type: z.enum(['REGULAR', 'EMERGENCY', 'VIP']).default('REGULAR'),
  insuranceId: z.string().optional()
});

const activateCardSchema = z.object({
  patientId: z.string(),
  notes: z.string().optional()
});

const createVisitSchema = z.object({
  patientId: z.string(),
  suggestedDoctorId: z.string().nullable().optional(),
  notes: z.string().optional(),
  queueType: z.enum(['CONSULTATION', 'RESULTS_REVIEW']).default('CONSULTATION'),
  isEmergency: z.boolean().optional().default(false)
});

// Get all patients with card status
exports.getPatients = async (req, res) => {
  try {
    const { search, cardStatus, page = 1, limit = 50 } = req.query;
    
    const where = {};
    
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (cardStatus) {
      where.cardStatus = cardStatus;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          insurance: true,
          cardActivations: {
            orderBy: { activatedAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.patient.count({ where })
    ]);
    
    res.json({
      patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get patient history (all visits with doctor info)
exports.getPatientHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        cardActivations: {
          orderBy: { activatedAt: 'desc' },
          take: 5,
          include: {
            activatedBy: {
              select: { fullname: true, username: true }
            }
          }
        },
        insurance: true
      }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get visit history with assigned doctors
    const visits = await prisma.visit.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        createdBy: {
          select: { fullname: true, username: true }
        },
        vitals: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    // Get assigned doctors for each visit through Assignment table
    // Visit has assignmentId field that links to Assignment
    const visitsWithDoctors = await Promise.all(
      visits.map(async (visit) => {
        let assignedDoctor = null;
        
        // If visit has assignmentId, fetch the assignment
        if (visit.assignmentId) {
          const assignment = await prisma.assignment.findUnique({
            where: { id: visit.assignmentId },
            include: {
              doctor: {
                select: { id: true, fullname: true, username: true, specialties: true }
              }
            }
          });
          
          if (assignment) {
            assignedDoctor = assignment.doctor;
          }
        } else {
          // Fallback: try to find assignment by patientId (for older visits without assignmentId)
          // This is less accurate but better than nothing
          const assignment = await prisma.assignment.findFirst({
            where: {
              patientId: visit.patientId,
              status: { in: ['Pending', 'Active', 'Active'] }
            },
            orderBy: { createdAt: 'desc' },
            include: {
              doctor: {
                select: { id: true, fullname: true, username: true, specialties: true }
              }
            }
          });
          
          if (assignment) {
            assignedDoctor = assignment.doctor;
          }
        }
        
        return {
          ...visit,
          assignedDoctor: assignedDoctor
        };
      })
    );
    
    res.json({
      patient,
      visits: visitsWithDoctors
    });
  } catch (error) {
    console.error('Error fetching patient history:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create new patient (with card registration fee)
exports.createPatient = async (req, res) => {
  try {
    const validatedData = createPatientSchema.parse(req.body);
    const receptionistId = req.user.id;
    
    // Generate unique patient ID with retry logic to handle race conditions
    let patientId;
    let retries = 0;
    const maxRetries = 5;
    const year = new Date().getFullYear();
    
    let patient;
    while (retries < maxRetries) {
      try {
        // Use timestamp + random for better uniqueness
        const timestamp = Date.now().toString().slice(-6); // Last 6 digits
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        patientId = `PAT-${year}-${timestamp}-${random}`;
        
        // Create patient without billing - billing removed from registration
        patient = await prisma.patient.create({
          data: {
            id: patientId,
            name: validatedData.name,
            dob: validatedData.dob ? new Date(validatedData.dob) : null,
            gender: validatedData.gender || null,
            type: validatedData.type,
            mobile: validatedData.mobile || null,
            email: validatedData.email || null,
            address: validatedData.address || null,
            emergencyContact: validatedData.emergencyContact || null,
            bloodType: validatedData.bloodType || null,
            maritalStatus: validatedData.maritalStatus || null,
            insuranceId: validatedData.insuranceId || null
            // Removed: cardStatus: 'INACTIVE' - no card status check required
          }
        });
        
        break; // Success - patient created
      } catch (error) {
        // If it's a unique constraint error, retry with a new ID
        if (error.code === 'P2002' && error.meta?.target?.includes('id')) {
          retries++;
          if (retries >= maxRetries) {
            console.error('Failed to generate unique patientId after', maxRetries, 'attempts');
            throw new Error('Unable to generate unique patient ID. Please try again.');
          }
          // Wait a tiny bit before retrying (adds more randomness)
          await new Promise(resolve => setTimeout(resolve, 10));
        } else {
          // Different error - throw it
          throw error;
        }
      }
    }
    
    // Create card registration billing for non-emergency patients
    // Note: Visit is NOT created automatically - must be created manually after payment
    let billing = null;
    if (validatedData.type !== 'EMERGENCY') {
      try {
        // Find card registration service
        const cardRegService = await prisma.service.findFirst({
          where: {
            code: 'CARD-REG',
            isActive: true
          }
        });

        if (cardRegService) {
          billing = await prisma.billing.create({
            data: {
              patientId: patient.id,
              visitId: null, // Visit will be created after payment
              insuranceId: validatedData.insuranceId || null,
              totalAmount: cardRegService.price,
              status: 'PENDING',
              billingType: 'REGULAR',
              notes: `${validatedData.type} patient card registration`
            }
          });

          await prisma.billingService.create({
            data: {
              billingId: billing.id,
              serviceId: cardRegService.id,
              quantity: 1,
              unitPrice: cardRegService.price,
              totalPrice: cardRegService.price
            }
          });
        }
      } catch (error) {
        console.error('Error creating billing:', error);
      }
    }
    
    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'PATIENT_REGISTRATION',
        entity: 'Patient',
        entityId: parseInt(patient.id.split('-').pop()) || 0,
        userId: receptionistId,
        details: `New ${validatedData.type.toLowerCase()} patient registered: ${patient.name} (${patient.id}). CARD-REG billing created.`
      }
    });
    
    res.json({
      patient,
      billing,
      message: 'Patient registered successfully. Card registration billing created.'
    });
  } catch (error) {
    console.error('Error creating patient:', error);
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const field = err.path.join('.');
        const message = err.message;
        return `${field}: ${message}`;
      });
      return res.status(400).json({ 
        error: 'Validation error', 
        details: errorMessages,
        message: `Please fix the following errors: ${errorMessages.join(', ')}`
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Activate card (create billing for 200 Birr activation fee)
// NOTE: For development, this is manual. In production, this will be automatic based on 30-day expiry.
exports.activateCard = async (req, res) => {
  try {
    const validatedData = activateCardSchema.parse(req.body);
    const receptionistId = req.user.id;
    
    // Get patient
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Get card activation service (200 Birr)
    const cardActService = await prisma.service.findFirst({
      where: { code: 'CARD-ACT', isActive: true }
    });
    
    if (!cardActService) {
      return res.status(400).json({ error: 'Card activation service not found. Please contact admin.' });
    }
    
    // Create billing for card activation (200 Birr)
    const billing = await prisma.billing.create({
      data: {
        patientId: patient.id,
        totalAmount: cardActService.price,
        status: 'PENDING',
        notes: validatedData.notes || 'Patient card activation/renewal fee',
        services: {
          create: {
            serviceId: cardActService.id,
            quantity: 1,
            unitPrice: cardActService.price,
            totalPrice: cardActService.price
          }
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });
    
    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CARD_ACTIVATION_REQUEST',
        entity: 'Patient',
        entityId: parseInt(patient.id.split('-').pop()) || 0,
        userId: receptionistId,
        details: `Card activation requested for ${patient.name} (${patient.id}). Bill created: ${billing.id}`
      }
    });
    
    res.json({
      billing,
      message: 'Card activation billing created successfully. Please proceed to billing for payment (200 Birr).'
    });
  } catch (error) {
    console.error('Error activating card:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Note: Manual deactivation removed - cards now deactivate automatically based on expiry date
// See server.js for automatic deactivation function

// Create visit (only if card is active)
exports.createVisit = async (req, res) => {
  try {
    const validatedData = createVisitSchema.parse(req.body);
    const receptionistId = req.user.id;
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Removed: Card status check - visits can be created regardless of card status
    
    // Check if patient already has an active visit
    const activeVisit = await prisma.visit.findFirst({
      where: {
        patientId: validatedData.patientId,
        status: {
          in: [
            'WAITING_FOR_TRIAGE',
            'TRIAGED', 
            'WAITING_FOR_DOCTOR',
            'IN_DOCTOR_QUEUE',
            'UNDER_DOCTOR_REVIEW',
            'SENT_TO_LAB',
            'SENT_TO_RADIOLOGY', 
            'SENT_TO_BOTH',
            'RETURNED_WITH_RESULTS',
            'AWAITING_LAB_RESULTS',
            'AWAITING_RADIOLOGY_RESULTS',
            'AWAITING_RESULTS_REVIEW',
            'WAITING_FOR_NURSE_SERVICE',
            'NURSE_SERVICES_COMPLETED',
            'DENTAL_SERVICES_ORDERED'
          ]
        }
      },
      include: {
        bills: {
          where: {
            status: {
              in: ['PENDING', 'PAID']
            }
          }
        }
      }
    });

    if (activeVisit) {
      return res.status(409).json({ 
        error: 'Patient already has an active visit',
        existingVisit: {
          id: activeVisit.id,
          visitUid: activeVisit.visitUid,
          status: activeVisit.status,
          createdAt: activeVisit.createdAt,
          hasPendingBilling: activeVisit.bills.some(bill => bill.status === 'PENDING')
        },
        suggestion: 'Complete the current visit before creating a new one'
      });
    }
    
    // Generate unique visit UID with retry logic to handle race conditions
    const { generateUniqueVisitUid } = require('../utils/visitUidGenerator');
    
    const visit = await generateUniqueVisitUid(async (visitUid) => {
      return await prisma.visit.create({
        data: {
          visitUid,
          patientId: patient.id,
          createdById: receptionistId,
          suggestedDoctorId: validatedData.suggestedDoctorId || null,
          notes: validatedData.notes || null,
          queueType: validatedData.queueType,
          isEmergency: validatedData.isEmergency,
          status: validatedData.isEmergency ? 'WAITING_FOR_TRIAGE' : 'WAITING_FOR_TRIAGE'
        }
      });
    });
    
    // For emergency visits, create emergency billing (no consultation fee upfront)
    let billing = null;
    if (validatedData.isEmergency) {
      billing = await prisma.billing.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          totalAmount: 0,
          status: 'EMERGENCY_PENDING',
          billingType: 'EMERGENCY',
          notes: 'Emergency visit - services will be added as needed'
        }
      });
    }
    
    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'VISIT_CREATED',
        entity: 'Visit',
        entityId: visit.id,
        userId: receptionistId,
        details: `Visit created: ${visit.visitUid} for patient ${patient.name} (${patient.id}). ${validatedData.isEmergency ? 'EMERGENCY visit - no consultation fee required' : 'Regular visit'}. ${validatedData.suggestedDoctorId ? `Suggested doctor: ${validatedData.suggestedDoctorId}` : 'No doctor suggested'}`
      }
    });
    
    res.json({
      visit,
      billing,
      message: validatedData.isEmergency 
        ? 'Emergency visit created successfully. No consultation fee required - services will be tracked separately.'
        : 'Visit created successfully and sent to triage.'
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        const field = err.path.join('.');
        const message = err.message;
        return `${field}: ${message}`;
      });
      return res.status(400).json({ 
        error: 'Validation error', 
        details: errorMessages,
        message: `Please fix the following errors: ${errorMessages.join(', ')}`
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all doctors for suggestion dropdown
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
        username: true,
        specialties: true,
        consultationFee: true
      },
      orderBy: { fullname: 'asc' }
    });
    
    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get card services for admin configuration
exports.getCardServices = async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: {
        code: {
          in: ['CARD-REG', 'CARD-ACT']
        },
        isActive: true
      },
      orderBy: { code: 'asc' }
    });
    
    res.json({ services });
  } catch (error) {
    console.error('Error fetching card services:', error);
    res.status(500).json({ error: error.message });
  }
};

