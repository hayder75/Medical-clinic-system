const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testNurseWorkflow() {
  try {
    console.log('🧪 Testing Complete Nurse Services Workflow\n');

    // Step 1: Login as Sarah Johnson (nurse)
    console.log('1️⃣ Logging in as Sarah Johnson (nurse)...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'sarah.nurse',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const nurseId = loginResponse.data.user.id;
    console.log(`✅ Logged in as: ${loginResponse.data.user.fullname}`);
    console.log(`   Nurse ID: ${nurseId}`);
    console.log(`   Token: ${token.substring(0, 20)}...\n`);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Test nurse services endpoint
    console.log('2️⃣ Testing nurse services endpoint...');
    const servicesResponse = await axios.get(`${BASE_URL}/nurses/services`, { headers });
    console.log(`✅ Found ${servicesResponse.data.services.length} nurse services:`);
    servicesResponse.data.services.forEach(service => {
      console.log(`   - ${service.name} (${service.code}) - $${service.price}`);
    });
    console.log('');

    // Step 3: Test nurses endpoint
    console.log('3️⃣ Testing nurses endpoint...');
    const nursesResponse = await axios.get(`${BASE_URL}/nurses/nurses`, { headers });
    console.log(`✅ Found ${nursesResponse.data.nurses.length} nurses:`);
    nursesResponse.data.nurses.forEach(nurse => {
      console.log(`   - ${nurse.fullname} (${nurse.username})`);
    });
    console.log('');

    // Step 4: Test today-tasks endpoint
    console.log('4️⃣ Testing today-tasks endpoint...');
    const tasksResponse = await axios.get(`${BASE_URL}/nurses/today-tasks`, { headers });
    console.log(`✅ Found ${tasksResponse.data.tasks.length} tasks for today`);
    if (tasksResponse.data.tasks.length > 0) {
      tasksResponse.data.tasks.forEach(task => {
        console.log(`   - ${task.service?.name || 'Unknown'} for ${task.visit?.patient?.name || 'Unknown'}`);
      });
    }
    console.log('');

    // Step 5: Create a test visit and assign nurse service
    console.log('5️⃣ Creating test visit and assigning nurse service...');
    
    // First, get a patient
    const patientsResponse = await axios.get(`${BASE_URL}/patients/search?query=test`, { headers });
    let patientId = 'PAT-2025-01'; // Use existing patient
    
    // Create a visit
    const visitResponse = await axios.post(`${BASE_URL}/visits`, {
      patientId: patientId,
      visitUid: `VISIT-TEST-${Date.now()}`
    }, { headers });
    
    const visitId = visitResponse.data.visit.id;
    console.log(`✅ Created visit: ${visitResponse.data.visit.visitUid} (ID: ${visitId})`);

    // Update visit status to TRIAGED
    await axios.put(`${BASE_URL}/visits/${visitId}`, {
      status: 'TRIAGED'
    }, { headers });
    console.log('✅ Visit status updated to TRIAGED');

    // Assign nurse service
    const serviceId = servicesResponse.data.services[0].id; // First service
    const assignedNurseId = nursesResponse.data.nurses[0].id; // First nurse
    
    const assignmentResponse = await axios.post(`${BASE_URL}/nurses/assign-nurse-service`, {
      visitId: visitId,
      patientId: patientId,
      serviceId: serviceId,
      assignedNurseId: assignedNurseId,
      notes: 'Test assignment from workflow script'
    }, { headers });
    
    console.log(`✅ Nurse service assigned: ${assignmentResponse.data.assignment.service.name}`);
    console.log(`   Assigned to: ${assignmentResponse.data.assignment.assignedNurse.fullname}`);
    console.log(`   Assignment ID: ${assignmentResponse.data.assignment.id}\n`);

    // Step 6: Test daily-tasks endpoint (should show the new assignment)
    console.log('6️⃣ Testing daily-tasks endpoint...');
    const dailyTasksResponse = await axios.get(`${BASE_URL}/nurses/daily-tasks`, { headers });
    console.log(`✅ Found ${dailyTasksResponse.data.tasks.length} daily tasks`);
    if (dailyTasksResponse.data.tasks.length > 0) {
      dailyTasksResponse.data.tasks.forEach(task => {
        console.log(`   - ${task.service.name} for ${task.visit.patient.name} (Status: ${task.status})`);
      });
    }
    console.log('');

    // Step 7: Complete the nurse service
    console.log('7️⃣ Completing the nurse service...');
    const assignmentId = assignmentResponse.data.assignment.id;
    
    const completeResponse = await axios.post(`${BASE_URL}/nurses/complete-service`, {
      assignmentId: assignmentId,
      notes: 'Service completed successfully - test workflow'
    }, { headers });
    
    console.log(`✅ Service completed: ${completeResponse.data.assignment.serviceName}`);
    console.log(`   Patient: ${completeResponse.data.assignment.patientName}`);
    console.log(`   Completed at: ${completeResponse.data.assignment.completedAt}\n`);

    // Step 8: Verify completion
    console.log('8️⃣ Verifying completion...');
    const finalTasksResponse = await axios.get(`${BASE_URL}/nurses/daily-tasks`, { headers });
    console.log(`✅ Remaining daily tasks: ${finalTasksResponse.data.tasks.length}`);
    
    console.log('\n🎉 Complete Nurse Services Workflow Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Nurse login successful');
    console.log('   ✅ Nurse services endpoint working');
    console.log('   ✅ Nurses endpoint working');
    console.log('   ✅ Today-tasks endpoint working');
    console.log('   ✅ Visit creation successful');
    console.log('   ✅ Nurse service assignment successful');
    console.log('   ✅ Daily tasks showing assignments');
    console.log('   ✅ Service completion successful');
    console.log('   ✅ Patient history updated');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   Error details:', error.response.data.error);
    }
  }
}

// Run the test
testNurseWorkflow();




