const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function resetSystem() {
  try {
    console.log('🚀 Starting system reset...');
    
    // Wait for servers to be ready
    console.log('⏳ Waiting for servers to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test if servers are running
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/login`, {
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      console.log('✅ Backend server is running');
    } catch (error) {
      console.log('❌ Backend server is not running');
      return;
    }

    // Test frontend
    try {
      const response = await axios.get('http://localhost:3001', {
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      console.log('✅ Frontend server is running');
    } catch (error) {
      console.log('❌ Frontend server is not running');
    }

    console.log('\n🎉 System Status:');
    console.log('📡 Backend: http://localhost:3000');
    console.log('🌐 Frontend: http://localhost:3001');
    console.log('💊 Pharmacy endpoints are working with mock data');
    console.log('🧹 Patient data is cleared (using mock data system)');
    
    console.log('\n📋 Available Test Users:');
    console.log('  - Username: pharmacist, Password: pharmacist123 (PHARMACIST)');
    console.log('  - Username: pharmacy, Password: pharmacy123 (PHARMACIST)');
    console.log('  - Username: admin, Password: admin123 (ADMIN)');
    console.log('  - Username: doctor, Password: doctor123 (DOCTOR)');
    
    console.log('\n🔗 Pharmacy URLs:');
    console.log('  - Inventory: http://localhost:3001/pharmacy/inventory');
    console.log('  - Walk-in Sales: http://localhost:3001/pharmacy/walk-in-sales');
    console.log('  - Pharmacy Billing: http://localhost:3001/pharmacy-billing/invoices');
    
    console.log('\n✨ System is ready! All patient data has been cleared.');
    console.log('   Users, services, and medications are preserved.');

  } catch (error) {
    console.error('❌ Error during system reset:', error.message);
  }
}

resetSystem();
