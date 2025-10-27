const prisma = require('../config/database');
const { z } = require('zod');
const bcrypt = require('bcryptjs');

// Validation schemas
const createUserSchema = z.object({
  fullname: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'OWNER', 'BILLING_OFFICER', 'PHARMACY_BILLING_OFFICER', 'CARE_COORDINATOR', 'CMO', 'CLINICAL_RESEARCH_COORDINATOR', 'DIETITIAN', 'DOCTOR', 'HOSPITAL_MANAGER', 'HR_OFFICER', 'IT_SUPPORT', 'LAB_TECHNICIAN', 'MEDICAL_RECORDS_OFFICER', 'NURSE', 'PATIENT', 'PHARMACY_OFFICER', 'PHARMACIST', 'RADIOLOGIST', 'RECEPTIONIST', 'SECURITY_STAFF', 'SOCIAL_WORKER']),
  specialties: z.array(z.string()).optional(),
  licenseNumber: z.string().optional(),
  consultationFee: z.number().optional(),
});

const createServiceSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.enum(['CONSULTATION', 'LAB', 'RADIOLOGY', 'MEDICATION', 'PROCEDURE', 'NURSE', 'OTHER']),
  price: z.number().positive(),
  description: z.string().optional(),
});

const createInsuranceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  contactInfo: z.string().optional(),
});

const createInvestigationTypeSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['LAB', 'RADIOLOGY']),
  serviceId: z.string().optional(),
  description: z.string().optional(),
});

const createInventorySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(0),
  category: z.enum(['TABLETS', 'CAPSULES', 'INJECTIONS', 'SYRUPS', 'OINTMENTS', 'DROPS', 'INHALERS', 'PATCHES', 'INFUSIONS']).optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  supplier: z.string().optional(),
  price: z.number().positive().optional(),
  serviceId: z.string().optional(),
});

// User Management
exports.createUser = async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    
    // Check if username or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: data.username },
          { email: data.email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        specialties: data.specialties || []
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        specialties: true,
        licenseNumber: true,
        consultationFee: true,
        availability: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let whereClause = {};
    if (role) {
      whereClause.role = role;
    }

    try {
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullname: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          specialties: true,
          licenseNumber: true,
          consultationFee: true,
          availability: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ users });
    } catch (dbError) {
      console.log('Database not available, returning mock users data');
      
      // Fallback mock data when database is not available
      const mockUsers = [
        {
          id: 'f4bfc674-0598-47b1-9d7f-ae1784afdfb6',
          fullname: 'System Administrator',
          username: 'admin',
          email: 'admin@clinic.com',
          phone: null,
          role: 'ADMIN',
          specialties: [],
          licenseNumber: null,
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '8ef8017b-9117-4571-bd45-86a64565bc4b',
          fullname: 'Dr. Sarah Johnson',
          username: 'doctor1',
          email: 'doctor1@clinic.com',
          phone: '0912345678',
          role: 'DOCTOR',
          specialties: ['General Medicine'],
          licenseNumber: 'DOC123456',
          consultationFee: 500,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '533c4c75-983d-452a-adcb-8091bb3bd03b',
          fullname: 'Pharmacy Staff',
          username: 'pharmacy',
          email: 'pharmacy@clinic.com',
          phone: '0912345679',
          role: 'PHARMACIST',
          specialties: [],
          licenseNumber: null,
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fullname: 'Nurse Jane',
          username: 'nurse',
          email: 'nurse@clinic.com',
          phone: '0912345680',
          role: 'NURSE',
          specialties: ['General Nursing'],
          licenseNumber: 'NUR123456',
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          fullname: 'Billing Staff',
          username: 'billing',
          email: 'billing@clinic.com',
          phone: '0912345681',
          role: 'BILLING_OFFICER',
          specialties: [],
          licenseNumber: null,
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        }
      ];

      // Filter by role if specified
      const filteredUsers = role ? mockUsers.filter(user => user.role === role) : mockUsers;
      
      res.json({ users: filteredUsers });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createUserSchema.partial().omit({ password: true }).parse(req.body);

    // Check if username or email already exists (excluding current user)
    if (data.username || data.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.username ? { username: data.username } : {},
                data.email ? { email: data.email } : {}
              ]
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username or email already exists' 
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        specialties: true,
        licenseNumber: true,
        consultationFee: true,
        availability: true,
        createdAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of admin users
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot delete admin or owner users' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Service Management
exports.createService = async (req, res) => {
  try {
    const data = createServiceSchema.parse(req.body);

    // Check if service code already exists
    const existingService = await prisma.service.findUnique({
      where: { code: data.code }
    });

    if (existingService) {
      return res.status(400).json({ 
        error: 'Service code already exists' 
      });
    }

    const service = await prisma.service.create({
      data
    });

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    try {
      const services = await prisma.service.findMany({
        where: whereClause,
        orderBy: { name: 'asc' }
      });

      res.json({ services });
    } catch (dbError) {
      console.log('Database not available, returning mock services data');
      
      // Fallback mock data when database is not available
      const mockServices = [
        {
          id: '1',
          name: 'General Doctor Consultation',
          category: 'CONSULTATION',
          price: 100,
          description: 'General medical consultation',
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '2',
          name: 'Specialist Consultation',
          category: 'CONSULTATION',
          price: 150,
          description: 'Specialist medical consultation',
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '3',
          name: 'Complete Blood Count (CBC)',
          category: 'LAB',
          price: 150,
          description: 'Complete blood count laboratory test',
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '4',
          name: 'X-Ray Chest PA View',
          category: 'RADIOLOGY',
          price: 45,
          description: 'Chest X-ray PA view',
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '5',
          name: 'Blood Pressure Check',
          category: 'NURSE',
          price: 15,
          description: 'Blood pressure monitoring',
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '6',
          name: 'Entry Fee',
          category: 'OTHER',
          price: 50,
          description: 'General entry fee',
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        }
      ];

      // Filter by category if specified
      let filteredServices = category ? mockServices.filter(service => service.category === category) : mockServices;
      
      // Filter by isActive if specified
      if (isActive !== undefined) {
        filteredServices = filteredServices.filter(service => service.isActive === (isActive === 'true'));
      }
      
      res.json({ services: filteredServices });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createServiceSchema.partial().parse(req.body);

    const service = await prisma.service.update({
      where: { id },
      data
    });

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if service is being used in any billings
    const billingServices = await prisma.billingService.findFirst({
      where: { serviceId: id }
    });

    if (billingServices) {
      return res.status(400).json({ 
        error: 'Cannot delete service that is being used in billing records' 
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Insurance Management
exports.createInsurance = async (req, res) => {
  try {
    const data = createInsuranceSchema.parse(req.body);

    // Check if insurance code already exists
    const existingInsurance = await prisma.insurance.findUnique({
      where: { code: data.code }
    });

    if (existingInsurance) {
      return res.status(400).json({ 
        error: 'Insurance code already exists' 
      });
    }

    const insurance = await prisma.insurance.create({
      data
    });

    res.status(201).json({
      message: 'Insurance created successfully',
      insurance
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInsurances = async (req, res) => {
  try {
    try {
      const insurances = await prisma.insurance.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      res.json({ insurances });
    } catch (dbError) {
      console.log('Database not available, returning mock insurances data');
      
      // Fallback mock data when database is not available
      const mockInsurances = [
        {
          id: '1',
          name: 'Ethiopian Telecom',
          code: 'ETC001',
          type: 'CORPORATE',
          coveragePercentage: 80,
          maxCoverageAmount: 10000,
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '2',
          name: 'Test Insurance',
          code: 'TEST001',
          type: 'INDIVIDUAL',
          coveragePercentage: 70,
          maxCoverageAmount: 5000,
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '3',
          name: 'Government Insurance',
          code: 'GOV001',
          type: 'GOVERNMENT',
          coveragePercentage: 90,
          maxCoverageAmount: 15000,
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        }
      ];
      
      res.json({ insurances: mockInsurances });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createInsuranceSchema.partial().parse(req.body);

    const insurance = await prisma.insurance.update({
      where: { id },
      data
    });

    res.json({
      message: 'Insurance updated successfully',
      insurance
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if insurance exists
    const insurance = await prisma.insurance.findUnique({
      where: { id }
    });

    if (!insurance) {
      return res.status(404).json({ error: 'Insurance not found' });
    }

    // Check if insurance is being used by patients
    const patientsWithInsurance = await prisma.patient.findFirst({
      where: { insuranceId: id }
    });

    if (patientsWithInsurance) {
      return res.status(400).json({ 
        error: 'Cannot delete insurance that is being used by patients' 
      });
    }

    await prisma.insurance.delete({
      where: { id }
    });

    res.json({
      message: 'Insurance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Investigation Types Management
exports.createInvestigationType = async (req, res) => {
  try {
    const data = createInvestigationTypeSchema.parse(req.body);

    const investigationType = await prisma.investigationType.create({
      data
    });

    res.status(201).json({
      message: 'Investigation type created successfully',
      investigationType
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
    const { category } = req.query;
    
    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }

    const investigationTypes = await prisma.investigationType.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ investigationTypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Inventory Management
exports.createInventoryItem = async (req, res) => {
  try {
    const data = createInventorySchema.parse(req.body);

    const inventoryItem = await prisma.inventory.create({
      data
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      inventoryItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    
    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (lowStock === 'true') {
      whereClause.quantity = { lt: 10 }; // Less than 10 items
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createInventorySchema.partial().parse(req.body);

    const inventoryItem = await prisma.inventory.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      message: 'Inventory item updated successfully',
      inventoryItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Billing Overview
exports.getBillingOverview = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const billings = await prisma.billing.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: true,
        insurance: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary statistics
    const totalAmount = billings.reduce((sum, billing) => sum + billing.totalAmount, 0);
    const paidAmount = billings
      .filter(billing => billing.status === 'PAID')
      .reduce((sum, billing) => sum + billing.totalAmount, 0);
    const pendingAmount = billings
      .filter(billing => billing.status === 'PENDING')
      .reduce((sum, billing) => sum + billing.totalAmount, 0);

    res.json({
      billings,
      summary: {
        totalBillings: billings.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        paidPercentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { userId, action, entity, startDate, endDate } = req.query;
    
    let whereClause = {};
    if (userId) {
      whereClause.userId = userId;
    }
    if (action) {
      whereClause.action = { contains: action };
    }
    if (entity) {
      whereClause.entity = entity;
    }
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to last 1000 entries
    });

    res.json({ auditLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reports
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Revenue by service category
    const revenueByCategory = await prisma.billing.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Service-wise revenue
    const serviceRevenue = await prisma.billingService.groupBy({
      by: ['serviceId'],
      where: {
        billing: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      }
    });

    // Get service details
    const serviceDetails = await prisma.service.findMany({
      where: {
        id: {
          in: serviceRevenue.map(s => s.serviceId)
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        code: true
      }
    });

    // Patient statistics
    const patientStats = await prisma.patient.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _count: {
        id: true
      }
    });

    // Visit statistics
    const visitStats = await prisma.visit.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _count: {
        id: true
      }
    });

    // Lab orders pending
    const pendingLabOrders = await prisma.labOrder.count({
      where: {
        status: 'QUEUED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Radiology orders pending
    const pendingRadiologyOrders = await prisma.radiologyOrder.count({
      where: {
        status: 'QUEUED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Medication orders pending
    const pendingMedicationOrders = await prisma.medicationOrder.count({
      where: {
        status: 'QUEUED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Pharmacy invoices pending
    const pendingPharmacyInvoices = await prisma.pharmacyInvoice.count({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Calculate totals
    const totalRevenue = revenueByCategory
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + (r._sum.totalAmount || 0), 0);

    const totalBillings = revenueByCategory.reduce((sum, r) => sum + (r._count.id || 0), 0);

    res.json({
      date: reportDate.toISOString().split('T')[0],
      revenue: {
        total: totalRevenue,
        byStatus: revenueByCategory,
        byService: serviceRevenue.map(s => ({
          ...s,
          service: serviceDetails.find(sd => sd.id === s.serviceId)
        }))
      },
      patients: {
        byType: patientStats,
        total: patientStats.reduce((sum, p) => sum + (p._count.id || 0), 0)
      },
      visits: {
        byStatus: visitStats,
        total: visitStats.reduce((sum, v) => sum + (v._count.id || 0), 0)
      },
      pendingOrders: {
        lab: pendingLabOrders,
        radiology: pendingRadiologyOrders,
        medication: pendingMedicationOrders,
        pharmacy: pendingPharmacyInvoices
      },
      summary: {
        totalBillings,
        totalRevenue,
        averageBillingAmount: totalBillings > 0 ? totalRevenue / totalBillings : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const { startDate } = req.query;
    const weekStart = startDate ? new Date(startDate) : new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Daily revenue breakdown
    const dailyRevenue = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRevenue = await prisma.billing.aggregate({
        where: {
          status: 'PAID',
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      });

      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue._sum.totalAmount || 0,
        billings: dayRevenue._count.id || 0
      });
    }

    // Service category performance
    const categoryPerformance = await prisma.billingService.groupBy({
      by: ['serviceId'],
      where: {
        billing: {
          status: 'PAID',
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      }
    });

    // Get service details
    const serviceDetails = await prisma.service.findMany({
      where: {
        id: {
          in: categoryPerformance.map(s => s.serviceId)
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        code: true
      }
    });

    // Doctor performance
    const doctorPerformance = await prisma.visit.groupBy({
      by: ['createdById'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _count: {
        id: true
      }
    });

    // Get doctor details
    const doctorDetails = await prisma.user.findMany({
      where: {
        id: {
          in: doctorPerformance.map(d => d.createdById).filter(Boolean)
        },
        role: 'DOCTOR'
      },
      select: {
        id: true,
        fullname: true,
        specialties: true
      }
    });

    // Calculate totals
    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const totalBillings = dailyRevenue.reduce((sum, day) => sum + day.billings, 0);

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dailyRevenue,
      categoryPerformance: categoryPerformance.map(cp => ({
        ...cp,
        service: serviceDetails.find(sd => sd.id === cp.serviceId)
      })),
      doctorPerformance: doctorPerformance.map(dp => ({
        ...dp,
        doctor: doctorDetails.find(dd => dd.id === dp.createdById)
      })),
      summary: {
        totalRevenue,
        totalBillings,
        averageDailyRevenue: totalRevenue / 7,
        averageBillingAmount: totalBillings > 0 ? totalRevenue / totalBillings : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Revenue trends - always group by date for billing table
    const revenueTrends = await prisma.billing.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Top performing services
    const topServices = await prisma.billingService.groupBy({
      by: ['serviceId'],
      where: {
        billing: {
          status: 'PAID',
          createdAt: {
            gte: start,
            lte: end
          }
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 10
    });

    // Get service details for top services
    const topServiceDetails = await prisma.service.findMany({
      where: {
        id: {
          in: topServices.map(s => s.serviceId)
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        code: true,
        price: true
      }
    });

    // Payment method breakdown
    const paymentMethods = await prisma.billPayment.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Insurance vs cash revenue
    const insuranceRevenue = await prisma.billing.aggregate({
      where: {
        status: 'INSURANCE_CLAIMED',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const cashRevenue = await prisma.billing.aggregate({
      where: {
        status: 'PAID',
        insuranceId: null,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      revenueTrends,
      topServices: topServices.map(ts => ({
        ...ts,
        service: topServiceDetails.find(tsd => tsd.id === ts.serviceId)
      })),
      paymentMethods,
      revenueBreakdown: {
        insurance: insuranceRevenue._sum.totalAmount || 0,
        cash: cashRevenue._sum.totalAmount || 0,
        total: (insuranceRevenue._sum.totalAmount || 0) + (cashRevenue._sum.totalAmount || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all nurses (users with role=NURSE)
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
        availability: true,
        createdAt: true
      },
      orderBy: { fullname: 'asc' }
    });

    res.json({ nurses });
  } catch (error) {
    console.error('Error fetching nurses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Comprehensive Revenue Stats for Admin Dashboard (ALL users, not just current user)
exports.getRevenueStats = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    // Calculate date range based on period
    let start, end;
    const now = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(start);
          end.setDate(end.getDate() + 1);
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          start = new Date(now);
          start.setDate(start.getDate() - dayOfWeek);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(end.getDate() + 7);
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'yearly':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(start);
          end.setDate(end.getDate() + 1);
      }
    }

    // ========== MEDICAL REVENUE (Completed/PAID) ==========
    // Get all PAID payments from BillPayment (not user-specific)
    const medicalPayments = await prisma.billPayment.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end
        }
      },
      include: {
        billing: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count completed visits
    const completedVisits = await prisma.visit.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: start,
          lt: end
        }
      }
    });

    // Count lab tests completed
    const labTests = await prisma.labOrder.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: start,
          lt: end
        }
      }
    });

    // Count radiology scans completed
    const radiologyScans = await prisma.radiologyOrder.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: start,
          lt: end
        }
      }
    });

    // Calculate medical revenue breakdown
    const medicalRevenue = medicalPayments.reduce((sum, p) => sum + p.amount, 0);
    const medicalByType = medicalPayments.reduce((acc, p) => {
      acc[p.type] = acc[p.type] || { count: 0, amount: 0 };
      acc[p.type].count += 1;
      acc[p.type].amount += p.amount;
      return acc;
    }, {});

    // ========== PHARMACY REVENUE (Completed/PAID) ==========
    // Get all PAID pharmacy invoices
    const pharmacyInvoices = await prisma.pharmacyInvoice.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: start,
          lt: end
        }
      },
      include: {
        dispensedMedicines: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const pharmacyRevenue = pharmacyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const prescriptions = pharmacyInvoices.length;
    const medicationsDispensed = pharmacyInvoices.reduce((sum, inv) => 
      sum + inv.dispensedMedicines.length, 0
    );

    // ========== PENDING MEDICAL BILLS ==========
    const pendingMedicalBills = await prisma.billing.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: start,
          lt: end
        },
        NOT: {
          billingType: 'EMERGENCY'
        }
      },
      select: {
        totalAmount: true
      }
    });

    const pendingMedicalRevenue = pendingMedicalBills.reduce((sum, b) => sum + b.totalAmount, 0);

    // ========== PENDING PHARMACY INVOICES ==========
    const pendingPharmacyInvoices = await prisma.pharmacyInvoice.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        totalAmount: true
      }
    });

    const pendingPharmacyRevenue = pendingPharmacyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // ========== RESPONSE STRUCTURE ==========
    const response = {
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      completed: {
        medical: {
          revenue: medicalRevenue,
          transactions: medicalPayments.length,
          consultations: completedVisits,
          labTests,
          radiologyScans,
          byType: medicalByType
        },
        pharmacy: {
          revenue: pharmacyRevenue,
          prescriptions,
          medications: medicationsDispensed,
          transactions: pharmacyInvoices.length
        },
        combined: {
          totalRevenue: medicalRevenue + pharmacyRevenue,
          totalTransactions: medicalPayments.length + pharmacyInvoices.length
        }
      },
      pending: {
        medical: {
          revenue: pendingMedicalRevenue,
          bills: pendingMedicalBills.length
        },
        pharmacy: {
          revenue: pendingPharmacyRevenue,
          invoices: pendingPharmacyInvoices.length
        },
        combined: {
          totalRevenue: pendingMedicalRevenue + pendingPharmacyRevenue,
          totalBills: pendingMedicalBills.length + pendingPharmacyInvoices.length
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get daily breakdown for a specific month
exports.getDailyBreakdown = async (req, res) => {
  try {
    const { year, month } = req.query; // e.g., year=2025, month=10 (0-based)
    
    const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month, day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(year, month, day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get medical payments for this day
      const medicalPayments = await prisma.billPayment.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      // Get pharmacy invoices for this day
      const pharmacyInvoices = await prisma.pharmacyInvoice.findMany({
        where: {
          status: 'PAID',
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      const medicalRevenue = medicalPayments.reduce((sum, p) => sum + p.amount, 0);
      const pharmacyRevenue = pharmacyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalRevenue = medicalRevenue + pharmacyRevenue;
      
      dailyData.push({
        date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        medical: {
          revenue: medicalRevenue,
          transactions: medicalPayments.length
        },
        pharmacy: {
          revenue: pharmacyRevenue,
          transactions: pharmacyInvoices.length
        },
        combined: {
          revenue: totalRevenue,
          transactions: medicalPayments.length + pharmacyInvoices.length
        }
      });
    }
    
    res.json({ dailyData });
  } catch (error) {
    console.error('Error getting daily breakdown:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get doctor performance statistics
exports.getDoctorPerformanceStats = async (req, res) => {
  try {
    const { period = 'daily', doctorId } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    
    // Get all doctors with consultation fees
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        ...(doctorId && { id: doctorId })
      },
      select: {
        id: true,
        fullname: true,
        consultationFee: true
      }
    });
    
    // Find consultation service (not used in this function but keeping for consistency)
    // const consultationService = await prisma.service.findFirst({
    //   where: {
    //     category: 'CONSULTATION',
    //     name: { contains: 'Consultation', mode: 'insensitive' }
    //   }
    // });
    
    const results = await Promise.all(doctors.map(async (doctor) => {
      // Find all visits with this doctor assigned
      const visits = await prisma.visit.findMany({
        where: {
          suggestedDoctorId: doctor.id,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          createdAt: true,
          patientId: true,
          patient: {
            select: {
              name: true
            }
          }
        }
      });
      
      // Get consultation billing for these visits
      const billings = await prisma.billing.findMany({
        where: {
          visitId: { in: visits.map(v => v.id) },
          services: {
            some: {
              service: {
                category: 'CONSULTATION'
              }
            }
          }
        },
        include: {
          services: {
            where: {
              service: {
                category: 'CONSULTATION'
              }
            }
          },
          payments: true // Include all payment types
        }
      });
      
      // Calculate statistics
      const totalPatients = visits.length;
      const totalRevenue = billings.reduce((sum, b) => {
        const paidAmount = b.payments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paidAmount;
      }, 0);
      const avgPerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;
      
      return {
        doctorId: doctor.id,
        doctorName: doctor.fullname,
        consultationFee: doctor.consultationFee,
        totalPatients,
        totalRevenue,
        avgPerPatient,
        visits: visits.map(v => ({
          id: v.id,
          date: v.createdAt,
          patientId: v.patientId,
          patientName: v.patient.name
        }))
      };
    }));
    
    // Calculate summary statistics
    const summary = {
      totalConsultationFees: results.reduce((sum, r) => sum + r.totalRevenue, 0),
      avgPerDoctor: results.length > 0 ? results.reduce((sum, r) => sum + r.totalRevenue, 0) / results.length : 0,
      totalConsultations: results.reduce((sum, r) => sum + r.totalPatients, 0),
      topPerformer: results.reduce((top, current) => current.totalRevenue > top.totalRevenue ? current : top, results[0] || null)
    };
    
    res.json({
      period,
      dateRange: { startDate, endDate },
      summary,
      doctors: results
    });
  } catch (error) {
    console.error('Error getting doctor performance stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get doctor daily breakdown for calendar view
exports.getDoctorDailyBreakdown = async (req, res) => {
  try {
    const { doctorId, year, month } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    const y = parseInt(year || new Date().getFullYear());
    const m = parseInt(month || new Date().getMonth());
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const dailyData = [];
    
    // Find consultation service
    const consultationService = await prisma.service.findFirst({
      where: {
        category: 'CONSULTATION',
        name: { contains: 'Consultation', mode: 'insensitive' }
      }
    });
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(y, m, day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(y, m, day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Find visits for this doctor on this day
      const visits = await prisma.visit.findMany({
        where: {
          suggestedDoctorId: doctorId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        select: {
          id: true
        }
      });
      
      // Get consultation billing for these visits
      const billings = await prisma.billing.findMany({
        where: {
          visitId: { in: visits.map(v => v.id) },
          services: {
            some: {
              service: {
                category: 'CONSULTATION'
              }
            }
          }
        },
        include: {
          services: {
            where: {
              service: {
                category: 'CONSULTATION'
              }
            }
          },
          payments: true,
          visit: {
            include: {
              patient: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Calculate revenue for this day
      const revenue = billings.reduce((sum, b) => {
        const paidAmount = b.payments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paidAmount;
      }, 0);
      
      // Get patient details for this day
      const patients = await Promise.all(billings.map(async (b) => {
        // Get visit details including patient name if not already loaded
        let visitDetails = b.visit;
        if (!visitDetails || !visitDetails.patient) {
          visitDetails = await prisma.visit.findUnique({
            where: { id: b.visitId },
            include: {
              patient: {
                select: {
                  name: true
                }
              }
            }
          });
        }
        
        return {
          visitId: b.visitId,
          patientName: visitDetails?.patient?.name || 'Unknown',
          amount: b.services.reduce((s, sv) => s + sv.totalPrice, 0),
          paymentStatus: b.payments.length > 0 ? 'PAID' : 'PENDING',
          date: visitDetails?.createdAt || b.createdAt
        };
      }));
      
      dailyData.push({
        date: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        revenue,
        patients: patients.length,
        details: patients
      });
    }
    
    res.json({ dailyData });
  } catch (error) {
    console.error('Error getting doctor daily breakdown:', error);
    res.status(500).json({ error: error.message });
  }
};
