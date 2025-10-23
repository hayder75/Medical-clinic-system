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
          take: 1,
          include: {
            recordedBy: {
              select: { fullname: true, username: true }
            }
          }
        }
      }
    });
    
    // Get assigned doctors for each visit through Assignment table
    const visitsWithDoctors = await Promise.all(
      visits.map(async (visit) => {
        const assignment = await prisma.assignment.findFirst({
          where: { visitId: visit.id },
          include: {
            doctor: {
              select: { id: true, fullname: true, username: true, specialties: true }
            }
          }
        });
        
        return {
          ...visit,
          assignedDoctor: assignment?.doctor || null
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
    
    // Generate patient ID
    const now = new Date();
    const year = now.getFullYear();
    
    // Count existing patients to generate unique ID
    const patientCount = await prisma.patient.count();
    const patientNumber = String(patientCount + 1).padStart(2, '0');
    const patientId = `PAT-${year}-${patientNumber}`;
    
    // Get card registration service (300 Birr)
    const cardRegService = await prisma.service.findFirst({
      where: { code: 'CARD-REG', isActive: true }
    });
    
    if (!cardRegService) {
      return res.status(400).json({ error: 'Card registration service not found. Please contact admin.' });
    }
    
    // Create patient with INACTIVE card status
    const patient = await prisma.patient.create({
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
        insuranceId: validatedData.insuranceId || null,
        cardStatus: 'INACTIVE' // Card is INACTIVE until payment is processed
      }
    });
    
    // Create billing for card registration (300 Birr)
    const billing = await prisma.billing.create({
      data: {
        patientId: patient.id,
        totalAmount: cardRegService.price,
        status: 'PENDING',
        notes: 'Patient card registration fee',
        services: {
          create: {
            serviceId: cardRegService.id,
            quantity: 1,
            unitPrice: cardRegService.price,
            totalPrice: cardRegService.price
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
        action: 'PATIENT_REGISTRATION',
        entity: 'Patient',
        entityId: parseInt(patient.id.split('-').pop()) || 0,
        userId: receptionistId,
        details: `New patient registered: ${patient.name} (${patient.id}). Bill created: ${billing.id}`
      }
    });
    
    res.json({
      patient,
      billing,
      message: 'Patient registered successfully. Please proceed to billing for card registration payment (300 Birr).'
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

// Deactivate card manually (for testing purposes)
// NOTE: In production, this will be automatic based on 30-day expiry.
exports.deactivateCard = async (req, res) => {
  try {
    const { patientId } = req.params;
    const receptionistId = req.user.id;
    
    const patient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        cardStatus: 'INACTIVE',
        cardExpiryDate: new Date() // Set to now to mark as expired
      }
    });
    
    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'CARD_DEACTIVATION',
        entity: 'Patient',
        entityId: parseInt(patient.id.split('-').pop()) || 0,
        userId: receptionistId,
        details: `Card deactivated for ${patient.name} (${patient.id}) - FOR TESTING ONLY`
      }
    });
    
    res.json({
      patient,
      message: 'Card deactivated successfully (testing mode).'
    });
  } catch (error) {
    console.error('Error deactivating card:', error);
    res.status(500).json({ error: error.message });
  }
};

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
    
    // Check if patient card is active
    if (patient.cardStatus !== 'ACTIVE') {
      return res.status(400).json({ 
        error: 'Patient card is not active. Please activate the card before creating a visit.',
        cardStatus: patient.cardStatus
      });
    }
    
    // Generate visit UID
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const visitCount = await prisma.visit.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
        }
      }
    });
    const visitNumber = String(visitCount + 1).padStart(4, '0');
    const visitUid = `VISIT-${dateStr}-${visitNumber}`;
    
    // Create visit
    const visit = await prisma.visit.create({
      data: {
        visitUid,
        patientId: patient.id,
        createdById: receptionistId,
        suggestedDoctorId: validatedData.suggestedDoctorId || null,
        notes: validatedData.notes || null,
        queueType: validatedData.queueType,
        isEmergency: validatedData.isEmergency,
        status: 'WAITING_FOR_TRIAGE'
      }
    });
    
    // Log action
    await prisma.auditLog.create({
      data: {
        action: 'VISIT_CREATED',
        entity: 'Visit',
        entityId: visit.id,
        userId: receptionistId,
        details: `Visit created: ${visit.visitUid} for patient ${patient.name} (${patient.id}). ${validatedData.suggestedDoctorId ? `Suggested doctor: ${validatedData.suggestedDoctorId}` : 'No doctor suggested'}`
      }
    });
    
    res.json({
      visit,
      message: 'Visit created successfully and sent to triage.'
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
        }
      },
      orderBy: { code: 'asc' }
    });
    
    res.json({ services });
  } catch (error) {
    console.error('Error fetching card services:', error);
    res.status(500).json({ error: error.message });
  }
};

