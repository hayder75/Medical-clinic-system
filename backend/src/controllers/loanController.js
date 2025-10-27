const prisma = require('../config/database');

// Staff requests a loan
exports.requestLoan = async (req, res) => {
  try {
    const { amount, reason } = req.body;
    const staffId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const loan = await prisma.loan.create({
      data: {
        staffId,
        requestedAmount: amount,
        reason: reason || null,
        status: 'PENDING'
      },
      include: {
        staff: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Loan request submitted successfully',
      loan
    });
  } catch (error) {
    console.error('Error requesting loan:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get staff's own loan requests
exports.getMyLoans = async (req, res) => {
  try {
    const staffId = req.user.id;

    const loans = await prisma.loan.findMany({
      where: { staffId },
      include: {
        reviewedBy: {
          select: {
            id: true,
            fullname: true
          }
        },
        givenBy: {
          select: {
            id: true,
            fullname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ loans });
  } catch (error) {
    console.error('Error fetching loans:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Get all pending loan requests
exports.getPendingLoans = async (req, res) => {
  try {
    const pendingLoans = await prisma.loan.findMany({
      where: { status: 'PENDING' },
      include: {
        staff: {
          select: {
            id: true,
            fullname: true,
            role: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ pendingLoans });
  } catch (error) {
    console.error('Error fetching pending loans:', error);
    res.status(500).json({ error: error.message });
  }
};

// Admin: Approve or deny loan request
exports.reviewLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const { action, approvedAmount, notes } = req.body;
    const adminId = req.user.id;

    if (!['approve', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "deny"' });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan request not found' });
    }

    if (loan.status !== 'PENDING') {
      return res.status(400).json({ error: 'Loan has already been reviewed' });
    }

    if (action === 'approve') {
      // If approvedAmount is provided, use it; otherwise use requested amount
      const finalAmount = approvedAmount || loan.requestedAmount;

      const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'APPROVED',
          approvedAmount: finalAmount,
          reviewedAt: new Date(),
          approvedAt: new Date(),
          reviewedById: adminId,
          notes: notes || null
        },
        include: {
          staff: {
            select: {
              id: true,
              fullname: true,
              role: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              fullname: true
            }
          }
        }
      });

      res.json({
        message: 'Loan approved successfully',
        loan: updatedLoan
      });
    } else {
      // Deny
      const updatedLoan = await prisma.loan.update({
        where: { id: loanId },
        data: {
          status: 'DENIED',
          reviewedAt: new Date(),
          deniedAt: new Date(),
          reviewedById: adminId,
          notes: notes || null
        },
        include: {
          staff: {
            select: {
              id: true,
              fullname: true,
              role: true
            }
          }
        }
      });

      res.json({
        message: 'Loan denied',
        loan: updatedLoan
      });
    }
  } catch (error) {
    console.error('Error reviewing loan:', error);
    res.status(500).json({ error: error.message });
  }
};

// Billing: Get all approved loans awaiting disbursement
exports.getApprovedLoans = async (req, res) => {
  try {
    const approvedLoans = await prisma.loan.findMany({
      where: { status: 'APPROVED' },
      include: {
        staff: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            fullname: true
          }
        }
      },
      orderBy: { approvedAt: 'desc' }
    });

    res.json({ approvedLoans });
  } catch (error) {
    console.error('Error fetching approved loans:', error);
    res.status(500).json({ error: error.message });
  }
};

// Billing: Disburse loan (mark as given and record as expense)
exports.disburseLoan = async (req, res) => {
  try {
    const { loanId } = req.params;
    const billingId = req.user.id;

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        staff: true
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    if (loan.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only approved loans can be disbursed' });
    }

    // Get today's active cash session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let cashSession = await prisma.dailyCashSession.findFirst({
      where: {
        sessionDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'ACTIVE'
      }
    });

    if (!cashSession) {
      return res.status(404).json({ error: 'No active cash session found for today' });
    }

    // Create expense record
    const expense = await prisma.cashExpense.create({
      data: {
        sessionId: cashSession.id,
        amount: loan.approvedAmount,
        category: 'STAFF_LOAN',
        description: `Staff loan to ${loan.staff.fullname}`,
        recordedById: billingId
      }
    });

    // Update loan status
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'GIVEN',
        givenAt: new Date(),
        givenById: billingId,
        expenseId: expense.id
      },
      include: {
        staff: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        },
        expense: {
          select: {
            id: true,
            amount: true,
            createdAt: true
          }
        }
      }
    });

    res.json({
      message: 'Loan disbursed successfully and recorded as expense',
      loan: updatedLoan
    });
  } catch (error) {
    console.error('Error disbursing loan:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all loans with filters (for admin overview)
exports.getAllLoans = async (req, res) => {
  try {
    const { status, staffId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (staffId) where.staffId = staffId;

    const loans = await prisma.loan.findMany({
      where,
      include: {
        staff: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            fullname: true
          }
        },
        givenBy: {
          select: {
            id: true,
            fullname: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ loans });
  } catch (error) {
    console.error('Error fetching all loans:', error);
    res.status(500).json({ error: error.message });
  }
};

