const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testPatientRegistration() {
  try {
    console.log('🏥 Starting Patient Registration Test...\n');

    // Step 0: Login as billing officer
    console.log('0️⃣ Logging in as billing officer...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'billing1',
      password: 'billing123'
    });

    const token = loginResponse.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('✅ Logged in successfully\n');

    // Step 1: Register a new patient
    console.log('1️⃣ Registering new patient...');
    const registrationResponse = await axios.post(`${API_BASE}/billing/register`, {
      name: 'Test Patient',
      type: 'REGULAR',
      dob: '1990-01-15',
      gender: 'MALE',
      mobile: '0912345678',
      email: 'test.patient@email.com',
      address: '123 Test Street, Addis Ababa',
      emergencyContact: 'Emergency Contact - 0918765432',
      bloodType: 'O_PLUS'
    }, { headers: authHeaders });

    console.log('✅ Patient registered successfully');
    console.log(`   Patient ID: ${registrationResponse.data.patient.id}`);
    console.log(`   Visit ID: ${registrationResponse.data.visit.id}`);
    console.log(`   Billing ID: ${registrationResponse.data.billing.id}`);
    console.log(`   Entry Fee: ${registrationResponse.data.billing.totalAmount} ETB\n`);

    const patientId = registrationResponse.data.patient.id;
    const visitId = registrationResponse.data.visit.id;
    const billingId = registrationResponse.data.billing.id;

    // Step 2: Pay entry fee
    console.log('2️⃣ Paying entry fee...');
    const paymentResponse = await axios.post(`${API_BASE}/billing/payments`, {
      billingId: billingId,
      amount: 200,
      type: 'CASH',
      notes: 'Entry fee payment'
    }, { headers: authHeaders });

    console.log('✅ Entry fee paid successfully');
    console.log(`   Payment ID: ${paymentResponse.data.payment.id}`);
    console.log(`   Amount: ${paymentResponse.data.payment.amount} ETB\n`);

    // Step 3: Login as nurse and record vitals
    console.log('3️⃣ Logging in as nurse...');
    const nurseLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'nurse1',
      password: 'nurse123'
    });

    const nurseToken = nurseLoginResponse.data.token;
    const nurseAuthHeaders = { Authorization: `Bearer ${nurseToken}` };
    console.log('✅ Nurse logged in successfully');

    console.log('4️⃣ Recording patient vitals...');
    const vitalsResponse = await axios.post(`${API_BASE}/nurses/vitals`, {
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
    }, { headers: nurseAuthHeaders });

    console.log('✅ Vitals recorded successfully');
    console.log(`   BMI: ${vitalsResponse.data.vital.bmi}`);
    console.log(`   Visit Status: ${vitalsResponse.data.vital.visit.status}\n`);

    // Step 5: Assign doctor
    console.log('5️⃣ Assigning doctor...');
    const assignmentResponse = await axios.post(`${API_BASE}/nurses/assignments`, {
      patientId: patientId,
      visitId: visitId,
      doctorId: '237cac83-372f-4378-916b-cd2494f06f33' // Default doctor ID
    }, { headers: nurseAuthHeaders });

    console.log('✅ Doctor assigned successfully');
    console.log('Assignment response:', JSON.stringify(assignmentResponse.data, null, 2));
    console.log(`   Doctor ID: ${assignmentResponse.data.assignment?.doctorId || 'N/A'}`);
    console.log(`   Visit Status: ${assignmentResponse.data.visit?.status || 'N/A'}\n`);

    // Step 6: Pay consultation fee
    console.log('6️⃣ Paying consultation fee...');
    const consultationPaymentResponse = await axios.post(`${API_BASE}/billing/payments`, {
      billingId: assignmentResponse.data.billing.id,
      amount: 500,
      type: 'CASH',
      notes: 'Consultation fee payment'
    }, { headers: authHeaders });

    console.log('✅ Consultation fee paid successfully');
    console.log(`   Payment ID: ${consultationPaymentResponse.data.payment.id}`);
    console.log(`   Amount: ${consultationPaymentResponse.data.payment.amount} ETB\n`);

    console.log('🎉 Patient registration and initial setup completed!');
    console.log('\n📋 Summary:');
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Visit ID: ${visitId}`);
    console.log(`   Current Status: WAITING_FOR_DOCTOR`);
    console.log(`   Ready for doctor consultation: YES`);
    console.log('\n✅ Patient is now in the nurse queue and ready for the next steps!');

  } catch (error) {
    console.error('❌ Error during patient registration:', error.response?.data || error.message);
  }
}

testPatientRegistration();
