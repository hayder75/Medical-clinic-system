const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

// Get lab templates
router.get('/templates', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.getTemplates);

// Get detailed lab results for a specific order (must come before /orders)
router.get('/orders/:orderId/detailed-results', authMiddleware, roleGuard(['DOCTOR', 'LAB_TECHNICIAN', 'ADMIN']), labController.getDetailedResults);

// Get lab orders (batch orders)
router.get('/orders', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.getOrders);

// Save individual lab result
router.post('/results/individual', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.saveIndividualLabResult);

// Send lab results to doctor
router.post('/orders/:labOrderId/send-to-doctor', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), labController.sendToDoctor);

module.exports = router;


