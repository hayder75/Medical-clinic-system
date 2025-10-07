const express = require('express');
const doctorController = require('../controllers/doctorController');

const router = express.Router();

router.get('/queue', doctorController.getQueue);
router.get('/results-queue', doctorController.getResultsQueue);
router.get('/patient-history/:patientId', doctorController.getPatientHistory);
router.get('/vitals/:visitId', doctorController.getPatientVitals);
router.get('/order-status/:visitId', doctorController.getVisitOrderStatus);
router.get('/investigation-types', doctorController.getInvestigationTypes);
router.post('/select', doctorController.selectVisit);
router.put('/visits/:visitId', doctorController.updateVisit);
router.post('/lab-orders', doctorController.createLabOrder);
router.post('/lab-orders/multiple', doctorController.createMultipleLabOrders);
router.post('/radiology-orders', doctorController.createRadiologyOrder);
router.post('/radiology-orders/multiple', doctorController.createMultipleRadiologyOrders);
router.post('/medication-orders', doctorController.createMedicationOrder);
router.post('/prescriptions/batch', doctorController.createBatchPrescription);
router.get('/prescriptions/:visitId', doctorController.getPrescriptionHistory);
router.post('/complete', doctorController.completeVisit);

module.exports = router;