const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// All staff can request loans
router.post('/request', authMiddleware, loanController.requestLoan);

// All staff can view their own loan requests
router.get('/my-requests', authMiddleware, loanController.getMyLoans);

// Admin: Get pending loan requests
router.get('/pending', authMiddleware, roleGuard(['ADMIN']), loanController.getPendingLoans);

// Admin: Approve/deny loan request
router.post('/review/:loanId', authMiddleware, roleGuard(['ADMIN']), loanController.reviewLoan);

// Billing: Get approved loans
router.get('/approved', authMiddleware, roleGuard(['BILLING']), loanController.getApprovedLoans);

// Billing: Disburse loan
router.post('/disburse/:loanId', authMiddleware, roleGuard(['BILLING']), loanController.disburseLoan);

// Admin: Get all loans with filters
router.get('/all', authMiddleware, roleGuard(['ADMIN']), loanController.getAllLoans);

module.exports = router;


