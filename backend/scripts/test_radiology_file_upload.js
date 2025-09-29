const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000/api';

// Test radiology file upload
async function testRadiologyFileUpload() {
  try {
    console.log('🚀 Testing Radiology File Upload...\n');

    // Login as radiology technician
    console.log('1. Logging in as radiology technician...');
    const radiologyLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'radiology1',
      password: 'radiology123'
    });
    const radiologyToken = radiologyLoginResponse.data.token;
    console.log('✅ Radiology technician login successful\n');

    // Get radiology orders
    console.log('2. Getting radiology orders...');
    const ordersResponse = await axios.get(`${BASE_URL}/radiologies/orders`, {
      headers: { Authorization: `Bearer ${radiologyToken}` }
    });
    const radiologyOrder = ordersResponse.data.batchOrders.find(order => order.status === 'QUEUED');
    
    if (!radiologyOrder) {
      console.log('❌ No queued radiology orders found');
      return;
    }
    
    console.log(`✅ Found radiology order: ${radiologyOrder.id}\n`);

    // Create a test result first
    console.log('3. Creating test result...');
    const resultResponse = await axios.post(`${BASE_URL}/radiologies/batch-orders/${radiologyOrder.id}/results`, {
      testTypeId: 29, // CT Scan - Head
      resultText: 'Test result for CT Scan - Head shows no abnormalities.',
      additionalNotes: 'Test notes for CT Scan'
    }, {
      headers: { Authorization: `Bearer ${radiologyToken}` }
    });
    
    const resultId = resultResponse.data.radiologyResult.id;
    console.log(`✅ Test result created: ${resultId}\n`);

    // Create a test file
    console.log('4. Creating test file...');
    const testFilePath = '/tmp/test_radiology_file.txt';
    fs.writeFileSync(testFilePath, 'This is a test radiology file content.');
    console.log('✅ Test file created\n');

    // Upload file
    console.log('5. Uploading file...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath), {
      filename: 'test_radiology_file.txt',
      contentType: 'text/plain'
    });

    const uploadResponse = await axios.post(
      `${BASE_URL}/radiologies/batch-orders/${radiologyOrder.id}/results/${resultId}/file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${radiologyToken}`
        }
      }
    );

    console.log('✅ File uploaded successfully');
    console.log('File ID:', uploadResponse.data.file.id);
    console.log('File URL:', uploadResponse.data.file.fileUrl);

    // Clean up test file
    fs.unlinkSync(testFilePath);
    console.log('\n🎉 Radiology file upload test completed successfully!');

  } catch (error) {
    console.error('❌ Error in radiology file upload test:', error.response?.data || error.message);
  }
}

// Run the test
testRadiologyFileUpload();
