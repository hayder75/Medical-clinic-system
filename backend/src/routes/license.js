const express = require('express');
const router = express.Router();
const { validateLicense, getHardwareId } = require('../utils/license');

/**
 * Get license information (for debugging/admin)
 * This endpoint is not protected so you can check license status
 */
router.get('/info', (req, res) => {
  const validation = validateLicense();
  
  if (!validation.valid) {
    return res.status(403).json({
      valid: false,
      error: validation.error,
      message: validation.message,
      hardwareId: getHardwareId()
    });
  }
  
  res.json({
    valid: true,
    customerName: validation.license.customerName,
    expiryDate: validation.license.expiryDate,
    licenseType: validation.license.licenseType,
    daysRemaining: validation.daysRemaining === Infinity ? 'Lifetime' : validation.daysRemaining,
    message: validation.message,
    hardwareId: getHardwareId()
  });
});

/**
 * Get hardware ID (for license generation)
 */
router.get('/hardware-id', (req, res) => {
  res.json({
    hardwareId: getHardwareId(),
    message: 'Use this hardware ID when generating the license file'
  });
});

module.exports = router;

