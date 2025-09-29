const express = require('express');
const scheduleController = require('../controllers/scheduleController');

const router = express.Router();

router.put('/availability', scheduleController.toggleAvailability);
router.get('/appointments', scheduleController.getAppointments);

module.exports = router;