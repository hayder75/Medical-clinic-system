const { generateLicense, saveLicense, getHardwareId } = require('../src/utils/license');
const readline = require('readline');

/**
 * License Generator Script
 * 
 * Run this to generate a license file for a customer
 * Usage: node scripts/generate-license.js
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
  console.log('  Medical Clinic System - License Generator');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  try {
    // Get customer information
    const customerName = await question('Customer Name: ');
    if (!customerName.trim()) {
      console.error('❌ Customer name is required');
      process.exit(1);
    }

    // Get license type
    console.log('\n📋 License Type:');
    console.log('   1. TRIAL - 30 days trial period');
    console.log('   2. LIFETIME - Never expires (after payment)');
    console.log('   3. CUSTOM - Custom expiration date');
    const licenseTypeInput = await question('Select license type (1/2/3): ');
    
    let licenseType;
    let expiryDate = null;
    
    if (licenseTypeInput.trim() === '1') {
      // Trial - 30 days
      licenseType = 'TRIAL';
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      console.log(`   → Trial license will expire on: ${expiryDate.toLocaleDateString()}`);
    } else if (licenseTypeInput.trim() === '2') {
      // Lifetime
      licenseType = 'LIFETIME';
      expiryDate = null; // null = never expires
      console.log('   → Lifetime license (never expires)');
    } else {
      // Custom expiration
      licenseType = 'SUBSCRIPTION';
      console.log('\n📅 Custom Expiration:');
      console.log('   - Format: YYYY-MM-DD (e.g., 2026-12-31)');
      console.log('   - Or number of days from today (e.g., 365)');
      const expiryInput = await question('Expiration date or days: ');
      
      if (/^\d+$/.test(expiryInput.trim())) {
        // Number of days
        const days = parseInt(expiryInput.trim());
        expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        console.log(`   → License will expire on: ${expiryDate.toLocaleDateString()}`);
      } else {
        // Date string
        expiryDate = new Date(expiryInput.trim());
        if (isNaN(expiryDate.getTime())) {
          console.error('❌ Invalid date format');
          process.exit(1);
        }
      }
    }

    // Get hardware ID (optional - if not provided, will be generated on first use)
    console.log('\n📋 Hardware ID (optional):');
    console.log('   - Leave empty to generate license for any PC');
    console.log('   - Or provide hardware ID to tie license to specific PC');
    console.log('   - Get hardware ID from: http://SERVER_IP:3000/api/license/hardware-id');
    const hardwareIdInput = await question('Hardware ID (press Enter to skip): ');
    const hardwareId = hardwareIdInput.trim() || null;

    // Check if license should be active
    const isActiveInput = await question('\n✅ Activate license? (Y/n): ');
    const isActive = isActiveInput.trim().toLowerCase() !== 'n';

    // Generate license
    console.log('\n🔐 Generating license...');
    
    const licenseData = {
      customerName: customerName.trim(),
      expiryDate: expiryDate,
      hardwareId: hardwareId,
      isActive: isActive,
      licenseType: licenseType
    };

    const licensePath = saveLicense(licenseData);
    
    console.log('\n✅ License generated successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📁 License file: ${licensePath}`);
    console.log(`👤 Customer: ${customerName}`);
    console.log(`📋 Type: ${licenseType}`);
    if (licenseType === 'LIFETIME') {
      console.log(`📅 Expires: Never (Lifetime License)`);
    } else {
      console.log(`📅 Expires: ${expiryDate.toLocaleDateString()}`);
    }
    console.log(`🔒 Hardware ID: ${hardwareId || 'Not specified (works on any PC)'}`);
    console.log(`✅ Status: ${isActive ? 'Active' : 'Inactive'}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📝 Instructions:');
    console.log('   1. Send the license.enc file to the customer');
    console.log('   2. Customer places it in the backend folder');
    console.log('   3. Customer restarts the server');
    console.log('   4. System will validate license on startup');
    console.log('');
    
    if (licenseType === 'TRIAL') {
      console.log('⚠️  TRIAL LICENSE:');
      console.log('   - Customer has 30 days to test the system');
      console.log('   - After payment, generate a LIFETIME license');
      console.log('   - Send new license.enc file to upgrade');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error generating license:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

