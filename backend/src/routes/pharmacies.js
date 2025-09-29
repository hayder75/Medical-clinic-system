const express = require('express');
const pharmacyController = require('../controllers/pharmacyController');

const router = express.Router();

router.get('/orders', pharmacyController.getOrders);
router.post('/dispense', pharmacyController.dispense);
router.get('/inventory', pharmacyController.getInventory);
router.get('/dispense-history', pharmacyController.getDispenseHistory);
router.post('/register-medication', pharmacyController.registerMedication);

module.exports = router;