const axios = require('axios');

(async () => {
  try {
    // Test the template endpoint directly
    const response = await axios.get('http://localhost:3000/api/radiologies/templates/28');
    console.log('=== Template API Test ===\n');
    console.log('Status:', response.status);
    console.log('Template Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.template) {
      console.log(`\n✅ Template found:`);
      console.log(`   InvestigationType: ${response.data.template.investigationType?.name}`);
      console.log(`   Findings: ${response.data.template.findingsTemplate ? response.data.template.findingsTemplate.length + ' chars' : 'MISSING'}`);
      console.log(`   Conclusion: ${response.data.template.conclusionTemplate ? response.data.template.conclusionTemplate.length + ' chars' : 'MISSING'}`);
    } else {
      console.log('❌ Template is null');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
})();
