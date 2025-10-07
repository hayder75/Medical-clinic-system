const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

// Test medication search API
async function testMedicationSearch() {
  try {
    console.log('🔍 Testing medication search API...');
    
    const response = await axios.get(`${API_BASE_URL}/medications/search?query=para&limit=10`);
    
    console.log('✅ Medication search successful:');
    console.log(`Found ${response.data.medications.length} medications`);
    response.data.medications.forEach(med => {
      console.log(`- ${med.name} ${med.strength} - ETB ${med.unitPrice}`);
    });
    
    return response.data.medications;
  } catch (error) {
    console.error('❌ Medication search failed:', error.response?.data || error.message);
    return null;
  }
}

// Test medication categories API
async function testMedicationCategories() {
  try {
    console.log('\n🔍 Testing medication categories API...');
    
    const response = await axios.get(`${API_BASE_URL}/medications/categories/list`);
    
    console.log('✅ Medication categories successful:');
    console.log('Categories:', response.data.categories);
    
    return response.data.categories;
  } catch (error) {
    console.error('❌ Medication categories failed:', error.response?.data || error.message);
    return null;
  }
}

// Test prescription submission (without auth for now)
async function testPrescriptionSubmission() {
  try {
    console.log('\n🔍 Testing prescription submission API...');
    
    const testData = {
      visitId: 1,
      patientId: 'PAT-2024-001',
      medications: [
        {
          name: 'Paracetamol',
          dosageForm: 'Tablet',
          strength: '500mg',
          quantity: 10,
          frequency: 'Twice daily',
          duration: '5 days',
          instructions: 'Take with food',
          unitPrice: 2.50
        }
      ]
    };
    
    const response = await axios.post(`${API_BASE_URL}/doctors/prescriptions/batch`, testData);
    
    console.log('✅ Prescription submission successful:');
    console.log('Response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Prescription submission failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting medication API tests...\n');
  
  const medications = await testMedicationSearch();
  const categories = await testMedicationCategories();
  const prescription = await testPrescriptionSubmission();
  
  console.log('\n📊 Test Summary:');
  console.log(`Medication Search: ${medications ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Medication Categories: ${categories ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Prescription Submission: ${prescription ? '✅ PASS' : '❌ FAIL'}`);
  
  if (medications && categories) {
    console.log('\n🎉 Medication catalog is working correctly!');
    console.log('The frontend should be able to search and display medications.');
  } else {
    console.log('\n⚠️  There are issues with the medication catalog.');
    console.log('Check the database connection and medication data.');
  }
}

runTests().catch(console.error);
