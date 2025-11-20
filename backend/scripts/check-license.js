const { validateLicense, getHardwareId } = require('../src/utils/license');

/**
 * Check License Status
 * 
 * Run this to check if license is valid
 * Usage: node scripts/check-license.js
 */

console.log('═══════════════════════════════════════════════════════');
console.log('  Medical Clinic System - License Check');
console.log('═══════════════════════════════════════════════════════');
console.log('');

const validation = validateLicense();

console.log('🔍 Hardware ID:', getHardwareId());
console.log('');

if (validation.valid) {
  console.log('✅ LICENSE VALID');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`👤 Customer: ${validation.license.customerName}`);
  console.log(`📋 Type: ${validation.license.licenseType || 'SUBSCRIPTION'}`);
  if (validation.license.licenseType === 'LIFETIME') {
    console.log(`📅 Expires: Never (Lifetime License)`);
    console.log(`⏰ Days Remaining: Unlimited`);
  } else {
    console.log(`📅 Expires: ${new Date(validation.license.expiryDate).toLocaleDateString()}`);
    console.log(`⏰ Days Remaining: ${validation.daysRemaining}`);
  }
  console.log(`✅ Status: Active`);
  console.log('═══════════════════════════════════════════════════════');
  
  if (validation.license.licenseType === 'TRIAL') {
    console.log('\n⚠️  TRIAL LICENSE:');
    console.log(`   - This is a 30-day trial license`);
    console.log(`   - ${validation.daysRemaining} days remaining`);
    console.log(`   - Contact vendor to upgrade to lifetime license`);
    console.log('');
  }
  
  process.exit(0);
} else {
  console.log('❌ LICENSE INVALID');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Error: ${validation.error}`);
  console.log(`Message: ${validation.message}`);
  if (validation.license) {
    console.log(`Customer: ${validation.license.customerName || 'Unknown'}`);
    console.log(`Type: ${validation.license.licenseType || 'Unknown'}`);
    if (validation.license.expiryDate) {
      console.log(`Expired: ${new Date(validation.license.expiryDate).toLocaleDateString()}`);
    }
  }
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n⚠️  System will not start until license is valid!');
  process.exit(1);
}

