const prisma = require('../config/database');
const { z } = require('zod');

// Validation schemas
const createAccountSchema = z.object({
  patientId: z.string(),
  accountType: z.enum(['ADVANCE', 'CREDIT', 'NONE']),
  initialDeposit: z.number().optional()
});

const depositSchema = z.object({
  accountId: z.string(),
  patientId: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'BANK', 'INSURANCE']),
  bankName: z.string().optional(),
  transNumber: z.string().optional(),
  notes: z.string().optional()
});

const adjustBalanceSchema = z.object({
  accountId: z.string(),
  patientId: z.string(),
  amount: z.number(),
  reason: z.string()
});

// Get all patient accounts with filters
exports.getAccounts = async (req, res) => {
  try {
    console.log('getAccounts called with query:', req.query);
    const { type, search } = req.query;
    
    let whereClause = {};
    
    // Filter by account type
    if (type && type !== 'ALL') {
      whereClause.accountType = type;
    }
    
    // Search by patient name
    if (search) {
      whereClause.patient = {
        name: {
          contains: search,
          mode: 'insensitive'
        }
      };
    }
    
    console.log('Querying with whereClause:', JSON.stringify(whereClause));
    const accounts = await prisma.patientAccount.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true
          }
        },
        verifiedBy: {
          select: {
            fullname: true,
            username: true
          }
        },
        deposits: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            depositedBy: {
              select: {
                fullname: true,
                username: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    
    res.json({ accounts });
  } catch (error) {
    console.error('Error in getAccounts:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get patient account details
exports.getAccountByPatientId = async (req, res) => {
  try {
    const { patientId } = req.params;
    
    let account = await prisma.patientAccount.findUnique({
      where: { patientId },
      include: {
        patient: true,
        deposits: {
          orderBy: { createdAt: 'desc' },
          include: {
            depositedBy: {
              select: {
                fullname: true,
                username: true
              }
            }
          }
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            billing: {
              select: {
                id: true,
                totalAmount: true,
                status: true
              }
            },
            visit: {
              select: {
                id: true,
                visitUid: true
              }
            }
          }
        }
      }
    });
    
    // If no account exists, return null (not an error)
    if (!account) {
      return res.json({ account: null, balance: 0 });
    }
    
    // For billing usage, only return verified accounts
    if (account.status !== 'VERIFIED') {
      return res.json({ account: null, balance: 0, message: 'Account pending verification' });
    }
    
    res.json({ account, balance: account.balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create or update patient account
exports.createAccount = async (req, res) => {
  try {
    const data = createAccountSchema.parse(req.body);
    
    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    // Check if account already exists
    let account = await prisma.patientAccount.findUnique({
      where: { patientId: data.patientId }
    });
    
    if (account) {
      // Update existing account
      account = await prisma.patientAccount.update({
        where: { patientId: data.patientId },
        data: {
          accountType: data.accountType
        },
        include: { patient: true }
      });
    } else {
      // Create new account
      account = await prisma.patientAccount.create({
        data: {
          patientId: data.patientId,
          accountType: data.accountType,
          balance: data.initialDeposit || 0,
          totalDeposited: data.initialDeposit || 0
        },
        include: { patient: true }
      });
      
      // If initial deposit provided, create deposit record
      if (data.initialDeposit && data.initialDeposit > 0) {
        await prisma.accountDeposit.create({
          data: {
            accountId: account.id,
            patientId: data.patientId,
            amount: data.initialDeposit,
            paymentMethod: 'CASH',
            depositedById: req.user.id,
            notes: 'Initial deposit'
          }
        });
      }
    }
    
    res.json({
      message: 'Account updated successfully',
      account
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Add deposit to account
exports.addDeposit = async (req, res) => {
  try {
    const data = depositSchema.parse(req.body);
    
    // Get account
    const account = await prisma.patientAccount.findUnique({
      where: { id: data.accountId },
      include: { patient: true }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    if (account.patientId !== data.patientId) {
      return res.status(400).json({ error: 'Patient ID mismatch' });
    }
    
    // For CREDIT: Just increase balance (not real money deposit)
    if (account.accountType === 'CREDIT') {
      const updatedAccount = await prisma.patientAccount.update({
        where: { id: data.accountId },
        data: {
          balance: { increment: data.amount }
        },
        include: { patient: true }
      });
      
      await prisma.accountTransaction.create({
        data: {
          accountId: data.accountId,
          patientId: data.patientId,
          type: 'ADJUSTMENT',
          amount: data.amount,
          balanceBefore: account.balance,
          balanceAfter: updatedAccount.balance,
          notes: data.notes || 'Credit limit increased',
          processedById: req.user.id
        }
      });
      
      return res.json({
        message: 'Credit limit increased',
        account: updatedAccount
      });
    }
    
    // For ADVANCE: Create deposit (real money)
    await prisma.accountDeposit.create({
      data: {
        accountId: data.accountId,
        patientId: data.patientId,
        amount: data.amount,
          paymentMethod: data.paymentMethod,
        bankName: data.bankName,
        transNumber: data.transNumber,
        notes: data.notes,
        depositedById: req.user.id
      }
    });
    
    // Update account balance
    const updatedAccount = await prisma.patientAccount.update({
      where: { id: data.accountId },
      data: {
        balance: {
          increment: data.amount
        },
        totalDeposited: {
          increment: data.amount
        }
      },
      include: { patient: true }
    });
    
    // Create transaction log
    await prisma.accountTransaction.create({
      data: {
        accountId: data.accountId,
        patientId: data.patientId,
        type: 'DEPOSIT',
        amount: data.amount,
        balanceBefore: account.balance,
        balanceAfter: updatedAccount.balance,
        notes: data.notes || 'Deposit added',
        processedById: req.user.id
      }
    });
    
    res.json({
      message: 'Deposit added successfully',
      account: updatedAccount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Accept payment (for credit accounts)
exports.acceptPayment = async (req, res) => {
  try {
    const data = depositSchema.parse(req.body);
    
    const account = await prisma.patientAccount.findUnique({
      where: { id: data.accountId },
      include: { patient: true }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Create payment deposit
    await prisma.accountDeposit.create({
      data: {
        accountId: data.accountId,
        patientId: data.patientId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        bankName: data.bankName,
        transNumber: data.transNumber,
        notes: data.notes,
        depositedById: req.user.id
      }
    });
    
    // For CREDIT accounts, reduce debt instead of increasing balance
    if (account.accountType === 'CREDIT') {
      // Reduce debt owed
      const newDebt = Math.max(0, account.debtOwed - data.amount);
      const debtPaid = account.debtOwed > data.amount ? data.amount : account.debtOwed;
      
      const updatedAccount = await prisma.patientAccount.update({
        where: { id: data.accountId },
        data: {
          debtOwed: newDebt,
          totalDebtPaid: {
            increment: debtPaid
          }
        },
        include: { patient: true }
      });
      
      // Update transaction to reflect debt change
      await prisma.accountTransaction.create({
        data: {
          accountId: data.accountId,
          patientId: data.patientId,
          type: 'PAYMENT',
          amount: data.amount,
          balanceBefore: account.debtOwed,
          balanceAfter: newDebt,
          notes: data.notes || 'Payment returned to clear debt',
          processedById: req.user.id
        }
      });
      
      // Add to daily cash - CREDIT payments count as real money received
      // This will appear in Daily Cash Management
      const activeSession = await prisma.dailyCashSession.findFirst({
        where: {
          status: 'ACTIVE',
          createdById: req.user.id
        }
      });
      
      if (activeSession) {
        await prisma.cashTransaction.create({
          data: {
            sessionId: activeSession.id,
            type: 'PAYMENT_RECEIVED',
            amount: debtPaid,
            description: `Credit payment from ${updatedAccount.patient.name} - Debt clearance`,
            paymentMethod: data.paymentMethod || 'CASH',
            processedById: req.user.id
          }
        });
      }
      
      return res.json({
        message: 'Payment returned successfully, debt reduced',
        account: updatedAccount
      });
    } else {
      // For ADVANCE accounts, add to balance
      const updatedAccount = await prisma.patientAccount.update({
        where: { id: data.accountId },
        data: {
          balance: {
            increment: data.amount
          }
        },
        include: { patient: true }
      });
    }
    
    // Create transaction log
    await prisma.accountTransaction.create({
      data: {
        accountId: data.accountId,
        patientId: data.patientId,
        type: 'PAYMENT',
        amount: data.amount,
        balanceBefore: account.balance,
        balanceAfter: updatedAccount.balance,
        notes: data.notes || 'Payment received',
        processedById: req.user.id
      }
    });
    
    res.json({
      message: 'Payment accepted successfully',
      account: updatedAccount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Adjust balance (admin only)
exports.adjustBalance = async (req, res) => {
  try {
    const data = adjustBalanceSchema.parse(req.body);
    
    const account = await prisma.patientAccount.findUnique({
      where: { id: data.accountId }
    });
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    // Update balance
    const updatedAccount = await prisma.patientAccount.update({
      where: { id: data.accountId },
      data: {
        balance: data.amount
      },
      include: { patient: true }
    });
    
    // Create transaction log
    await prisma.accountTransaction.create({
      data: {
        accountId: data.accountId,
        patientId: account.patientId,
        type: 'ADJUSTMENT',
        amount: data.amount - account.balance,
        balanceBefore: account.balance,
        balanceAfter: data.amount,
        notes: data.reason,
        processedById: req.user.id
      }
    });
    
    res.json({
      message: 'Balance adjusted successfully',
      account: updatedAccount
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Verify an account request (admin only)
exports.verifyAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    const account = await prisma.patientAccount.findUnique({
      where: { id: accountId },
      include: { patient: true }
    });
    
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    if (account.status === 'VERIFIED') {
      return res.status(400).json({ error: 'Account already verified' });
    }
    
    const updatedAccount = await prisma.patientAccount.update({
      where: { id: accountId },
      data: {
        status: 'VERIFIED',
        verifiedById: req.user.id,
        verifiedAt: new Date()
      },
      include: { patient: true }
    });
    
    res.json({
      message: 'Account verified successfully',
      account: updatedAccount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject an account request (admin only)
exports.rejectAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const { reason } = req.body;
    
    const account = await prisma.patientAccount.findUnique({
      where: { id: accountId },
      include: { patient: true }
    });
    
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    const updatedAccount = await prisma.patientAccount.update({
      where: { id: accountId },
      data: {
        status: 'REJECTED',
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: reason || 'Rejected by administrator'
      },
      include: { patient: true }
    });
    
    res.json({
      message: 'Account rejected',
      account: updatedAccount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== ACCOUNT REQUEST MANAGEMENT =====

// Create an account request (billing creates)
exports.createAccountRequest = async (req, res) => {
  try {
    const { accountId, patientId, requestType, accountType, amount, paymentMethod, bankName, transNumber, notes } = req.body;
    
    // Validation
    if (!patientId || !requestType) {
      return res.status(400).json({ error: 'Patient ID and request type are required' });
    }
    
    // For add credit/deposit/return money, accountId is required
    if (requestType !== 'CREATE_ACCOUNT' && !accountId) {
      return res.status(400).json({ error: 'Account ID is required for this request type' });
    }
    
    // For create account, accountType is required
    if (requestType === 'CREATE_ACCOUNT' && !accountType) {
      return res.status(400).json({ error: 'Account type is required when creating new account' });
    }
    
    // For add requests, amount is required
    if (['ADD_CREDIT', 'ADD_DEPOSIT', 'RETURN_MONEY'].includes(requestType) && !amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }
    
    const request = await prisma.accountRequest.create({
      data: {
        accountId,
        patientId,
        requestType,
        accountType,
        amount,
        paymentMethod,
        bankName,
        transNumber,
        notes,
        requestedById: req.user.id,
        status: 'PENDING'
      },
      include: {
        patient: true,
        requestedBy: {
          select: {
            fullname: true,
            username: true
          }
        }
      }
    });
    
    res.json({
      message: 'Account request created successfully',
      request
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all requests by status (admin view)
exports.getPendingRequests = async (req, res) => {
  try {
    const status = req.query.status || 'PENDING';
    const requests = await prisma.accountRequest.findMany({
      where: {
        status: status
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            mobile: true,
            email: true
          }
        },
        account: true,
        requestedBy: {
          select: {
            fullname: true,
            username: true
          }
        },
        verifiedBy: {
          select: {
            fullname: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve request (admin only)
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await prisma.accountRequest.findUnique({
      where: { id: requestId },
      include: {
        patient: true,
        account: true
      }
    });
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request already processed' });
    
    // Process based on request type
    if (request.requestType === 'CREATE_ACCOUNT') {
      // Create the account
      const account = await prisma.patientAccount.create({
        data: {
          patientId: request.patientId,
          accountType: request.accountType,
          balance: request.amount || 0,
          status: 'VERIFIED',
          verifiedById: req.user.id,
          verifiedAt: new Date()
        },
        include: { patient: true }
      });
      
      // Update request
      await prisma.accountRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          verifiedById: req.user.id,
          verifiedAt: new Date(),
          accountId: account.id
        }
      });
      
      res.json({ message: 'Account created successfully', account });
      
    } else if (request.requestType === 'ADD_CREDIT') {
      // Add credit to existing account
      await prisma.patientAccount.update({
        where: { id: request.accountId },
        data: { balance: { increment: request.amount } }
      });
      
      await prisma.accountRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          verifiedById: req.user.id,
          verifiedAt: new Date()
        }
      });
      
      res.json({ message: 'Credit added successfully' });
      
    } else if (request.requestType === 'ADD_DEPOSIT') {
      // Add deposit to advance account
      const account = await prisma.patientAccount.findUnique({
        where: { id: request.accountId }
      });
      
      await prisma.patientAccount.update({
        where: { id: request.accountId },
        data: {
          balance: { increment: request.amount },
          totalDeposited: { increment: request.amount }
        }
      });
      
      // Create deposit record
      await prisma.accountDeposit.create({
        data: {
          accountId: request.accountId,
          patientId: request.patientId,
          amount: request.amount,
          paymentMethod: request.paymentMethod,
          bankName: request.bankName,
          transNumber: request.transNumber,
          notes: request.notes,
          depositedById: req.user.id
        }
      });
      
      await prisma.accountRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          verifiedById: req.user.id,
          verifiedAt: new Date()
        }
      });
      
      res.json({ message: 'Deposit added successfully' });
      
    } else if (request.requestType === 'RETURN_MONEY') {
      // Return money to clear debt
      await prisma.patientAccount.update({
        where: { id: request.accountId },
        data: {
          debtOwed: { decrement: request.amount },
          totalDebtPaid: { increment: request.amount }
        }
      });
      
      await prisma.accountRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          verifiedById: req.user.id,
          verifiedAt: new Date()
        }
      });
      
      res.json({ message: 'Money returned successfully' });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject request (admin only)
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { reason } = req.body;
    
    const request = await prisma.accountRequest.findUnique({
      where: { id: requestId }
    });
    
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'PENDING') return res.status(400).json({ error: 'Request already processed' });
    
    await prisma.accountRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        verifiedById: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: reason || 'Rejected by administrator'
      }
    });
    
    res.json({ message: 'Request rejected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


