const express = require('express');
const billingController = require('../controllers/billingController');
const fileUpload = require('../middleware/fileUpload');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Patient registration and visit management (Billing Officers, Receptionists, Admin)
router.post('/register', fileUpload.single('idDoc'), roleGuard(['BILLING_OFFICER', 'RECEPTIONIST', 'ADMIN']), billingController.registerPatient);
router.post('/create-visit', roleGuard(['BILLING_OFFICER', 'RECEPTIONIST', 'ADMIN']), billingController.createVisitForExistingPatient);
router.delete('/visit/:visitId', roleGuard(['BILLING_OFFICER', 'RECEPTIONIST', 'ADMIN']), billingController.deleteVisit);
router.get('/check-visit-status/:patientId', roleGuard(['BILLING_OFFICER', 'RECEPTIONIST', 'ADMIN']), billingController.checkPatientVisitStatus);

// Billing operations (Billing Officers, Admin)
router.post('/', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.createBilling);
router.get('/', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.getBillings);
router.delete('/:billingId', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.deleteBilling);
router.get('/dashboard-stats', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.getBillingDashboardStats);
router.get('/insurances', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.getInsurances);
router.post('/:billingId/services', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.addServiceToBilling);
router.post('/payments', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.processPayment);
router.get('/unpaid', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.getUnpaidBillings);
router.put('/emergency-id', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.updateEmergencyPatientId);

// Insurance billing (Billing Officers, Admin)
router.get('/insurance', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.getInsuranceBillings);
router.post('/insurance-payment', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.processInsurancePayment);

// Emergency billing (Billing Officers, Admin)
router.get('/emergency', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.getEmergencyBillings);
router.post('/emergency-payment', roleGuard(['BILLING_OFFICER', 'ADMIN']), billingController.processEmergencyPayment);

module.exports = router;