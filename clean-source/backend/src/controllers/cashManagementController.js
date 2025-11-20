const { PrismaClient } = require('@prisma/client');
const z = require('zod');

const prisma = new PrismaClient();

// Validation schemas
const createSessionSchema = z.object({
  startingCash: z.number().min(0).default(0)
});

const addTransactionSchema = z.object({
  type: z.enum(['PAYMENT_RECEIVED', 'REFUND_GIVEN', 'CASH_ADJUSTMENT', 'OTHER']),
  amount: z.number().positive(),
  description: z.string().min(1),
  paymentMethod: z.enum(['CASH', 'BANK', 'INSURANCE', 'CHARITY']),
  billingId: z.string().optional(),
  patientId: z.string().optional()
});

const addBankDepositSchema = z.object({
  amount: z.number().positive(),
  bankName: z.string().min(1),
  accountNumber: z.string().optional(),
  transactionNumber: z.string().optional(),
  notes: z.string().optional()
});

const addExpenseSchema = z.object({
  amount: z.number().positive(),
  category: z.enum(['OFFICE_SUPPLIES', 'MEDICAL_SUPPLIES', 'MAINTENANCE', 'UTILITIES', 'FOOD_BEVERAGE', 'TRANSPORTATION', 'OTHER']),
  description: z.string().min(1),
  vendor: z.string().optional()
});

const resetSessionSchema = z.object({
  sessionId: z.string(),
  endingCash: z.number().min(0)
});

// Get current active session or create new one
exports.getCurrentSession = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if there's an active session for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let session = await prisma.dailyCashSession.findFirst({
      where: {
        createdById: userId,
        sessionDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      },
      include: {
        transactions: {
          include: {
            patient: true,
            billing: true
          },
          orderBy: { createdAt: 'desc' }
        },
        bankDeposits: {
          orderBy: { createdAt: 'desc' }
        },
        expenses: {
          orderBy: { createdAt: 'desc' }
        },
        createdBy: {
          select: { fullname: true, username: true }
        }
      }
    });
    
    // If no active session exists, create one
    if (!session) {
      session = await prisma.dailyCashSession.create({
        data: {
          createdById: userId,
          startingCash: 0,
          sessionDate: new Date()
        },
        include: {
          transactions: {
            include: {
              patient: true,
              billing: true
            },
            orderBy: { createdAt: 'desc' }
          },
          bankDeposits: {
            orderBy: { createdAt: 'desc' }
          },
          expenses: {
            orderBy: { createdAt: 'desc' }
          },
          createdBy: {
            select: { fullname: true, username: true }
          }
        }
      });
    }
    
    // Calculate current totals
    // Get ALL cash transactions from today (all users) for clinic-wide totals
    const allTodayTransactions = await prisma.cashTransaction.findMany({
      where: {
        type: 'PAYMENT_RECEIVED',
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    const totalReceived = allTodayTransactions
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Also calculate total from current user's session (for user-specific view)
    const sessionTotalReceived = session.transactions
      .filter(t => t.type === 'PAYMENT_RECEIVED')
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Get total from today's Account Deposits (advance payments only)
    // Note: INSURANCE and CHARITY payments are NOT counted - they have their own tracking pages
    // Note: CREDIT deposits are NOT counted - they're debt clearance, not new money received
    const todayForAccounts = new Date();
    todayForAccounts.setHours(0, 0, 0, 0);
    const tomorrowForAccounts = new Date(todayForAccounts);
    tomorrowForAccounts.setDate(tomorrowForAccounts.getDate() + 1);
    
    const todayAccountDeposits = await prisma.accountDeposit.findMany({
      where: {
        createdAt: {
          gte: todayForAccounts,
          lt: tomorrowForAccounts
        }
      },
      include: {
        account: true
      }
    });
    
    // Only count ADVANCE account deposits in daily cash (money received)
    // CREDIT deposits are debt payments, not new money received, so not counted
    const totalFromAccounts = todayAccountDeposits
      .filter(d => d.account.accountType === 'ADVANCE')
      .reduce((sum, d) => sum + d.amount, 0);
    
    // Total received = CashTransaction records (CASH/BANK payments) + ADVANCE account deposits
    // INSURANCE and CHARITY payments are excluded (tracked separately)
    const totalReceivedAll = totalReceived + totalFromAccounts;
    
    const totalExpenses = session.expenses
      .reduce((sum, e) => sum + e.amount, 0);
    
    const totalBankDeposit = session.bankDeposits
      .reduce((sum, d) => sum + d.amount, 0);
    
    const currentCash = session.startingCash + totalReceivedAll - totalExpenses - totalBankDeposit;
    
    res.json({
      session: {
        ...session,
        calculatedTotals: {
          totalReceived: totalReceivedAll,
          totalExpenses,
          totalBankDeposit,
          currentCash
        }
      }
    });
  } catch (error) {
    console.error('Error getting current session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Add a cash transaction
exports.addTransaction = async (req, res) => {
  try {
    const validatedData = addTransactionSchema.parse(req.body);
    const userId = req.user.id;
    
    // Get current session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let session = await prisma.dailyCashSession.findFirst({
      where: {
        createdById: userId,
        sessionDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'No active cash session found' });
    }
    
    // Create transaction
    const transaction = await prisma.cashTransaction.create({
      data: {
        sessionId: session.id,
        processedById: userId,
        ...validatedData
      },
      include: {
        patient: true,
        billing: true,
        processedBy: {
          select: { fullname: true, username: true }
        }
      }
    });
    
    res.json({
      message: 'Transaction added successfully',
      transaction
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Add bank deposit
exports.addBankDeposit = async (req, res) => {
  try {
    const validatedData = addBankDepositSchema.parse(req.body);
    const userId = req.user.id;
    
    // Get current session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let session = await prisma.dailyCashSession.findFirst({
      where: {
        createdById: userId,
        sessionDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'No active cash session found' });
    }
    
    // Create bank deposit
    const deposit = await prisma.bankDeposit.create({
      data: {
        sessionId: session.id,
        depositedById: userId,
        ...validatedData
      },
      include: {
        depositedBy: {
          select: { fullname: true, username: true }
        }
      }
    });
    
    res.json({
      message: 'Bank deposit recorded successfully',
      deposit
    });
  } catch (error) {
    console.error('Error adding bank deposit:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Add expense
exports.addExpense = async (req, res) => {
  try {
    const validatedData = addExpenseSchema.parse(req.body);
    const userId = req.user.id;
    
    // Get current session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let session = await prisma.dailyCashSession.findFirst({
      where: {
        createdById: userId,
        sessionDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'No active cash session found' });
    }
    
    // Create expense
    const expense = await prisma.cashExpense.create({
      data: {
        sessionId: session.id,
        recordedById: userId,
        ...validatedData
      },
      include: {
        recordedBy: {
          select: { fullname: true, username: true }
        }
      }
    });
    
    res.json({
      message: 'Expense recorded successfully',
      expense
    });
  } catch (error) {
    console.error('Error adding expense:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Reset daily session (Admin only)
exports.resetSession = async (req, res) => {
  try {
    const validatedData = resetSessionSchema.parse(req.body);
    const userId = req.user.id;
    
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only administrators can reset cash sessions' });
    }
    
    // Get the session
    const session = await prisma.dailyCashSession.findUnique({
      where: { id: validatedData.sessionId }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.isReset) {
      return res.status(400).json({ error: 'Session has already been reset' });
    }
    
    // Update session
    const updatedSession = await prisma.dailyCashSession.update({
      where: { id: validatedData.sessionId },
      data: {
        status: 'RESET',
        endingCash: validatedData.endingCash,
        endTime: new Date(),
        isReset: true,
        resetById: userId,
        resetAt: new Date()
      },
      include: {
        resetBy: {
          select: { fullname: true, username: true }
        }
      }
    });
    
    res.json({
      message: 'Session reset successfully',
      session: updatedSession
    });
  } catch (error) {
    console.error('Error resetting session:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.errors 
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get session history
exports.getSessionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const userId = req.user.id;
    
    const where = {
      createdById: userId
    };
    
    if (startDate && endDate) {
      where.sessionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const sessions = await prisma.dailyCashSession.findMany({
      where,
      include: {
        transactions: {
          include: {
            patient: true,
            billing: true
          }
        },
        bankDeposits: true,
        expenses: true,
        createdBy: {
          select: { fullname: true, username: true }
        },
        resetBy: {
          select: { fullname: true, username: true }
        }
      },
      orderBy: { sessionDate: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit)
    });
    
    const total = await prisma.dailyCashSession.count({ where });
    
    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting session history:', error);
    res.status(500).json({ error: error.message });
  }
};

// Upload receipt for bank deposit or expense
exports.uploadReceipt = async (req, res) => {
  try {
    const { type, id } = req.params; // type: 'deposit' or 'expense', id: record id
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = `/uploads/receipts/${req.file.filename}`;
    
    if (type === 'deposit') {
      // Update bank deposit with receipt
      const deposit = await prisma.bankDeposit.update({
        where: { 
          id: id,
          depositedById: userId // Ensure user owns this deposit
        },
        data: { receiptImage: filePath },
        include: {
          depositedBy: {
            select: { fullname: true, username: true }
          }
        }
      });
      
      res.json({
        message: 'Receipt uploaded successfully',
        deposit
      });
    } else if (type === 'expense') {
      // Update expense with receipt
      const expense = await prisma.cashExpense.update({
        where: { 
          id: id,
          recordedById: userId // Ensure user owns this expense
        },
        data: { receiptImage: filePath },
        include: {
          recordedBy: {
            select: { fullname: true, username: true }
          }
        }
      });
      
      res.json({
        message: 'Receipt uploaded successfully',
        expense
      });
    } else {
      return res.status(400).json({ error: 'Invalid type. Must be "deposit" or "expense"' });
    }
  } catch (error) {
    console.error('Error uploading receipt:', error);
    res.status(500).json({ error: error.message });
  }
};
