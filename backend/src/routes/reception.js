const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Auth middleware for all routes
router.use(authMiddleware);

// Patient management - Reception, billing, admin, and nurses
router.get('/patients', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN', 'NURSE']), receptionController.getPatients);
router.get('/patients/:patientId/history', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN', 'NURSE']), receptionController.getPatientHistory);
router.post('/patients', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN']), receptionController.createPatient);
router.put('/patients/:patientId', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN']), receptionController.updatePatient);

// Card management - Reception, billing, and admin
router.post('/activate-card', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN']), receptionController.activateCard);
// Note: Manual deactivation removed - cards now deactivate automatically based on expiry date

// Visit management - Reception, billing, and admin
router.post('/visits', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN']), receptionController.createVisit);

// Utilities - Reception, billing, admin, and nurses
router.get('/doctors', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN', 'NURSE']), receptionController.getDoctors);
router.get('/card-services', roleGuard(['RECEPTIONIST', 'BILLING_OFFICER', 'ADMIN', 'NURSE']), receptionController.getCardServices);

module.exports = router;

