const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test function to check if endpoints exist
async function testEndpoints() {
  console.log('🧪 Testing Pharmacy Endpoints...\n');

  const endpoints = [
    '/pharmacies/inventory',
    '/walk-in-sales/sales',
    '/pharmacy-billing/invoices'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
        timeout: 5000,
        validateStatus: function (status) {
          // Accept any status code (including 401 for auth required)
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status === 401) {
        console.log(`✅ ${endpoint} - Endpoint exists (Authentication required)`);
      } else if (response.status === 200) {
        console.log(`✅ ${endpoint} - Endpoint works`);
      } else {
        console.log(`⚠️  ${endpoint} - Status: ${response.status}`);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          console.log(`✅ ${endpoint} - Endpoint exists (Authentication required)`);
        } else {
          console.log(`❌ ${endpoint} - Error: ${error.response.status} ${error.response.statusText}`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint} - Server not running`);
      } else {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
  }

  console.log('\n📋 Summary:');
  console.log('- All endpoints should return 401 (Authentication required) if the server is running');
  console.log('- If you get 404 errors, the endpoints are not properly configured');
  console.log('- If you get connection refused, the server is not running');
  console.log('\n🔧 To fix the issues:');
  console.log('1. Make sure the backend server is running on port 3000');
  console.log('2. Access the frontend on port 3001 (not 3002)');
  console.log('3. The frontend will proxy API calls to the backend automatically');
  console.log('4. You need to login first to get authentication tokens');
}

testEndpoints().catch(console.error);


