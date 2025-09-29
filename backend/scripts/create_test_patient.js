const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';

async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    adminToken = response.data.token;
    console.log('✅ Admin logged in successfully');
    return adminToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function registerPatient() {
  try {
    const response = await axios.post(`${BASE_URL}/billing/register`, {
      name: 'Test Patient',
      type: 'REGULAR',
      dob: '1990-01-01',
      gender: 'MALE',
      mobile: '0912345678',
      email: 'test@example.com',
      address: '123 Test Street',
      emergencyContact: 'Emergency Contact - 0918765432',
      bloodType: 'O_PLUS',
      maritalStatus: 'SINGLE'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Patient registered:', response.data.patient.id);
    return response.data;
  } catch (error) {
    console.error('❌ Patient registration failed:', error.response?.data || error.message);
    throw error;
  }
}

async function payEntryFee(billingId) {
  try {
    const response = await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: billingId,
      amount: 200,
      type: 'CASH',
      notes: 'Entry fee payment'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Entry fee paid');
    return response.data;
  } catch (error) {
    console.error('❌ Entry fee payment failed:', error.response?.data || error.message);
    throw error;
  }
}

async function recordVitals(patientId, visitId) {
  try {
    const response = await axios.post(`${BASE_URL}/nurses/vitals`, {
      patientId: patientId,
      visitId: visitId,
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
    
    console.log('✅ Vitals recorded');
    return response.data;
  } catch (error) {
    console.error('❌ Vitals recording failed:', error.response?.data || error.message);
    throw error;
  }
}

async function assignDoctor(patientId, visitId) {
  try {
    // Get doctor ID first
    const doctorsResponse = await axios.get(`${BASE_URL}/nurses/doctors`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const doctorId = doctorsResponse.data.doctors[0].id;
    
    const response = await axios.post(`${BASE_URL}/nurses/assignments`, {
      patientId: patientId,
      visitId: visitId,
      doctorId: doctorId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Doctor assigned');
    return response.data;
  } catch (error) {
    console.error('❌ Doctor assignment failed:', error.response?.data || error.message);
    throw error;
  }
}

async function payConsultationFee(billingId) {
  try {
    const response = await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: billingId,
      amount: 500,
      type: 'CASH',
      notes: 'Consultation fee payment'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Consultation fee paid');
    return response.data;
  } catch (error) {
    console.error('❌ Consultation fee payment failed:', error.response?.data || error.message);
    throw error;
  }
}

async function orderLabTests(visitId, patientId) {
  try {
    const response = await axios.post(`${BASE_URL}/doctors/lab-orders/multiple`, {
      visitId: visitId,
      patientId: patientId,
      orders: [
        { typeId: 19, instructions: 'CBC test' },
        { typeId: 21, instructions: 'Lipid profile' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Lab tests ordered');
    return response.data;
  } catch (error) {
    console.error('❌ Lab tests ordering failed:', error.response?.data || error.message);
    throw error;
  }
}

async function orderRadiologyTests(visitId, patientId) {
  try {
    const response = await axios.post(`${BASE_URL}/doctors/radiology-orders/multiple`, {
      visitId: visitId,
      patientId: patientId,
      orders: [
        { typeId: 27, instructions: 'Chest X-Ray' },
        { typeId: 29, instructions: 'CT Scan - Head' }
      ]
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Radiology tests ordered');
    return response.data;
  } catch (error) {
    console.error('❌ Radiology tests ordering failed:', error.response?.data || error.message);
    throw error;
  }
}

async function payDiagnosticsFees(billingIds) {
  try {
    for (const billingId of billingIds) {
      // Get all billings and find the specific one
      const billingResponse = await axios.get(`${BASE_URL}/billing`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const billing = billingResponse.data.billings.find(b => b.id === billingId);
      if (!billing) {
        console.error(`❌ Billing ${billingId} not found`);
        continue;
      }
      
      const totalAmount = billing.totalAmount;
      
      const response = await axios.post(`${BASE_URL}/billing/payments`, {
        billingId: billingId,
        amount: totalAmount,
        type: 'CASH',
        notes: 'Diagnostics payment'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ Diagnostics fee paid for billing ${billingId}: ${totalAmount} ETB`);
    }
    return true;
  } catch (error) {
    console.error('❌ Diagnostics payment failed:', error.response?.data || error.message);
    throw error;
  }
}

async function processLabResults(batchOrderId) {
  try {
    const response = await axios.put(`${BASE_URL}/batch-orders/${batchOrderId}/results`, {
      result: 'Lab results: All values within normal range',
      additionalNotes: 'No abnormalities detected',
      serviceResults: []
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Lab results processed');
    return response.data;
  } catch (error) {
    console.error('❌ Lab results processing failed:', error.response?.data || error.message);
    throw error;
  }
}

async function processRadiologyResults(batchOrderId) {
  try {
    const response = await axios.put(`${BASE_URL}/batch-orders/${batchOrderId}/results`, {
      result: 'Radiology results: No acute findings',
      additionalNotes: 'Normal imaging studies',
      serviceResults: []
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ Radiology results processed');
    return response.data;
  } catch (error) {
    console.error('❌ Radiology results processing failed:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Starting complete test patient workflow...\n');
    
    // Step 1: Login
    await login();
    
    // Step 2: Register patient
    const registration = await registerPatient();
    const patientId = registration.patient.id;
    const visitId = registration.visit.id;
    const entryBillingId = registration.billing.id;
    
    // Step 3: Pay entry fee
    await payEntryFee(entryBillingId);
    
    // Step 4: Record vitals
    await recordVitals(patientId, visitId);
    
    // Step 5: Assign doctor
    const assignment = await assignDoctor(patientId, visitId);
    const consultationBillingId = assignment.billing.id;
    
    // Step 6: Pay consultation fee
    await payConsultationFee(consultationBillingId);
    
    // Step 7: Order lab tests
    const labOrder = await orderLabTests(visitId, patientId);
    const labBillingId = labOrder.billing.id;
    
    // Step 8: Order radiology tests
    const radiologyOrder = await orderRadiologyTests(visitId, patientId);
    const radiologyBillingId = radiologyOrder.billing.id;
    
    // Step 9: Pay for diagnostics
    await payDiagnosticsFees([labBillingId, radiologyBillingId]);
    
    // Step 10: Process lab results
    await processLabResults(labOrder.batchOrder.id);
    
    // Step 11: Process radiology results
    await processRadiologyResults(radiologyOrder.batchOrder.id);
    
    console.log('\n🎉 Complete test patient workflow finished!');
    console.log(`Patient ID: ${patientId}`);
    console.log(`Visit ID: ${visitId}`);
    console.log('The patient should now appear in the doctor\'s results queue.');
    
  } catch (error) {
    console.error('\n❌ Workflow failed:', error.message);
    process.exit(1);
  }
}

main();
