/**
 * Auto-generate trial license (non-interactive)
 * Usage: node scripts/generate-trial-license-auto.js [customer-name]
 */

const { generateLicense, saveLicense } = require('../src/utils/license');

const customerName = process.argv[2] || 'Medical Clinic Customer';

console.log('═══════════════════════════════════════════════════════');
console.log('  Medical Clinic System - Trial License Generator');
console.log('═══════════════════════════════════════════════════════');
console.log('');

try {
  const licenseData = {
    customerName: customerName,
    licenseType: 'TRIAL',
    isActive: true
  };

  const licensePath = saveLicense(licenseData);

  console.log('✅ Trial license generated successfully!');
  console.log('');
  console.log('📄 License file:', licensePath);
  console.log('👤 Customer:', customerName);
  console.log('⏰ Type: TRIAL (30 days)');
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Copy license.enc to client-deployment/backend/');
  console.log('   2. Include in package when sending to client');
  console.log('');
} catch (error) {
  console.error('❌ Error generating license:', error.message);
  process.exit(1);
}

