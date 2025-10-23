const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/receptionController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// All routes require RECEPTIONIST or ADMIN role
router.use(authMiddleware);
router.use(roleGuard(['RECEPTIONIST', 'ADMIN']));

// Patient management
router.get('/patients', receptionController.getPatients);
router.get('/patients/:patientId/history', receptionController.getPatientHistory);
router.post('/patients', receptionController.createPatient);

// Card management
router.post('/activate-card', receptionController.activateCard);
router.post('/patients/:patientId/deactivate-card', receptionController.deactivateCard);

// Visit management
router.post('/visits', receptionController.createVisit);

// Utilities
router.get('/doctors', receptionController.getDoctors);
router.get('/card-services', receptionController.getCardServices);

module.exports = router;

