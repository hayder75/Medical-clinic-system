const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Get lab tests for ordering (hierarchical structure)
router.get('/tests/for-ordering', authMiddleware, roleGuard(['DOCTOR', 'LAB_TECHNICIAN', 'ADMIN']), adminController.getLabTestsForOrdering);

// Get lab templates
router.get('/templates', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.getTemplates);

// Get detailed lab results for a specific order (must come before /orders)
router.get('/orders/:orderId/detailed-results', authMiddleware, roleGuard(['DOCTOR', 'LAB_TECHNICIAN', 'ADMIN']), labController.getDetailedResults);

// Get lab orders (batch orders)
router.get('/orders', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.getOrders);

// Save individual lab result (old system)
router.post('/results/individual', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.saveIndividualLabResult);

// Save lab test result (new system)
router.post('/results/lab-test', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.saveLabTestResult);

// Send lab results to doctor
router.post('/orders/:labOrderId/send-to-doctor', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.sendToDoctor);

// Update lab order status (for walk-in orders)
router.patch('/orders/:labOrderId', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.updateLabOrderStatus);

// Generate PDF for lab results
router.get('/orders/:batchOrderId/pdf', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN', 'DOCTOR']), labController.generateLabResultsPDF);

module.exports = router;


