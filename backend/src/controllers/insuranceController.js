const { PrismaClient } = require('@prisma/client');
const { z } = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createInsuranceTransactionSchema = z.object({
  insuranceId: z.string().uuid(),
  patientId: z.string(),
  visitId: z.number().int().optional(),
  serviceType: z.enum(['CONSULTATION', 'LAB_TEST', 'RADIOLOGY', 'MEDICATION', 'PROCEDURE', 'NURSE_SERVICE', 'OTHER']),
  serviceId: z.string().optional(),
  serviceName: z.string(),
  serviceCode: z.string().optional(),
  medicationId: z.string().optional(),
  medicationName: z.string().optional(),
  unitPrice: z.number().positive(),
  totalAmount: z.number().positive(),
  quantity: z.number().int().positive().default(1),
  notes: z.string().optional()
});

const updateInsuranceTransactionStatusSchema = z.object({
  status: z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'COLLECTED', 'REJECTED']),
  claimNumber: z.string().optional(),
  transactionNumber: z.string().optional(),
  notes: z.string().optional(),
  receiptPath: z.string().optional()
});

// Get all insurance companies with transaction summaries
exports.getInsuranceCompanies = async (req, res) => {
  try {
    const insurances = await prisma.insurance.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            transactions: true
          }
        },
        transactions: {
          select: {
            totalAmount: true,
            status: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate totals for each insurance company
    const insurancesWithTotals = insurances.map(insurance => {
      const transactions = insurance.transactions;
      const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
      
      const statusCounts = transactions.reduce((acc, t) => {
        acc[t.status] = (acc[t.status] || 0) + 1;
        return acc;
      }, {});

      const pendingAmount = transactions
        .filter(t => ['PENDING', 'SUBMITTED', 'APPROVED'].includes(t.status))
        .reduce((sum, t) => sum + t.totalAmount, 0);

      const collectedAmount = transactions
        .filter(t => t.status === 'COLLECTED')
        .reduce((sum, t) => sum + t.totalAmount, 0);

      return {
        id: insurance.id,
        name: insurance.name,
        code: insurance.code,
        contactInfo: insurance.contactInfo,
        totalTransactions: insurance._count.transactions,
        totalAmount,
        pendingAmount,
        collectedAmount,
        statusCounts,
        createdAt: insurance.createdAt
      };
    });

    res.json({ insurances: insurancesWithTotals });
  } catch (error) {
    console.error('Error fetching insurance companies:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get detailed transactions for a specific insurance company
exports.getInsuranceTransactions = async (req, res) => {
  try {
    const { insuranceId } = req.params;
    const { status, page = 1, limit = 50 } = req.query;

    // Validate insurance exists
    const insurance = await prisma.insurance.findUnique({
      where: { id: insuranceId }
    });

    if (!insurance) {
      return res.status(404).json({ error: 'Insurance company not found' });
    }

    // Build where clause
    const where = { insuranceId };
    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Get transactions with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, totalCount] = await Promise.all([
      prisma.insuranceTransaction.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              mobile: true,
              type: true
            }
          },
          visit: {
            select: {
              id: true,
              visitUid: true,
              status: true,
              createdAt: true
            }
          }
        },
        orderBy: { serviceDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.insuranceTransaction.count({ where })
    ]);

    // Calculate totals
    const allTransactions = await prisma.insuranceTransaction.findMany({
      where: { insuranceId },
      select: { totalAmount: true, status: true }
    });

    const totalAmount = allTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const pendingAmount = allTransactions
      .filter(t => ['PENDING', 'SUBMITTED', 'APPROVED'].includes(t.status))
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const collectedAmount = allTransactions
      .filter(t => t.status === 'COLLECTED')
      .reduce((sum, t) => sum + t.totalAmount, 0);

    res.json({
      insurance: {
        id: insurance.id,
        name: insurance.name,
        code: insurance.code,
        contactInfo: insurance.contactInfo
      },
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      totals: {
        totalAmount,
        pendingAmount,
        collectedAmount,
        totalTransactions: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching insurance transactions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new insurance transaction
exports.createInsuranceTransaction = async (req, res) => {
  try {
    const data = createInsuranceTransactionSchema.parse(req.body);
    const createdById = req.user.id;

    const transaction = await prisma.insuranceTransaction.create({
      data: {
        ...data,
        createdById
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
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

    res.status(201).json({
      message: 'Insurance transaction created successfully',
      transaction
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error creating insurance transaction:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update insurance transaction status
exports.updateInsuranceTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const data = updateInsuranceTransactionStatusSchema.parse(req.body);
    const updatedById = req.user.id;

    // Check if transaction exists
    const existingTransaction = await prisma.insuranceTransaction.findUnique({
      where: { id: transactionId }
    });

    if (!existingTransaction) {
      return res.status(404).json({ error: 'Insurance transaction not found' });
    }

    // Prepare update data
    const updateData = {
      ...data,
      updatedAt: new Date()
    };

    // Set collection date if status is COLLECTED
    if (data.status === 'COLLECTED') {
      updateData.collectedDate = new Date();
      updateData.collectedById = updatedById;
    }

    // Set claim date if status is SUBMITTED
    if (data.status === 'SUBMITTED') {
      updateData.claimDate = new Date();
    }

    const transaction = await prisma.insuranceTransaction.update({
      where: { id: transactionId },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true
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

    res.json({
      message: 'Insurance transaction status updated successfully',
      transaction
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Error updating insurance transaction:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generate report for insurance company
exports.generateInsuranceReport = async (req, res) => {
  try {
    const { insuranceId } = req.params;
    const { startDate, endDate, status } = req.query;

    // Validate insurance exists
    const insurance = await prisma.insurance.findUnique({
      where: { id: insuranceId }
    });

    if (!insurance) {
      return res.status(404).json({ error: 'Insurance company not found' });
    }

    // Build where clause
    const where = { insuranceId };
    
    if (startDate && endDate) {
      where.serviceDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    // Get all transactions for the report
    const transactions = await prisma.insuranceTransaction.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
            type: true
          }
        },
        visit: {
          select: {
            id: true,
            visitUid: true,
            createdAt: true
          }
        }
      },
      orderBy: { serviceDate: 'desc' }
    });

    // Calculate report totals
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const statusCounts = transactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    const report = {
      insurance: {
        id: insurance.id,
        name: insurance.name,
        code: insurance.code,
        contactInfo: insurance.contactInfo
      },
      reportPeriod: {
        startDate: startDate || 'All time',
        endDate: endDate || 'All time',
        generatedAt: new Date().toISOString()
      },
      summary: {
        totalTransactions: transactions.length,
        totalAmount,
        statusCounts
      },
      transactions: transactions.map(t => ({
        id: t.id,
        patientId: t.patient.id,
        patientName: t.patient.name,
        patientMobile: t.patient.mobile,
        visitUid: t.visit?.visitUid,
        serviceType: t.serviceType,
        serviceName: t.serviceName,
        serviceCode: t.serviceCode,
        medicationName: t.medicationName,
        quantity: t.quantity,
        unitPrice: t.unitPrice,
        totalAmount: t.totalAmount,
        status: t.status,
        claimNumber: t.claimNumber,
        transactionNumber: t.transactionNumber,
        serviceDate: t.serviceDate,
        claimDate: t.claimDate,
        collectedDate: t.collectedDate,
        notes: t.notes
      }))
    };

    res.json({ report });
  } catch (error) {
    console.error('Error generating insurance report:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get insurance dashboard statistics
exports.getInsuranceDashboardStats = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all transactions in the period
    const transactions = await prisma.insuranceTransaction.findMany({
      where: {
        serviceDate: {
          gte: startDate
        }
      },
      include: {
        insurance: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    // Calculate statistics
    const totalAmount = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;

    // Group by insurance company
    const insuranceStats = transactions.reduce((acc, t) => {
      const insuranceId = t.insurance.id;
      if (!acc[insuranceId]) {
        acc[insuranceId] = {
          insurance: t.insurance,
          totalAmount: 0,
          totalTransactions: 0,
          statusCounts: {}
        };
      }
      
      acc[insuranceId].totalAmount += t.totalAmount;
      acc[insuranceId].totalTransactions += 1;
      acc[insuranceId].statusCounts[t.status] = (acc[insuranceId].statusCounts[t.status] || 0) + 1;
      
      return acc;
    }, {});

    // Group by status
    const statusStats = transactions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      period,
      dateRange: {
        startDate,
        endDate: now
      },
      summary: {
        totalAmount,
        totalTransactions,
        statusStats
      },
      insuranceBreakdown: Object.values(insuranceStats)
    });
  } catch (error) {
    console.error('Error fetching insurance dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
};
