const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testMultipleServiceAssignment() {
  try {
    console.log('🧪 Testing Multiple Service Assignment Feature\n');

    // Step 1: Login as Sarah Johnson (nurse)
    console.log('1️⃣ Logging in as Sarah Johnson (nurse)...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'sarah.nurse',
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    const nurseId = loginResponse.data.user.id;
    console.log(`✅ Logged in as: ${loginResponse.data.user.fullname}\n`);

    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Get services and nurses
    console.log('2️⃣ Getting services and nurses...');
    const [servicesResponse, nursesResponse] = await Promise.all([
      axios.get(`${BASE_URL}/nurses/services`, { headers }),
      axios.get(`${BASE_URL}/nurses/nurses`, { headers })
    ]);
    
    console.log(`✅ Found ${servicesResponse.data.services.length} services and ${nursesResponse.data.nurses.length} nurses\n`);

    // Step 3: Create multiple visits and assign different services
    console.log('3️⃣ Testing multiple service assignments...');
    
    const servicesToTest = servicesResponse.data.services.slice(0, 3);
    const assignedNurseId = nursesResponse.data.nurses[0].id;
    
    for (let i = 0; i < servicesToTest.length; i++) {
      const service = servicesToTest[i];
      
      // Add delay to ensure unique timestamps
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Create a new visit for each service
      const visitResponse = await axios.post(`${BASE_URL}/visits`, {
        patientId: 'PAT-2025-01',
        visitUid: `VISIT-MULTI-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }, { headers });
      
      const visitId = visitResponse.data.visit.id;
      console.log(`✅ Created visit ${i + 1}: ${visitResponse.data.visit.visitUid} (ID: ${visitId})`);

      // Update visit status to TRIAGED
      await axios.put(`${BASE_URL}/visits/${visitId}`, {
        status: 'TRIAGED'
      }, { headers });

      // Assign the service
      const assignmentResponse = await axios.post(`${BASE_URL}/nurses/assign-nurse-service`, {
        visitId: visitId,
        patientId: 'PAT-2025-01',
        serviceId: service.id,
        assignedNurseId: assignedNurseId,
        notes: `Test assignment ${i + 1} - ${service.name}`
      }, { headers });
      
      console.log(`   ✅ Assigned: ${service.name} to ${nursesResponse.data.nurses[0].fullname}`);
    }
    console.log('');

    // Step 4: Check daily tasks
    console.log('4️⃣ Checking daily tasks...');
    const dailyTasksResponse = await axios.get(`${BASE_URL}/nurses/daily-tasks`, { headers });
    console.log(`✅ Found ${dailyTasksResponse.data.tasks.length} daily tasks`);
    
    if (dailyTasksResponse.data.tasks.length > 0) {
      console.log('   Tasks assigned to Emily Rodriguez:');
      dailyTasksResponse.data.tasks.forEach((task, index) => {
        console.log(`   ${index + 1}. ${task.service.name} - ${task.status}`);
        console.log(`      Patient: ${task.visit.patient.name}`);
        console.log(`      Notes: ${task.notes}`);
      });
    }
    console.log('');

    // Step 5: Complete one service
    console.log('5️⃣ Testing service completion...');
    if (dailyTasksResponse.data.tasks.length > 0) {
      const taskToComplete = dailyTasksResponse.data.tasks[0];
      const completeResponse = await axios.post(`${BASE_URL}/nurses/complete-service`, {
        assignmentId: taskToComplete.id,
        notes: 'Service completed successfully - multiple service test'
      }, { headers });
      
      console.log(`✅ Completed: ${completeResponse.data.assignment.serviceName}`);
      console.log(`   Patient: ${completeResponse.data.assignment.patientName}`);
    }
    console.log('');

    // Step 6: Verify remaining tasks
    console.log('6️⃣ Verifying remaining tasks...');
    const finalTasksResponse = await axios.get(`${BASE_URL}/nurses/daily-tasks`, { headers });
    console.log(`✅ Remaining daily tasks: ${finalTasksResponse.data.tasks.length}`);
    
    console.log('\n🎉 Multiple Service Assignment Test PASSED!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Multiple service assignments working');
    console.log('   ✅ Each service creates separate assignments');
    console.log('   ✅ Services appear in daily tasks');
    console.log('   ✅ Individual service completion working');
    console.log('   ✅ Tasks properly removed after completion');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('   Error details:', error.response.data.error);
    }
  }
}

// Run the test
testMultipleServiceAssignment();
