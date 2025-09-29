const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test the complete radiology workflow
async function testRadiologyWorkflow() {
  try {
    console.log('🚀 Starting Radiology Workflow Test...\n');

    // Step 1: Login as admin
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful\n');

    // Step 2: Register a test patient
    console.log('2. Registering test patient...');
    const patientResponse = await axios.post(`${BASE_URL}/billing/register`, {
      name: 'Radiology Test Patient',
      type: 'REGULAR',
      dob: '1990-01-01',
      gender: 'MALE',
      mobile: '0912345678',
      email: 'radiology.test@example.com',
      address: 'Test Address',
      emergencyContact: 'Emergency Contact - 0918765432',
      bloodType: 'O_PLUS'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const patientId = patientResponse.data.patient.id;
    console.log(`✅ Patient registered: ${patientId}\n`);

    // Step 3: Pay entry fee
    console.log('3. Paying entry fee...');
    const billingId = patientResponse.data.billing.id;
    await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: billingId,
      amount: 200,
      type: 'CASH',
      notes: 'Entry fee payment'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Entry fee paid\n');

    // Step 4: Record vitals
    console.log('4. Recording vitals...');
    const vitalsResponse = await axios.post(`${BASE_URL}/nurses/vitals`, {
      patientId: patientId,
      visitId: patientResponse.data.visit.id,
      bloodPressure: '120/80',
      temperature: 36.5,
      heartRate: 72,
      height: 1.75,
      weight: 70,
      oxygenSaturation: 98,
      condition: 'Stable',
      notes: 'Patient appears healthy'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Vitals recorded\n');

    // Step 5: Assign doctor
    console.log('5. Assigning doctor...');
    const doctorsResponse = await axios.get(`${BASE_URL}/nurses/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const doctorId = doctorsResponse.data.doctors[0].id;
    
    await axios.post(`${BASE_URL}/nurses/assignments`, {
      patientId: patientId,
      visitId: patientResponse.data.visit.id,
      doctorId: doctorId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Doctor assigned\n');

    // Step 6: Pay consultation fee
    console.log('6. Paying consultation fee...');
    const consultationBilling = await axios.get(`${BASE_URL}/billing`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const consultationBill = consultationBilling.data.billings.find(b => b.patientId === patientId && b.totalAmount === 500);
    
    await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: consultationBill.id,
      amount: 500,
      type: 'CASH',
      notes: 'Consultation fee payment'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Consultation fee paid\n');

    // Step 7: Login as doctor and order radiology tests
    console.log('7. Logging in as doctor...');
    const doctorLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'hayder',
      password: 'hayder123'
    });
    const doctorToken = doctorLoginResponse.data.token;
    console.log('✅ Doctor login successful\n');

    // Step 8: Order radiology tests
    console.log('8. Ordering radiology tests...');
    const radiologyOrderResponse = await axios.post(`${BASE_URL}/doctors/radiology-orders/multiple`, {
      visitId: patientResponse.data.visit.id,
      patientId: patientId,
      orders: [
        { typeId: 27, instructions: 'Chest X-Ray AP view' },
        { typeId: 29, instructions: 'CT Scan Head with contrast' }
      ]
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log('✅ Radiology tests ordered\n');

    // Step 9: Pay for radiology tests
    console.log('9. Paying for radiology tests...');
    const radiologyBilling = await axios.get(`${BASE_URL}/billing`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const radiologyBill = radiologyBilling.data.billings.find(b => b.patientId === patientId && b.totalAmount > 1000);
    
    await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: radiologyBill.id,
      amount: radiologyBill.totalAmount,
      type: 'CASH',
      notes: 'Radiology tests payment'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Radiology tests paid\n');

    // Step 10: Login as radiology technician
    console.log('10. Logging in as radiology technician...');
    const radiologyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'radiology1',
      password: 'radiology123'
    });
    const radiologyToken = radiologyLoginResponse.data.token;
    console.log('✅ Radiology technician login successful\n');

    // Step 11: Get radiology orders
    console.log('11. Getting radiology orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/radiologies/orders`, {
      headers: { Authorization: `Bearer ${radiologyToken}` }
    });
    const radiologyOrder = ordersResponse.data.batchOrders.find(order => order.patientId === patientId);
    console.log(`✅ Found radiology order: ${radiologyOrder.id}\n`);

    // Step 12: Submit per-test results
    console.log('12. Submitting per-test results...');
    
    // Submit result for Chest X-Ray
    const chestXRayResult = await axios.post(`${BASE_URL}/radiologies/batch-orders/${radiologyOrder.id}/results`, {
      testTypeId: 27,
      resultText: 'Chest X-Ray shows clear lung fields, no acute abnormalities detected. Heart size normal.',
      additionalNotes: 'Patient positioned correctly, good image quality.'
    }, {
      headers: { Authorization: `Bearer ${radiologyToken}` }
    });
    console.log('✅ Chest X-Ray result submitted');

    // Submit result for CT Scan
    const ctScanResult = await axios.post(`${BASE_URL}/radiologies/batch-orders/${radiologyOrder.id}/results`, {
      testTypeId: 29,
      resultText: 'CT Scan of head shows no acute intracranial abnormalities. No evidence of hemorrhage or mass effect.',
      additionalNotes: 'Contrast administered successfully, no adverse reactions.'
    }, {
      headers: { Authorization: `Bearer ${radiologyToken}` }
    });
    console.log('✅ CT Scan result submitted\n');

    // Step 13: Check if patient appears in doctor's results queue
    console.log('13. Checking doctor results queue...');
    const resultsQueueResponse = await axios.get(`${BASE_URL}/doctors/results-queue`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    const patientInQueue = resultsQueueResponse.data.resultsQueue.find(visit => visit.patient.id === patientId);
    
    if (patientInQueue) {
      console.log('✅ Patient found in doctor results queue!');
      console.log(`   Patient: ${patientInQueue.patient.name}`);
      console.log(`   Visit ID: ${patientInQueue.id}`);
      console.log(`   Status: ${patientInQueue.status}`);
      console.log(`   Queue Type: ${patientInQueue.queueType}`);
    } else {
      console.log('❌ Patient not found in doctor results queue');
    }

    console.log('\n🎉 Radiology workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in radiology workflow test:', error.response?.data || error.message);
  }
}

// Run the test
testRadiologyWorkflow();
