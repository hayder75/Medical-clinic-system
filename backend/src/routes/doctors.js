const express = require('express');
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

router.get('/queue', doctorController.getQueue);
router.get('/results-queue', doctorController.getResultsQueue);
router.get('/unified-queue', doctorController.getUnifiedQueue);
router.get('/queue-status', auth, roleGuard(['ADMIN', 'NURSE', 'BILLING_OFFICER', 'RECEPTIONIST']), doctorController.getDoctorsQueueStatus);
router.get('/patient-assignments', auth, roleGuard(['ADMIN', 'NURSE', 'BILLING_OFFICER', 'RECEPTIONIST']), doctorController.getPatientAssignments);
router.get('/visits/:visitId', doctorController.getVisitDetails);
router.get('/visits/:visitId/medication-check', doctorController.checkMedicationOrdering);
router.get('/patient-history/:patientId', doctorController.getPatientHistory);
router.get('/vitals/:visitId', doctorController.getPatientVitals);
router.get('/order-status/:visitId', doctorController.getVisitOrderStatus);
router.get('/investigation-types', doctorController.getInvestigationTypes);
router.get('/services', doctorController.getAllServices);
router.post('/select', doctorController.selectVisit);
router.put('/visits/:visitId', doctorController.updateVisit);
router.post('/lab-orders', doctorController.createLabOrder);
router.post('/lab-orders/multiple', doctorController.createMultipleLabOrders);
router.post('/radiology-orders', doctorController.createRadiologyOrder);
router.post('/radiology-orders/multiple', doctorController.createMultipleRadiologyOrders);
router.post('/service-orders', doctorController.createDoctorServiceOrder);
router.post('/medication-orders', doctorController.createMedicationOrder);
router.post('/prescriptions/batch', doctorController.createBatchPrescription);
router.get('/prescriptions/:visitId', doctorController.getPrescriptionHistory);
router.post('/visits/:visitId/diagnosis-notes', doctorController.saveDiagnosisNotes);
router.get('/visits/:visitId/diagnosis-notes', doctorController.getDiagnosisNotes);
router.post('/complete', doctorController.completeVisit);
router.post('/direct-complete', doctorController.directCompleteVisit);

module.exports = router;