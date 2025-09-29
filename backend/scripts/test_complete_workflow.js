const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testCompleteWorkflow() {
  try {
    console.log('🚀 Starting complete workflow test...\n');

    // Step 1: Login as billing officer
    console.log('1. Logging in as billing officer...');
    const billingLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'billing1',
      password: 'billing123'
    });
    const billingToken = billingLogin.data.token;
    const billingHeaders = { Authorization: `Bearer ${billingToken}` };

    // Step 2: Register a new patient
    console.log('2. Registering new patient...');
    const patientData = {
      name: 'Test Patient Radiology',
      type: 'REGULAR',
      dob: '1990-01-01',
      gender: 'MALE',
      mobile: '0912345678',
      email: 'test@example.com',
      address: 'Test Address',
      emergencyContact: 'Emergency Contact - 0918765432',
      bloodType: 'O_PLUS',
      insuranceId: null
    };

    const patientResponse = await axios.post(`${BASE_URL}/billing/register`, patientData, { headers: billingHeaders });
    const patientId = patientResponse.data.patient.id;
    const visitId = patientResponse.data.visit.id;
    const billingId = patientResponse.data.billing.id;

    console.log(`✅ Patient registered: ${patientId}`);
    console.log(`✅ Visit created: ${visitId}`);
    console.log(`✅ Billing created: ${billingId}`);

    // Step 3: Pay entry fee
    console.log('3. Paying entry fee...');
    await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: billingId,
      amount: 200,
      type: 'CASH',
      notes: 'Entry fee payment'
    }, { headers: billingHeaders });
    console.log('✅ Entry fee paid');

    // Step 4: Login as nurse
    console.log('4. Logging in as nurse...');
    const nurseLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'nurse1',
      password: 'nurse123'
    });
    const nurseToken = nurseLogin.data.token;
    const nurseHeaders = { Authorization: `Bearer ${nurseToken}` };

    // Step 5: Record vitals
    console.log('5. Recording vitals...');
    const vitalsResponse = await axios.post(`${BASE_URL}/nurses/vitals`, {
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
    }, { headers: nurseHeaders });
    console.log('✅ Vitals recorded');

    // Step 6: Assign doctor
    console.log('6. Assigning doctor...');
    const doctorId = '237cac83-372f-4378-916b-cd2494f06f33'; // doctor1
    await axios.post(`${BASE_URL}/nurses/assignments`, {
      patientId: patientId,
      visitId: visitId,
      doctorId: doctorId
    }, { headers: nurseHeaders });
    console.log('✅ Doctor assigned');

    // Step 7: Pay consultation fee
    console.log('7. Paying consultation fee...');
    const consultationBilling = await axios.get(`${BASE_URL}/billing?visitId=${visitId}`, { headers: billingHeaders });
    const consultationBillId = consultationBilling.data.billings.find(b => b.services.some(s => s.service.code === 'CONS001')).id;
    
    await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: consultationBillId,
      amount: 500,
      type: 'CASH',
      notes: 'Consultation fee payment'
    }, { headers: billingHeaders });
    console.log('✅ Consultation fee paid');

    // Step 8: Login as doctor
    console.log('8. Logging in as doctor...');
    const doctorLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'doctor1',
      password: 'doctor123'
    });
    const doctorToken = doctorLogin.data.token;
    const doctorHeaders = { Authorization: `Bearer ${doctorToken}` };

    // Step 9: Select patient
    console.log('9. Doctor selecting patient...');
    await axios.post(`${BASE_URL}/doctors/select`, {
      visitId: visitId
    }, { headers: doctorHeaders });
    console.log('✅ Patient selected by doctor');

    // Step 10: Order radiology tests
    console.log('10. Ordering radiology tests...');
    const radiologyOrder = await axios.post(`${BASE_URL}/doctors/radiology-orders/multiple`, {
      visitId: visitId,
      patientId: patientId,
      orders: [
        { typeId: 31, instructions: 'CT Scan - Abdomen' },
        { typeId: 27, instructions: 'Chest X-Ray' }
      ]
    }, { headers: doctorHeaders });
    console.log('✅ Radiology tests ordered');

    // Step 11: Pay for radiology tests
    console.log('11. Paying for radiology tests...');
    const radiologyBilling = await axios.get(`${BASE_URL}/billing?visitId=${visitId}`, { headers: billingHeaders });
    const radiologyBillId = radiologyBilling.data.billings.find(b => 
      b.services.some(s => s.service.code === 'RAD001' || s.service.code === 'RAD002')
    ).id;
    
    await axios.post(`${BASE_URL}/billing/payments`, {
      billingId: radiologyBillId,
      amount: 2300, // CT Scan + Chest X-Ray
      type: 'CASH',
      notes: 'Radiology tests payment'
    }, { headers: billingHeaders });
    console.log('✅ Radiology tests paid');

    // Step 12: Login as radiology technician
    console.log('12. Logging in as radiology technician...');
    const radiologyLogin = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'radiology1',
      password: 'radiology123'
    });
    const radiologyToken = radiologyLogin.data.token;
    const radiologyHeaders = { Authorization: `Bearer ${radiologyToken}` };

    // Step 13: Get radiology orders
    console.log('13. Getting radiology orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/radiologies/orders`, { headers: radiologyHeaders });
    const batchOrder = ordersResponse.data.batchOrders.find(order => order.visitId === visitId);
    
    if (batchOrder) {
      console.log(`✅ Found batch order: ${batchOrder.id} (Status: ${batchOrder.status})`);
      
      // Step 14: Submit results for each test
      console.log('14. Submitting radiology results...');
      for (const service of batchOrder.services) {
        if (service.investigationType?.category === 'RADIOLOGY') {
          console.log(`   Submitting result for: ${service.investigationType.name}`);
          
          try {
            const resultResponse = await axios.post(`${BASE_URL}/radiologies/batch-orders/${batchOrder.id}/results`, {
              testTypeId: service.investigationType.id,
              resultText: `Radiology report for ${service.investigationType.name}`,
              additionalNotes: 'No abnormalities detected'
            }, { headers: radiologyHeaders });
            
            console.log(`   ✅ Result submitted for ${service.investigationType.name}`);
          } catch (error) {
            if (error.response?.data?.error?.includes('already exists')) {
              console.log(`   ✅ Result already exists for ${service.investigationType.name}`);
            } else {
              console.log(`   ❌ Error submitting result for ${service.investigationType.name}:`, error.response?.data?.error);
            }
          }
        }
      }
    }

    // Step 15: Check doctor's results queue
    console.log('15. Checking doctor results queue...');
    try {
      const resultsQueue = await axios.get(`${BASE_URL}/doctors/results-queue`, { headers: doctorHeaders });
      const patientInQueue = resultsQueue.data.visits?.find(v => v.id === visitId);
      
      if (patientInQueue) {
        console.log('✅ Patient found in doctor results queue!');
        console.log(`   Status: ${patientInQueue.status}`);
        console.log(`   Queue Type: ${patientInQueue.queueType}`);
      } else {
        console.log('❌ Patient not found in doctor results queue');
        console.log('   Available visits in results queue:', resultsQueue.data.visits?.length || 0);
      }
    } catch (error) {
      console.log('❌ Error checking results queue:', error.response?.data?.error || error.message);
    }

    console.log('\n🎉 Complete workflow test finished!');
    console.log(`Patient ID: ${patientId}`);
    console.log(`Visit ID: ${visitId}`);
    console.log('You can now test the frontend with this patient.');

  } catch (error) {
    console.error('❌ Error in workflow test:', error.response?.data || error.message);
  }
}

testCompleteWorkflow();
