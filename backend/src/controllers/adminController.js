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
  category: z.enum(['CONSULTATION', 'LAB', 'RADIOLOGY', 'MEDICATION', 'PROCEDURE', 'OTHER']),
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

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json({ services });
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
    const insurances = await prisma.insurance.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({ insurances });
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
