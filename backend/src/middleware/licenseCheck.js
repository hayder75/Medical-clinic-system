const { validateLicense } = require('../utils/license');

/**
 * License validation middleware
 * Blocks all requests if license is invalid
 */
function licenseCheck(req, res, next) {
  // Allow health check endpoint
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }
  
  // Allow license info endpoint (for debugging)
  if (req.path === '/api/license/info') {
    return next();
  }
  
  // Validate license
  const validation = validateLicense();
  
  if (!validation.valid) {
    return res.status(403).json({
      error: 'LICENSE_ERROR',
      message: validation.message,
      code: validation.error,
      details: validation.details || null
    });
  }
  
  // License is valid, continue
  next();
}

module.exports = licenseCheck;

