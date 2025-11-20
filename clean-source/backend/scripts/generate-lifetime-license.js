const { saveLicense, getHardwareId } = require('../src/utils/license');
const readline = require('readline');

/**
 * Quick Lifetime License Generator
 * Generates a lifetime license (never expires)
 * 
 * Usage: node scripts/generate-lifetime-license.js
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Medical Clinic System - Lifetime License Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  try {
    // Get customer information
    const customerName = await question('Customer Name: ');
    if (!customerName.trim()) {
      console.error('❌ Customer name is required');
      process.exit(1);
    }

    // Get hardware ID (optional)
    console.log('\n📋 Hardware ID (optional):');
    console.log('   - Leave empty to generate license for any PC');
    console.log('   - Or provide hardware ID to tie license to specific PC');
    const hardwareIdInput = await question('Hardware ID (press Enter to skip): ');
    const hardwareId = hardwareIdInput.trim() || null;

    // Generate lifetime license
    const licenseData = {
      customerName: customerName.trim(),
      expiryDate: null, // null = lifetime
      hardwareId: hardwareId,
      isActive: true,
      licenseType: 'LIFETIME'
    };

    const licensePath = saveLicense(licenseData);
    
    console.log('\n✅ Lifetime license generated successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📁 License file: ${licensePath}`);
    console.log(`👤 Customer: ${customerName}`);
    console.log(`📋 Type: LIFETIME (never expires)`);
    console.log(`🔒 Hardware ID: ${hardwareId || 'Not specified (works on any PC)'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📝 Instructions:');
    console.log('   1. Send the license.enc file to the customer');
    console.log('   2. Customer replaces old license.enc in backend folder');
    console.log('   3. Customer restarts the server');
    console.log('   4. System will work forever (lifetime license)');
    console.log('');

  } catch (error) {
    console.error('❌ Error generating license:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

