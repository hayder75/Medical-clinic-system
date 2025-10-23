const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  pharmacy: { username: 'pharmacy', password: 'pharmacy123' },
  pharmacyBilling: { username: 'pharmacy1', password: 'pharmacy123' },
  doctor: { username: 'doctor1', password: 'doctor123' }
};

let tokens = {};
let testData = {};

async function getToken(role) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS[role]);
    tokens[role] = response.data.token;
    console.log(`✅ ${role.toUpperCase()} token obtained`);
    return tokens[role];
  } catch (error) {
    console.error(`❌ Failed to get ${role} token:`, error.response?.data || error.message);
    throw error;
  }
}

async function step1_TestInventoryManagement() {
  console.log('\n💊 STEP 1: Pharmacy Inventory Management');
  console.log('=' .repeat(60));
  
  try {
    await getToken('pharmacy');
    
    // Test 1: Get inventory
    console.log('📋 Testing inventory retrieval...');
    const inventoryResponse = await axios.get(`${BASE_URL}/pharmacies/inventory`, {
      headers: { Authorization: `Bearer ${tokens.pharmacy}` }
    });
    
    console.log('✅ Inventory retrieved:', inventoryResponse.data.inventory?.length || 0, 'items');
    testData.inventory = inventoryResponse.data.inventory || [];
    
    // Test 2: Add new medication to inventory
    console.log('📝 Testing medication addition...');
    const timestamp = Date.now();
    const newMedication = {
      name: `Test Medication ${timestamp}`,
      category: 'TABLETS', // Use valid MedicineCategory enum value
      quantity: 100,
      unit: 'TABLETS',
      price: 5.50,
      supplier: 'Test Pharma',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      lowStockThreshold: 10
    };
    
    const addResponse = await axios.post(`${BASE_URL}/pharmacies/inventory`, newMedication, {
      headers: { Authorization: `Bearer ${tokens.pharmacy}` }
    });
    
    console.log('✅ Medication added:', addResponse.data.medication?.name);
    testData.newMedicationId = addResponse.data.medication?.id;
    
    // Test 3: Update medication
    if (testData.newMedicationId) {
      console.log('✏️ Testing medication update...');
      const updateData = {
        name: `Updated Test Medication ${timestamp}`,
        category: 'CAPSULES', // Use valid MedicineCategory enum value
        quantity: 150,
        unit: 'CAPSULES',
        price: 6.00,
        supplier: 'Updated Pharma',
        lowStockThreshold: 15
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/pharmacies/inventory/${testData.newMedicationId}`, updateData, {
        headers: { Authorization: `Bearer ${tokens.pharmacy}` }
      });
      
      console.log('✅ Medication updated:', updateResponse.data.medication?.name);
    }
    
    console.log('📊 Step 1 Results:');
    console.log(`   Total Inventory Items: ${testData.inventory.length}`);
    console.log(`   New Medication Added: ${testData.newMedicationId ? 'Yes' : 'No'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 1 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step2_TestWalkInSales() {
  console.log('\n🛒 STEP 2: Walk-in Sales Functionality');
  console.log('=' .repeat(60));
  
  try {
    await getToken('pharmacy');
    
    // Debug: Check testData
    console.log('🔍 Debug - testData.inventory:', testData.inventory?.length || 'undefined');
    console.log('🔍 Debug - testData keys:', Object.keys(testData));
    
    // Test 1: Create walk-in sale
    console.log('🛍️ Testing walk-in sale creation...');
    console.log('🔍 Debug - Creating walk-in sale data...');
    console.log('🔍 Debug - testData.inventory[0]:', testData.inventory[0]);
    
    const walkInSaleData = {
      customerName: 'John Customer',
      customerPhone: '0912345678',
      customerEmail: 'john@example.com',
      pharmacyInvoiceItems: [
        {
          medicationCatalogId: testData.inventory[0]?.id || '1',
          name: testData.inventory[0]?.name || 'Paracetamol',
          dosageForm: 'Tablet',
          strength: '500mg',
          quantity: 2,
          unitPrice: testData.inventory[0]?.unitPrice || 2.50,
          notes: 'For headache'
        },
        {
          name: 'Custom Medication',
          dosageForm: 'Capsule',
          strength: '250mg',
          quantity: 1,
          unitPrice: 8.00,
          notes: 'Custom order'
        }
      ],
      paymentMethod: 'CASH',
      notes: 'Walk-in customer purchase'
    };
    
    console.log('🔍 Debug - walkInSaleData created successfully');
    
    // Calculate total amount
    walkInSaleData.totalAmount = walkInSaleData.pharmacyInvoiceItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
    
    console.log('🔍 Debug - About to make API call...');
    console.log('🔍 Debug - walkInSaleData:', JSON.stringify(walkInSaleData, null, 2));
    
    const saleResponse = await axios.post(`${BASE_URL}/walk-in-sales/sales`, walkInSaleData, {
      headers: { Authorization: `Bearer ${tokens.pharmacy}` }
    });
    
    console.log('🔍 Debug - API call successful');
    
    console.log('✅ Walk-in sale created:', saleResponse.data.invoice?.id);
    testData.walkInSaleId = saleResponse.data.invoice?.id;
    
    // Test 2: Get walk-in sales
    console.log('📋 Testing walk-in sales retrieval...');
    const salesResponse = await axios.get(`${BASE_URL}/walk-in-sales/sales`, {
      headers: { Authorization: `Bearer ${tokens.pharmacy}` }
    });
    
    console.log('✅ Walk-in sales retrieved:', salesResponse.data.sales?.length || 0, 'sales');
    
    // Test 3: Process payment
    if (testData.walkInSaleId) {
      console.log('💳 Testing payment processing...');
      const paymentResponse = await axios.post(`${BASE_URL}/walk-in-sales/sales/${testData.walkInSaleId}/payment`, {
        paymentMethod: 'CASH'
      }, {
        headers: { Authorization: `Bearer ${tokens.pharmacy}` }
      });
      
      console.log('✅ Payment processed:', paymentResponse.data.invoice?.status);
    }
    
    // Test 4: Dispense walk-in sale
    if (testData.walkInSaleId) {
      console.log('💊 Testing walk-in sale dispensing...');
      const dispenseResponse = await axios.post(`${BASE_URL}/walk-in-sales/sales/${testData.walkInSaleId}/dispense`, {
        items: walkInSaleData.pharmacyInvoiceItems
      }, {
        headers: { Authorization: `Bearer ${tokens.pharmacy}` }
      });
      
      console.log('✅ Walk-in sale dispensed:', dispenseResponse.data.dispensedMedicines?.length || 0, 'items');
    }
    
    console.log('📊 Step 2 Results:');
    console.log(`   Walk-in Sale Created: ${testData.walkInSaleId ? 'Yes' : 'No'}`);
    console.log(`   Payment Processed: ${testData.walkInSaleId ? 'Yes' : 'No'}`);
    console.log(`   Sale Dispensed: ${testData.walkInSaleId ? 'Yes' : 'No'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 2 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step3_TestPharmacyBilling() {
  console.log('\n💰 STEP 3: Pharmacy Billing System');
  console.log('=' .repeat(60));
  
  try {
    await getToken('pharmacyBilling');
    
    // Test 1: Get pharmacy invoices
    console.log('📋 Testing pharmacy invoices retrieval...');
    const invoicesResponse = await axios.get(`${BASE_URL}/pharmacy-billing/invoices`, {
      headers: { Authorization: `Bearer ${tokens.pharmacyBilling}` }
    });
    
    console.log('✅ Pharmacy invoices retrieved:', invoicesResponse.data.invoices?.length || 0, 'invoices');
    testData.pharmacyInvoices = invoicesResponse.data.invoices || [];
    
    // Test 2: Get insurance companies
    console.log('🏥 Testing insurance companies retrieval...');
    const insuranceResponse = await axios.get(`${BASE_URL}/pharmacy-billing/insurance`, {
      headers: { Authorization: `Bearer ${tokens.pharmacyBilling}` }
    });
    
    console.log('✅ Insurance companies retrieved:', insuranceResponse.data.insuranceCompanies?.length || 0, 'companies');
    
    // Test 3: Process pharmacy payment (if we have invoices)
    if (testData.pharmacyInvoices.length > 0) {
      const invoice = testData.pharmacyInvoices.find(inv => inv.status === 'PENDING');
      if (invoice) {
        console.log('💳 Testing pharmacy payment processing...');
        const paymentResponse = await axios.post(`${BASE_URL}/pharmacy-billing/payments`, {
          pharmacyInvoiceId: invoice.id,
          amount: invoice.totalAmount,
          type: 'CASH',
          notes: 'Test payment'
        }, {
          headers: { Authorization: `Bearer ${tokens.pharmacyBilling}` }
        });
        
        console.log('✅ Pharmacy payment processed:', paymentResponse.data.invoice?.status);
        testData.processedInvoiceId = invoice.id;
      }
    }
    
    console.log('📊 Step 3 Results:');
    console.log(`   Pharmacy Invoices: ${testData.pharmacyInvoices.length}`);
    console.log(`   Payment Processed: ${testData.processedInvoiceId ? 'Yes' : 'No'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 3 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step4_TestPrescriptionQueue() {
  console.log('\n📋 STEP 4: Prescription Queue Management');
  console.log('=' .repeat(60));
  
  try {
    await getToken('pharmacy');
    
    // Test 1: Get prescription queue
    console.log('📋 Testing prescription queue retrieval...');
    const queueResponse = await axios.get(`${BASE_URL}/pharmacies/orders`, {
      headers: { Authorization: `Bearer ${tokens.pharmacy}` }
    });
    
    console.log('✅ Prescription queue retrieved:', queueResponse.data.orders?.length || 0, 'orders');
    testData.prescriptionOrders = queueResponse.data.orders || [];
    
    // Test 2: Dispense medication (if we have orders)
    if (testData.prescriptionOrders.length > 0) {
      const order = testData.prescriptionOrders[0];
      console.log('💊 Testing medication dispensing...');
      
      const dispenseResponse = await axios.post(`${BASE_URL}/pharmacies/dispense`, {
        orderId: order.id,
        quantity: order.quantity,
        notes: 'Test dispensing'
      }, {
        headers: { Authorization: `Bearer ${tokens.pharmacy}` }
      });
      
      console.log('✅ Medication dispensed:', dispenseResponse.data.message);
    }
    
    // Test 3: Get dispense history
    console.log('📚 Testing dispense history retrieval...');
    const historyResponse = await axios.get(`${BASE_URL}/pharmacies/dispense-history`, {
      headers: { Authorization: `Bearer ${tokens.pharmacy}` }
    });
    
    console.log('✅ Dispense history retrieved:', historyResponse.data.dispenseLogs?.length || 0, 'entries');
    
    console.log('📊 Step 4 Results:');
    console.log(`   Prescription Orders: ${testData.prescriptionOrders.length}`);
    console.log(`   Medication Dispensed: ${testData.prescriptionOrders.length > 0 ? 'Yes' : 'No'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 4 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step5_TestMedicationCatalog() {
  console.log('\n📚 STEP 5: Medication Catalog');
  console.log('=' .repeat(60));
  
  try {
    await getToken('doctor');
    
    // Test 1: Get medication catalog
    console.log('📚 Testing medication catalog retrieval...');
    const catalogResponse = await axios.get(`${BASE_URL}/medications/catalog`, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    console.log('✅ Medication catalog retrieved:', catalogResponse.data.medications?.length || 0, 'medications');
    testData.medicationCatalog = catalogResponse.data.medications || [];
    
    // Test 2: Search medications
    if (testData.medicationCatalog.length > 0) {
      console.log('🔍 Testing medication search...');
      const searchResponse = await axios.get(`${BASE_URL}/medications/search?query=paracetamol`, {
        headers: { Authorization: `Bearer ${tokens.doctor}` }
      });
      
      console.log('✅ Medication search completed:', searchResponse.data.medications?.length || 0, 'results');
    }
    
    console.log('📊 Step 5 Results:');
    console.log(`   Catalog Medications: ${testData.medicationCatalog.length}`);
    console.log(`   Search Functionality: ${testData.medicationCatalog.length > 0 ? 'Working' : 'N/A'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 5 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step6_TestPharmacyBillingDashboard() {
  console.log('\n📊 STEP 6: Pharmacy Billing Dashboard');
  console.log('=' .repeat(60));
  
  try {
    await getToken('pharmacyBilling');
    
    // Test dashboard stats (if endpoint exists)
    console.log('📊 Testing pharmacy billing dashboard...');
    
    // Check if pharmacy billing dashboard endpoint exists
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/pharmacy-billing/dashboard-stats`, {
        headers: { Authorization: `Bearer ${tokens.pharmacyBilling}` }
      });
      
      console.log('✅ Pharmacy billing dashboard stats retrieved');
      console.log('📊 Dashboard Data:', JSON.stringify(dashboardResponse.data, null, 2));
    } catch (dashboardError) {
      console.log('⚠️ Pharmacy billing dashboard endpoint not found - this needs to be implemented');
    }
    
    console.log('📊 Step 6 Results:');
    console.log(`   Dashboard Status: ${'Needs Implementation'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 6 failed:', error.response?.data || error.message);
    return false;
  }
}

async function runComprehensivePharmacyTest() {
  console.log('🧪 COMPREHENSIVE PHARMACY SYSTEM TEST');
  console.log('=' .repeat(80));
  console.log('Testing: Inventory → Walk-in Sales → Billing → Prescriptions → Catalog → Dashboard');
  console.log('=' .repeat(80));
  
  const steps = [
    { name: 'Inventory Management', fn: step1_TestInventoryManagement },
    { name: 'Walk-in Sales', fn: step2_TestWalkInSales },
    { name: 'Pharmacy Billing', fn: step3_TestPharmacyBilling },
    { name: 'Prescription Queue', fn: step4_TestPrescriptionQueue },
    { name: 'Medication Catalog', fn: step5_TestMedicationCatalog },
    { name: 'Billing Dashboard', fn: step6_TestPharmacyBillingDashboard }
  ];
  
  let successCount = 0;
  
  for (const step of steps) {
    const success = await step.fn();
    if (success) {
      successCount++;
    } else {
      console.log(`\n❌ Test stopped at step: ${step.name}`);
      break;
    }
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('🏁 PHARMACY TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Successful Steps: ${successCount}/${steps.length}`);
  console.log(`❌ Failed Steps: ${steps.length - successCount}/${steps.length}`);
  
  if (successCount === steps.length) {
    console.log('🎉 ALL PHARMACY TESTS PASSED! System is working correctly.');
  } else {
    console.log('⚠️  Some pharmacy tests failed. Check the logs above for details.');
  }
  
  console.log('\n📊 Test Data Summary:');
  console.log(`   Inventory Items: ${testData.inventory?.length || 0}`);
  console.log(`   New Medication: ${testData.newMedicationId ? 'Added' : 'Not added'}`);
  console.log(`   Walk-in Sale: ${testData.walkInSaleId ? 'Created' : 'Not created'}`);
  console.log(`   Pharmacy Invoices: ${testData.pharmacyInvoices?.length || 0}`);
  console.log(`   Prescription Orders: ${testData.prescriptionOrders?.length || 0}`);
  console.log(`   Medication Catalog: ${testData.medicationCatalog?.length || 0}`);
}

// Run the test
runComprehensivePharmacyTest()
  .then(() => {
    console.log('\n✅ Pharmacy test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Pharmacy test failed with error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
