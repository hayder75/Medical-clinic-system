const express = require('express');
const dentalController = require('../controllers/dentalController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// Get all dentists (available to nurses and admins)
router.get('/dentists', authMiddleware, roleGuard(['NURSE', 'ADMIN']), dentalController.getDentists);

// Get dental record for a patient (available to doctors and admins)
router.get('/records/:patientId/:visitId?', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), dentalController.getDentalRecord);

// Save dental record (available to doctors and admins)
router.post('/records', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), dentalController.saveDentalRecord);

// Get dental history for a patient (available to doctors and admins)
router.get('/history/:patientId', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), dentalController.getDentalHistory);

// Get tooth information (available to doctors and admins)
router.get('/tooth/:toothNumber', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), dentalController.getToothInfo);

// Create dental lab/radiology order (available to doctors and admins)
router.post('/orders', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), dentalController.createDentalOrder);

module.exports = router;
