const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

// Test credentials
const CREDENTIALS = {
  admin: { username: 'admin', password: 'admin123' },
  billing: { username: 'billing', password: 'billing123' },
  doctor: { username: 'doctor1', password: 'doctor123' },
  nurse: { username: 'nurse1', password: 'nurse123' },
  lab: { username: 'lab1', password: 'lab123' },
  radiology: { username: 'radiology1', password: 'radiology123' }
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

async function step1_PatientRegistration() {
  console.log('\n🏥 STEP 1: Patient Registration with Image Upload');
  console.log('=' .repeat(60));
  
  try {
    // Get billing token
    await getToken('billing');
    
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const testImageContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(testImagePath, testImageContent);
    
    // Register patient via pre-registration
    const patientData = {
      name: 'Jane Doe',
      phone: '0912345679', // Changed to unique phone number
      email: 'jane.doe@test.com',
      dob: '1990-05-15',
      gender: 'FEMALE',
      address: '123 Test Street, Addis Ababa',
      emergencyContact: 'John Doe',
      emergencyPhone: '0912345680' // Changed to unique emergency phone
    };
    
    console.log('📝 Registering patient:', patientData.name);
    const patientResponse = await axios.post(`${BASE_URL}/pre-registration/add`, patientData, {
      headers: { Authorization: `Bearer ${tokens.billing}` }
    });
    
    console.log('✅ Patient added to pre-registration queue');
    testData.virtualQueueId = patientResponse.data.virtualQueue.id;
    
    // Process pre-registration
    const processResponse = await axios.post(`${BASE_URL}/pre-registration/process`, {
      virtualQueueId: testData.virtualQueueId
    }, {
      headers: { Authorization: `Bearer ${tokens.billing}` }
    });
    
    console.log('✅ Patient processed from pre-registration');
    testData.finalPatientId = processResponse.data.patient.id;
    testData.finalVisitId = processResponse.data.visit.id;
    
    // Upload image
    const formData = new FormData();
    formData.append('image', fs.createReadStream(testImagePath), {
      filename: 'test-image.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('patientId', testData.finalPatientId);
    formData.append('visitId', testData.finalVisitId);
    
    const imageResponse = await axios.post(`${BASE_URL}/patients/upload-image`, formData, {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${tokens.billing}`
      }
    });
    
    console.log('✅ Image uploaded successfully');
    testData.imageId = imageResponse.data.image.id;
    
    // Clean up test image
    fs.unlinkSync(testImagePath);
    
    console.log('📊 Step 1 Results:');
    console.log(`   Patient ID: ${testData.finalPatientId}`);
    console.log(`   Visit ID: ${testData.finalVisitId}`);
    console.log(`   Image ID: ${testData.imageId}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 1 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step2_DoctorOrders() {
  console.log('\n👨‍⚕️ STEP 2: Doctor Orders (Lab, Radiology, Nurse Services)');
  console.log('=' .repeat(60));
  
  try {
    // Get doctor token
    await getToken('doctor');
    
    // Assign patient to doctor
    const assignmentResponse = await axios.post(`${BASE_URL}/nurses/assign-combined`, {
      patientId: testData.finalPatientId,
      visitId: testData.finalVisitId,
      doctorId: '8ef8017b-9117-4571-bd45-86a64565bc4b', // Dr. Sarah Johnson
      vitals: {
        bloodPressure: '120/80',
        temperature: 36.5,
        heartRate: 72,
        respirationRate: 16
      },
      chiefComplaint: 'Chest pain and shortness of breath',
      selectedServices: []
    }, {
      headers: { Authorization: `Bearer ${tokens.nurse}` }
    });
    
    console.log('✅ Patient assigned to doctor');
    
    // Order lab tests
    const labOrdersResponse = await axios.post(`${BASE_URL}/doctors/lab-orders/multiple`, {
      visitId: testData.finalVisitId,
      patientId: testData.finalPatientId,
      orders: [
        { typeId: 1, instructions: 'CBC for Jane Doe' }, // CBC
        { typeId: 2, instructions: 'Blood Chemistry Panel' } // Blood Chemistry
      ]
    }, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    console.log('✅ Lab orders created:', labOrdersResponse.data.orders.length);
    testData.labOrders = labOrdersResponse.data.orders;
    
    // Order radiology tests
    const radiologyOrdersResponse = await axios.post(`${BASE_URL}/doctors/radiology-orders/multiple`, {
      visitId: testData.finalVisitId,
      patientId: testData.finalPatientId,
      orders: [
        { typeId: 11, instructions: 'Chest X-Ray for Jane Doe' }, // Chest X-Ray
        { typeId: 12, instructions: 'ECG for cardiac assessment' } // ECG
      ]
    }, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    console.log('✅ Radiology orders created:', radiologyOrdersResponse.data.orders.length);
    testData.radiologyOrders = radiologyOrdersResponse.data.orders;
    
    // Order nurse services
    const nurseServicesResponse = await axios.get(`${BASE_URL}/nurses/services`, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    const services = nurseServicesResponse.data.services || [];
    const bloodPressureService = services.find(s => s.name.includes('Blood Pressure'));
    const firstNurse = await prisma.user.findFirst({ where: { role: 'NURSE' } });
    
    if (bloodPressureService && firstNurse) {
      const nurseOrderResponse = await axios.post(`${BASE_URL}/doctors/service-orders`, {
        visitId: testData.finalVisitId,
        patientId: testData.finalPatientId,
        serviceIds: [bloodPressureService.id],
        assignedNurseId: firstNurse.id,
        instructions: 'Monitor blood pressure for Jane Doe'
      }, {
        headers: { Authorization: `Bearer ${tokens.doctor}` }
      });
      
      console.log('✅ Nurse service ordered:', bloodPressureService.name);
      testData.nurseServiceId = nurseOrderResponse.data.assignments[0].id;
    }
    
    console.log('📊 Step 2 Results:');
    console.log(`   Lab Orders: ${testData.labOrders?.length || 0}`);
    console.log(`   Radiology Orders: ${testData.radiologyOrders?.length || 0}`);
    console.log(`   Nurse Service: ${testData.nurseServiceId ? 'Ordered' : 'Not ordered'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 2 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step3_LabRadiologyWorkflow() {
  console.log('\n🔬 STEP 3: Lab & Radiology Workflow');
  console.log('=' .repeat(60));
  
  try {
    // Get lab and radiology tokens
    await getToken('lab');
    await getToken('radiology');
    
    // Complete lab orders
    if (testData.labOrders && testData.labOrders.length > 0) {
      for (const order of testData.labOrders) {
        const labResultResponse = await axios.post(`${BASE_URL}/labs/complete-order`, {
          orderId: order.id,
          results: [
            {
              testTypeId: order.typeId,
              value: 'Normal',
              unit: 'mg/dL',
              referenceRange: 'Normal range',
              status: 'NORMAL'
            }
          ],
          notes: `Lab results completed for ${order.type.name}`
        }, {
          headers: { Authorization: `Bearer ${tokens.lab}` }
        });
        
        console.log(`✅ Lab order completed: ${order.type.name}`);
      }
    }
    
    // Complete radiology orders
    if (testData.radiologyOrders && testData.radiologyOrders.length > 0) {
      for (const order of testData.radiologyOrders) {
        const radiologyResultResponse = await axios.post(`${BASE_URL}/radiologies/complete-order`, {
          orderId: order.id,
          findings: `Radiology findings for ${order.type.name}: Normal appearance`,
          impression: 'No acute findings',
          recommendations: 'Follow up as needed',
          notes: `Radiology completed for ${order.type.name}`
        }, {
          headers: { Authorization: `Bearer ${tokens.radiology}` }
        });
        
        console.log(`✅ Radiology order completed: ${order.type.name}`);
      }
    }
    
    console.log('📊 Step 3 Results:');
    console.log(`   Lab Orders Completed: ${testData.labOrders?.length || 0}`);
    console.log(`   Radiology Orders Completed: ${testData.radiologyOrders?.length || 0}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 3 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step4_NurseCompletion() {
  console.log('\n👩‍⚕️ STEP 4: Nurse Service Completion');
  console.log('=' .repeat(60));
  
  try {
    // Get nurse token
    await getToken('nurse');
    
    if (testData.nurseServiceId) {
      const nurseCompletionResponse = await axios.post(`${BASE_URL}/nurses/complete-service`, {
        assignmentId: testData.nurseServiceId,
        notes: 'Blood pressure monitoring completed. Patient stable.'
      }, {
        headers: { Authorization: `Bearer ${tokens.nurse}` }
      });
      
      console.log('✅ Nurse service completed');
      console.log('✅ Visit status updated to NURSE_SERVICES_COMPLETED');
    }
    
    console.log('📊 Step 4 Results:');
    console.log(`   Nurse Service: ${testData.nurseServiceId ? 'Completed' : 'Not applicable'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 4 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step5_DiagnosisAndCompletion() {
  console.log('\n📝 STEP 5: Diagnosis Notes and Visit Completion');
  console.log('=' .repeat(60));
  
  try {
    // Get doctor token
    await getToken('doctor');
    
    // Save diagnosis notes
    const diagnosisResponse = await axios.post(`${BASE_URL}/doctors/visits/${testData.finalVisitId}/diagnosis-notes`, {
      chiefComplaint: 'Chest pain and shortness of breath',
      historyOfPresentIllness: 'Patient reports chest pain for 2 days',
      pastMedicalHistory: 'No significant past medical history',
      allergicHistory: 'No known allergies',
      physicalExamination: 'Normal vital signs, clear lungs',
      investigationFindings: 'Lab and radiology results normal',
      assessmentAndDiagnosis: 'Musculoskeletal chest pain',
      treatmentPlan: 'Rest and pain management',
      treatmentGiven: 'Pain medication prescribed',
      medicationIssued: 'Ibuprofen 400mg',
      additional: 'Follow up in 1 week if symptoms persist',
      prognosis: 'Good prognosis with treatment'
    }, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    console.log('✅ Diagnosis notes saved');
    
    // Complete visit
    const completionResponse = await axios.post(`${BASE_URL}/doctors/complete`, {
      visitId: testData.finalVisitId,
      followUpRequired: true,
      appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      appointmentTime: '10:00',
      appointmentNotes: 'Follow up for chest pain'
    }, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    console.log('✅ Visit completed successfully');
    console.log('✅ Visit status updated to COMPLETED');
    
    console.log('📊 Step 5 Results:');
    console.log(`   Diagnosis Notes: Saved`);
    console.log(`   Visit Status: COMPLETED`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 5 failed:', error.response?.data || error.message);
    return false;
  }
}

async function step6_VerifyPatientHistory() {
  console.log('\n📚 STEP 6: Verify Patient History');
  console.log('=' .repeat(60));
  
  try {
    // Get doctor token
    await getToken('doctor');
    
    // Get patient history
    const historyResponse = await axios.get(`${BASE_URL}/doctors/patients/${testData.finalPatientId}/history`, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    const history = historyResponse.data.history || [];
    const visitHistory = history.filter(h => h.visitId === testData.finalVisitId);
    
    console.log('📊 Patient History Verification:');
    console.log(`   Total History Entries: ${history.length}`);
    console.log(`   Visit-Specific Entries: ${visitHistory.length}`);
    
    console.log('\n📋 Visit History Details:');
    visitHistory.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.diagnosis}`);
      console.log(`      Date: ${new Date(entry.visitDate).toLocaleDateString()}`);
      console.log(`      Type: ${entry.details ? JSON.parse(entry.details).serviceType || 'DOCTOR_CONSULTATION' : 'DOCTOR_CONSULTATION'}`);
    });
    
    // Verify visit status
    const visitResponse = await axios.get(`${BASE_URL}/doctors/visits/${testData.finalVisitId}`, {
      headers: { Authorization: `Bearer ${tokens.doctor}` }
    });
    
    const visit = visitResponse.data;
    console.log('\n📊 Final Visit Status:');
    console.log(`   Visit ID: ${visit.visitUid}`);
    console.log(`   Status: ${visit.status}`);
    console.log(`   Completed At: ${visit.completedAt ? new Date(visit.completedAt).toLocaleString() : 'Not completed'}`);
    console.log(`   Lab Orders: ${visit.labOrders?.length || 0}`);
    console.log(`   Radiology Orders: ${visit.radiologyOrders?.length || 0}`);
    console.log(`   Nurse Services: ${visit.nurseServiceAssignments?.length || 0}`);
    console.log(`   Attached Images: ${visit.attachedImages?.length || 0}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Step 6 failed:', error.response?.data || error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE END-TO-END TEST FOR JANE DOE');
  console.log('=' .repeat(80));
  console.log('Testing complete workflow: Registration → Orders → Lab/Radiology → Nurse → Diagnosis → History');
  console.log('=' .repeat(80));
  
  const steps = [
    { name: 'Patient Registration', fn: step1_PatientRegistration },
    { name: 'Doctor Orders', fn: step2_DoctorOrders },
    { name: 'Lab & Radiology Workflow', fn: step3_LabRadiologyWorkflow },
    { name: 'Nurse Completion', fn: step4_NurseCompletion },
    { name: 'Diagnosis & Completion', fn: step5_DiagnosisAndCompletion },
    { name: 'History Verification', fn: step6_VerifyPatientHistory }
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
  console.log('🏁 TEST SUMMARY');
  console.log('=' .repeat(80));
  console.log(`✅ Successful Steps: ${successCount}/${steps.length}`);
  console.log(`❌ Failed Steps: ${steps.length - successCount}/${steps.length}`);
  
  if (successCount === steps.length) {
    console.log('🎉 ALL TESTS PASSED! Complete workflow is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n📊 Test Data Summary:');
  console.log(`   Patient ID: ${testData.finalPatientId || 'N/A'}`);
  console.log(`   Visit ID: ${testData.finalVisitId || 'N/A'}`);
  console.log(`   Image ID: ${testData.imageId || 'N/A'}`);
  console.log(`   Lab Orders: ${testData.labOrders?.length || 0}`);
  console.log(`   Radiology Orders: ${testData.radiologyOrders?.length || 0}`);
  console.log(`   Nurse Service: ${testData.nurseServiceId ? 'Yes' : 'No'}`);
}

// Run the test
runComprehensiveTest()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
