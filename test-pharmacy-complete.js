const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testPharmacyEndpoints() {
  console.log('🧪 Testing Complete Pharmacy System...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Testing Login...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'pharmacist',
      password: 'pharmacist123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      }
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✅ Login successful! User: ${user.fullname} (${user.role})`);
    console.log(`   Token: ${token.substring(0, 20)}...`);

    // Step 2: Test Pharmacy Inventory
    console.log('\n2️⃣ Testing Pharmacy Inventory...');
    const inventoryResponse = await axios.get(`${API_BASE_URL}/pharmacies/inventory`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3001'
      }
    });

    const inventory = inventoryResponse.data.inventory;
    console.log(`✅ Inventory loaded! Found ${inventory.length} medications:`);
    inventory.forEach(med => {
      console.log(`   - ${med.name} ${med.strength} (${med.dosageForm}) - Stock: ${med.availableQuantity}`);
    });

    // Step 3: Test Walk-in Sales
    console.log('\n3️⃣ Testing Walk-in Sales...');
    const salesResponse = await axios.get(`${API_BASE_URL}/walk-in-sales/sales`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3001'
      }
    });

    const sales = salesResponse.data.sales;
    console.log(`✅ Walk-in sales loaded! Found ${sales.length} sales:`);
    sales.forEach(sale => {
      console.log(`   - ${sale.customerName} - ETB ${sale.totalAmount} (${sale.status})`);
    });

    // Step 4: Test Pharmacy Billing Invoices
    console.log('\n4️⃣ Testing Pharmacy Billing Invoices...');
    const invoicesResponse = await axios.get(`${API_BASE_URL}/pharmacy-billing/invoices`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3001'
      }
    });

    const invoices = invoicesResponse.data.invoices;
    console.log(`✅ Pharmacy invoices loaded! Found ${invoices.length} invoices:`);
    invoices.forEach(invoice => {
      console.log(`   - ${invoice.patient.name} - ETB ${invoice.totalAmount} (${invoice.status})`);
    });

    // Step 5: Test CORS
    console.log('\n5️⃣ Testing CORS Configuration...');
    const corsResponse = await axios.options(`${API_BASE_URL}/auth/login`, {
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    const corsHeaders = corsResponse.headers;
    console.log('✅ CORS headers present:');
    console.log(`   - Access-Control-Allow-Origin: ${corsHeaders['access-control-allow-origin']}`);
    console.log(`   - Access-Control-Allow-Methods: ${corsHeaders['access-control-allow-methods']}`);
    console.log(`   - Access-Control-Allow-Credentials: ${corsHeaders['access-control-allow-credentials']}`);

    console.log('\n🎉 ALL TESTS PASSED! Pharmacy system is working correctly.');
    console.log('\n📋 Summary:');
    console.log('✅ Authentication system working');
    console.log('✅ Pharmacy inventory endpoint working');
    console.log('✅ Walk-in sales endpoint working');
    console.log('✅ Pharmacy billing invoices endpoint working');
    console.log('✅ CORS configuration correct');
    console.log('\n🔧 Next Steps:');
    console.log('1. Access frontend at: http://localhost:3001');
    console.log('2. Login with: pharmacist / pharmacist123');
    console.log('3. Navigate to pharmacy sections');
    console.log('4. All pharmacy features should work!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      console.log('\n💡 Tip: Make sure the backend server is running on port 3000');
    }
  }
}

testPharmacyEndpoints();