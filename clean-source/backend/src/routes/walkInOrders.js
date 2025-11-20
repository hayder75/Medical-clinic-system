const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  createWalkInLabOrder,
  createWalkInRadiologyOrder
} = require('../controllers/walkInOrdersController');

// Create walk-in lab order
router.post(
  '/lab',
  authMiddleware,
  roleGuard(['LAB_TECHNICIAN', 'ADMIN']),
  createWalkInLabOrder
);

// Create walk-in radiology order
router.post(
  '/radiology',
  authMiddleware,
  roleGuard(['RADIOLOGIST', 'ADMIN']),
  createWalkInRadiologyOrder
);

module.exports = router;

