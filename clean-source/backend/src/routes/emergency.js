const express = require('express');
const router = express.Router();
const emergencyController = require('../controllers/emergencyController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Emergency service management routes
router.post('/services/add', roleGuard(['DOCTOR', 'NURSE', 'BILLING_OFFICER']), emergencyController.addEmergencyService);
router.get('/billing/:visitId', roleGuard(['DOCTOR', 'NURSE', 'BILLING_OFFICER', 'ADMIN']), emergencyController.getEmergencyBilling);
router.post('/payment/acknowledge', roleGuard(['BILLING_OFFICER', 'ADMIN']), emergencyController.acknowledgeEmergencyPayment);
router.get('/patients', roleGuard(['BILLING_OFFICER', 'ADMIN']), emergencyController.getEmergencyPatients);
router.get('/stats', roleGuard(['BILLING_OFFICER', 'ADMIN']), emergencyController.getEmergencyStats);

module.exports = router;



