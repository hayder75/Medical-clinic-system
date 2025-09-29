const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Simple test for radiology per-test results
async function testRadiologyPerTest() {
  try {
    console.log('🚀 Testing Radiology Per-Test Results...\n');

    // Login as radiology technician
    console.log('1. Logging in as radiology technician...');
    const radiologyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'radiology1',
      password: 'radiology123'
    });
    const radiologyToken = radiologyLoginResponse.data.token;
    console.log('✅ Radiology technician login successful\n');

    // Get radiology orders
    console.log('2. Getting radiology orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/radiologies/orders`, {
      headers: { Authorization: `Bearer ${radiologyToken}` }
    });
    const radiologyOrder = ordersResponse.data.batchOrders[0];
    console.log(`✅ Found radiology order: ${radiologyOrder.id}\n`);

    // Test creating a per-test result
    console.log('3. Testing per-test result creation...');
    try {
      const resultResponse = await axios.post(`${BASE_URL}/radiologies/batch-orders/${radiologyOrder.id}/results`, {
        testTypeId: 29, // CT Scan - Head
        resultText: 'Test result for CT Scan - Head shows no abnormalities.',
        additionalNotes: 'Test notes for CT Scan'
      }, {
        headers: { Authorization: `Bearer ${radiologyToken}` }
      });
      console.log('✅ Per-test result created successfully');
      console.log('Result ID:', resultResponse.data.radiologyResult.id);
    } catch (error) {
      console.error('❌ Error creating per-test result:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Error in radiology per-test test:', error.response?.data || error.message);
  }
}

// Run the test
testRadiologyPerTest();
