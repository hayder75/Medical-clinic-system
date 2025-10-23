const express = require('express');
const router = express.Router();
const medicalCertificateController = require('../controllers/medicalCertificateController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Create a new medical certificate
router.post('/', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.createCertificate);

// Get all medical certificates with search and pagination
router.get('/', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.getCertificates);

// Search patients for certificate creation
router.get('/search-patients', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.searchPatients);

// Get a specific medical certificate
router.get('/:id', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.getCertificate);

// Update a medical certificate
router.put('/:id', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.updateCertificate);

// Delete a medical certificate
router.delete('/:id', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.deleteCertificate);

// Generate PDF for medical certificate
router.get('/:id/pdf', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificateController.generatePDF);

module.exports = router;


