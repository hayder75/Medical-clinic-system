const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Search medications
router.get('/search', medicationController.searchMedications);

// Get medication by ID
router.get('/:id', medicationController.getMedicationById);

// Get low stock medications
router.get('/low-stock/list', medicationController.getLowStockMedications);

// Get medication categories
router.get('/categories/list', medicationController.getMedicationCategories);

// Create new medication (admin/pharmacy only)
router.post('/', medicationController.createMedication);

// Update medication (admin/pharmacy only)
router.put('/:id', medicationController.updateMedication);

// Update medication stock (pharmacy only)
router.patch('/:id/stock', medicationController.updateStock);

module.exports = router;
