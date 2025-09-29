const express = require('express');
const billingController = require('../controllers/billingController');
const fileUpload = require('../middleware/fileUpload');

const router = express.Router();

router.post('/register', fileUpload.single('idDoc'), billingController.registerPatient);
router.post('/', billingController.createBilling);
router.get('/', billingController.getBillings);
router.get('/insurances', billingController.getInsurances);
router.post('/:billingId/services', billingController.addServiceToBilling);
router.post('/payments', billingController.processPayment);
router.get('/unpaid', billingController.getUnpaidBillings);
router.put('/emergency-id', billingController.updateEmergencyPatientId);

// Insurance billing
router.get('/insurance', billingController.getInsuranceBillings);
router.post('/insurance-payment', billingController.processInsurancePayment);

// Emergency billing
router.get('/emergency', billingController.getEmergencyBillings);
router.post('/emergency-payment', billingController.processEmergencyPayment);

module.exports = router;