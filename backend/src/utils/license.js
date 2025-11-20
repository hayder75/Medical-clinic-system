const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * License Management System
 * 
 * Features:
 * - Hardware fingerprinting (ties license to specific PC)
 * - Expiration dates
 * - License validation on startup
 * - Encrypted license files
 * - Remote disable capability
 */

// Secret key for license encryption (change this to your own secret)
const LICENSE_SECRET = process.env.LICENSE_SECRET || 'CHANGE_THIS_TO_YOUR_SECRET_KEY_MIN_32_CHARS';

/**
 * Generate hardware fingerprint (unique to each PC)
 */
function getHardwareFingerprint() {
  const networkInterfaces = os.networkInterfaces();
  const macAddresses = [];
  
  // Get MAC addresses from network interfaces
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((iface) => {
      if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
        macAddresses.push(iface.mac);
      }
    });
  });
  
  // Combine with hostname and platform
  const fingerprint = `${os.hostname()}-${os.platform()}-${macAddresses.sort().join('-')}`;
  
  // Create hash
  return crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);
}

/**
 * Encrypt license data
 */
function encryptLicense(data) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(LICENSE_SECRET, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    iv: iv.toString('hex'),
    encrypted: encrypted
  };
}

/**
 * Decrypt license data
 */
function decryptLicense(encryptedData) {
  try {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(LICENSE_SECRET, 'salt', 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Invalid license file format');
  }
}

/**
 * Generate a license file
 * @param {Object} licenseData - License information
 * @param {string} licenseData.customerName - Customer name
 * @param {Date} licenseData.expiryDate - Expiration date (null for lifetime)
 * @param {string} licenseData.hardwareId - Hardware fingerprint (optional, auto-generated)
 * @param {boolean} licenseData.isActive - Whether license is active
 * @param {string} licenseData.licenseType - 'TRIAL', 'LIFETIME', or 'SUBSCRIPTION'
 * @returns {Object} Encrypted license data
 */
function generateLicense(licenseData) {
  const hardwareId = licenseData.hardwareId || getHardwareFingerprint();
  
  // Determine license type if not specified
  let licenseType = licenseData.licenseType;
  if (!licenseType) {
    if (!licenseData.expiryDate) {
      licenseType = 'LIFETIME';
    } else {
      const expiryDate = new Date(licenseData.expiryDate);
      const now = new Date();
      const daysDiff = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      licenseType = daysDiff <= 30 ? 'TRIAL' : 'SUBSCRIPTION';
    }
  }
  
  const license = {
    customerName: licenseData.customerName,
    expiryDate: licenseData.expiryDate ? new Date(licenseData.expiryDate).toISOString() : null, // null = lifetime
    hardwareId: hardwareId,
    isActive: licenseData.isActive !== false,
    licenseType: licenseType, // TRIAL, LIFETIME, or SUBSCRIPTION
    issuedDate: new Date().toISOString(),
    version: '1.0'
  };
  
  return encryptLicense(license);
}

/**
 * Validate license
 * @param {string} licenseFilePath - Path to license file
 * @returns {Object} Validation result
 */
function validateLicense(licenseFilePath = null) {
  const defaultLicensePath = path.join(__dirname, '../../license.enc');
  const licensePath = licenseFilePath || defaultLicensePath;
  
  // Check if license file exists
  if (!fs.existsSync(licensePath)) {
    return {
      valid: false,
      error: 'LICENSE_FILE_NOT_FOUND',
      message: 'License file not found. Please contact the vendor.'
    };
  }
  
  try {
    // Read and decrypt license
    const encryptedData = JSON.parse(fs.readFileSync(licensePath, 'utf8'));
    const license = decryptLicense(encryptedData);
    
    // Get current hardware fingerprint
    const currentHardwareId = getHardwareFingerprint();
    
    // Validate hardware ID
    if (license.hardwareId !== currentHardwareId) {
      return {
        valid: false,
        error: 'HARDWARE_MISMATCH',
        message: 'License is not valid for this computer. Please contact the vendor.',
        license: license
      };
    }
    
    // Check if license is active
    if (!license.isActive) {
      return {
        valid: false,
        error: 'LICENSE_DEACTIVATED',
        message: 'License has been deactivated. Please contact the vendor.',
        license: license
      };
    }
    
    // Check expiration (skip for lifetime licenses)
    if (license.licenseType === 'LIFETIME') {
      // Lifetime license - never expires
      return {
        valid: true,
        license: license,
        daysRemaining: Infinity,
        message: 'Lifetime license - no expiration'
      };
    }
    
    // Check expiration for trial/subscription licenses
    if (!license.expiryDate) {
      return {
        valid: false,
        error: 'LICENSE_INVALID',
        message: 'License has no expiration date and is not a lifetime license',
        license: license
      };
    }
    
    const expiryDate = new Date(license.expiryDate);
    const now = new Date();
    
    if (now > expiryDate) {
      const licenseTypeText = license.licenseType === 'TRIAL' ? 'Trial' : 'License';
      return {
        valid: false,
        error: 'LICENSE_EXPIRED',
        message: `${licenseTypeText} expired on ${expiryDate.toLocaleDateString()}. Please contact the vendor to upgrade to lifetime license.`,
        license: license,
        daysRemaining: 0
      };
    }
    
    // Calculate days remaining
    const daysRemaining = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    // License is valid
    const licenseTypeText = license.licenseType === 'TRIAL' ? 'Trial' : 'License';
    const expiryText = license.licenseType === 'TRIAL' 
      ? `Trial expires on ${expiryDate.toLocaleDateString()} (${daysRemaining} days remaining)`
      : `License valid until ${expiryDate.toLocaleDateString()} (${daysRemaining} days remaining)`;
    
    return {
      valid: true,
      license: license,
      daysRemaining: daysRemaining,
      message: expiryText
    };
    
  } catch (error) {
    return {
      valid: false,
      error: 'LICENSE_INVALID',
      message: `License file is corrupted or invalid: ${error.message}`,
      details: error.message
    };
  }
}

/**
 * Save license file
 */
function saveLicense(licenseData, outputPath = null) {
  const defaultPath = path.join(__dirname, '../../license.enc');
  const licensePath = outputPath || defaultPath;
  
  const encrypted = generateLicense(licenseData);
  fs.writeFileSync(licensePath, JSON.stringify(encrypted, null, 2), 'utf8');
  
  return licensePath;
}

/**
 * Get hardware ID for license generation
 */
function getHardwareId() {
  return getHardwareFingerprint();
}

module.exports = {
  generateLicense,
  validateLicense,
  saveLicense,
  getHardwareId,
  getHardwareFingerprint,
  encryptLicense,
  decryptLicense
};

