const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const emergencyController = require('../controllers/emergencyController');

// Emergency Drug Orders (Doctor side)
router.post(
  '/drugs',
  authMiddleware,
  roleGuard(['DOCTOR', 'ADMIN']),
  emergencyController.createEmergencyDrugOrder
);

router.get(
  '/drugs',
  authMiddleware,
  roleGuard(['DOCTOR', 'ADMIN']),
  emergencyController.getEmergencyDrugOrders
);

router.post(
  '/drugs/complete',
  authMiddleware,
  roleGuard(['DOCTOR', 'ADMIN']),
  emergencyController.completeEmergencyDrugOrder
);

// Material Needs Orders (Nurse and Doctor side)
router.post(
  '/materials',
  authMiddleware,
  roleGuard(['NURSE', 'DOCTOR', 'ADMIN']),
  emergencyController.createMaterialNeedsOrder
);

router.get(
  '/materials',
  authMiddleware,
  roleGuard(['NURSE', 'DOCTOR', 'ADMIN']),
  emergencyController.getMaterialNeedsOrders
);

router.post(
  '/materials/complete',
  authMiddleware,
  roleGuard(['NURSE', 'ADMIN']),
  emergencyController.completeMaterialNeedsOrder
);

module.exports = router;
