const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Auth middleware for all routes
router.use(authMiddleware);

// Patient management - View only for nurses
router.get('/patients', roleGuard(['RECEPTIONIST', 'ADMIN', 'NURSE']), receptionController.getPatients);
router.get('/patients/:patientId/history', roleGuard(['RECEPTIONIST', 'ADMIN', 'NURSE']), receptionController.getPatientHistory);
router.post('/patients', roleGuard(['RECEPTIONIST', 'ADMIN']), receptionController.createPatient);

// Card management - Only reception and admin
router.post('/activate-card', roleGuard(['RECEPTIONIST', 'ADMIN']), receptionController.activateCard);
router.post('/patients/:patientId/deactivate-card', roleGuard(['RECEPTIONIST', 'ADMIN']), receptionController.deactivateCard);

// Visit management - Only reception and admin
router.post('/visits', roleGuard(['RECEPTIONIST', 'ADMIN']), receptionController.createVisit);

// Utilities - View only for nurses
router.get('/doctors', roleGuard(['RECEPTIONIST', 'ADMIN', 'NURSE']), receptionController.getDoctors);
router.get('/card-services', roleGuard(['RECEPTIONIST', 'ADMIN', 'NURSE']), receptionController.getCardServices);

module.exports = router;

