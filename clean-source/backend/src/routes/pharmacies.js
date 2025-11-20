const express = require('express');
const pharmacyController = require('../controllers/pharmacyController');

const router = express.Router();

router.get('/orders', pharmacyController.getOrders);
router.post('/dispense', pharmacyController.dispense);
router.post('/bulk-dispense', pharmacyController.bulkDispense);
router.get('/inventory', pharmacyController.getInventory);
router.post('/inventory', pharmacyController.addInventoryItem);
router.put('/inventory/:id', pharmacyController.updateInventoryItem);
router.delete('/inventory/:id', pharmacyController.deleteInventoryItem);
router.get('/dispense-history', pharmacyController.getDispenseHistory);
router.post('/register-medication', pharmacyController.registerMedication);

module.exports = router;