const express = require('express');
const accountController = require('../controllers/accountController');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// Get all accounts (Admin and Billing Officers)
router.get('/', (req, res, next) => {
  console.log('===== ACCOUNTS ROUTE DEBUG =====');
  console.log('User:', req.user);
  console.log('User role:', req.user?.role);
  console.log('Allowed roles: ADMIN, BILLING_OFFICER');
  next();
}, roleGuard(['ADMIN', 'BILLING_OFFICER']), accountController.getAccounts);

// Get account by patient ID (All authenticated users)
router.get('/patient/:patientId', accountController.getAccountByPatientId);

// Create or update account (Admin only - auto-approved)
router.post('/', roleGuard(['ADMIN']), accountController.createAccount);

// Add deposit (Admin and Billing Officers)
router.post('/deposit', roleGuard(['ADMIN', 'BILLING_OFFICER']), accountController.addDeposit);

// Accept payment (Admin and Billing Officers)
router.post('/payment', roleGuard(['ADMIN', 'BILLING_OFFICER']), accountController.acceptPayment);

// Adjust balance (Admin only)
router.post('/adjust', roleGuard(['ADMIN']), accountController.adjustBalance);

// Verify account (Admin only)
router.post('/verify/:accountId', roleGuard(['ADMIN']), accountController.verifyAccount);

// Reject account (Admin only)
router.post('/reject/:accountId', roleGuard(['ADMIN']), accountController.rejectAccount);

// Account Requests (Deprecated - Admin creates accounts directly now)
// Create request (Admin only - for backward compatibility, but admin should use direct creation)
router.post('/requests', roleGuard(['ADMIN']), accountController.createAccountRequest);

// Get requests by status (Admin only)
router.get('/requests', roleGuard(['ADMIN']), accountController.getPendingRequests);

// Approve request (Admin only)
router.post('/requests/:requestId/approve', roleGuard(['ADMIN']), accountController.approveRequest);

// Reject request (Admin only)
router.post('/requests/:requestId/reject', roleGuard(['ADMIN']), accountController.rejectRequest);

module.exports = router;

