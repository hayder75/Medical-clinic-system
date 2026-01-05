const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndCreateMissingTemplates() {
  try {
    console.log('🔍 Checking lab orders for missing templates...\n');

    // Get all batch orders with LAB type
    const labBatchOrders = await prisma.batchOrder.findMany({
      where: {
        OR: [
          { type: 'LAB' },
          { type: 'MIXED' }
        ],
        status: {
          in: ['PAID', 'QUEUED', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        services: {
          include: {
            investigationType: true,
            service: true
          }
        }
      }
    });

    console.log(`📋 Found ${labBatchOrders.length} lab batch orders`);

    // Collect all unique investigation types used in orders
    const usedInvestigationTypes = new Set();
    const investigationTypeMap = new Map();

    labBatchOrders.forEach(order => {
      order.services.forEach(service => {
        // Check both investigationType and service.name
        if (service.investigationType) {
          const invTypeId = service.investigationType.id;
          if (!usedInvestigationTypes.has(invTypeId)) {
            usedInvestigationTypes.add(invTypeId);
            investigationTypeMap.set(invTypeId, {
              id: invTypeId,
              name: service.investigationType.name,
              category: service.investigationType.category,
              price: service.investigationType.price
            });
          }
        } else if (service.service) {
          // Fallback to service name if investigationType is missing
          const serviceId = service.service.id;
          const serviceKey = `service-${serviceId}`;
          if (!usedInvestigationTypes.has(serviceKey)) {
            usedInvestigationTypes.add(serviceKey);
            investigationTypeMap.set(serviceKey, {
              id: serviceId,
              name: service.service.name,
              category: service.service.category || 'LAB',
              price: service.service.price
            });
          }
        }
      });
    });

    console.log(`\n📊 Found ${usedInvestigationTypes.size} unique lab investigation types in orders`);

    // Get all existing templates
    const existingTemplates = await prisma.labTestTemplate.findMany({
      where: { isActive: true }
    });

    console.log(`📋 Found ${existingTemplates.length} existing templates`);

    // Match templates by name (case-insensitive)
    const templatesByName = new Map();
    existingTemplates.forEach(template => {
      templatesByName.set(template.name.toLowerCase(), template);
    });

    // Find missing templates
    const missingTemplates = [];
    investigationTypeMap.forEach((invType, invTypeId) => {
      const templateKey = invType.name.toLowerCase();
      if (!templatesByName.has(templateKey)) {
        // Also check for partial matches (e.g., "CBC" matches "Complete Blood Count")
        let found = false;
        for (const [templateName, template] of templatesByName.entries()) {
          if (templateName.includes(invType.name.toLowerCase()) || 
              invType.name.toLowerCase().includes(templateName)) {
            found = true;
            break;
          }
        }
        if (!found) {
          missingTemplates.push(invType);
        }
      }
    });

    console.log(`\n❌ Found ${missingTemplates.length} investigation types without templates:`);
    missingTemplates.forEach(inv => {
      console.log(`   - ${inv.name} (ID: ${inv.id})`);
    });

    if (missingTemplates.length === 0) {
      console.log('\n✅ All investigation types have templates!');
      return;
    }

    // Create basic templates for missing ones
    console.log('\n🔧 Creating templates for missing investigation types...');
    
    let createdCount = 0;
    for (const invType of missingTemplates) {
      try {
        // Create a basic template with common fields
        const basicFields = {
          'Test Result': {
            type: 'text',
            required: true,
            unit: null,
            options: null
          },
          'Normal Range': {
            type: 'text',
            required: false,
            unit: null,
            options: null
          },
          'Notes': {
            type: 'textarea',
            required: false,
            unit: null,
            options: null
          }
        };

        // Add more specific fields based on common lab test patterns
        const testName = invType.name.toLowerCase();
        if (testName.includes('blood') || testName.includes('cbc') || testName.includes('hemoglobin')) {
          basicFields['Hemoglobin'] = { type: 'number', required: true, unit: 'g/dL', options: null };
          basicFields['Hematocrit'] = { type: 'number', required: true, unit: '%', options: null };
          basicFields['RBC'] = { type: 'number', required: true, unit: 'million/µL', options: null };
          basicFields['WBC'] = { type: 'number', required: true, unit: '/µL', options: null };
          basicFields['Platelets'] = { type: 'number', required: true, unit: '/µL', options: null };
        } else if (testName.includes('urine') || testName.includes('urinalysis')) {
          basicFields['Color'] = { type: 'select', required: true, unit: null, options: ['Yellow', 'Clear', 'Cloudy', 'Dark Yellow', 'Amber'] };
          basicFields['Appearance'] = { type: 'select', required: true, unit: null, options: ['Clear', 'Cloudy', 'Turbid'] };
          basicFields['pH'] = { type: 'number', required: true, unit: null, options: null };
          basicFields['Specific Gravity'] = { type: 'number', required: true, unit: null, options: null };
          basicFields['Protein'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Trace', '+', '++', '+++'] };
          basicFields['Glucose'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Trace', '+', '++', '+++'] };
          basicFields['Ketones'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Trace', '+', '++', '+++'] };
          basicFields['Blood'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Trace', '+', '++', '+++'] };
          basicFields['Leukocytes'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Trace', '+', '++', '+++'] };
          basicFields['Nitrites'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Positive'] };
          basicFields['Urobilinogen'] = { type: 'select', required: true, unit: null, options: ['Negative', 'Normal', 'Elevated'] };
        } else if (testName.includes('chemistry') || testName.includes('biochemistry')) {
          basicFields['Glucose'] = { type: 'number', required: true, unit: 'mg/dL', options: null };
          basicFields['Creatinine'] = { type: 'number', required: true, unit: 'mg/dL', options: null };
          basicFields['Urea'] = { type: 'number', required: true, unit: 'mg/dL', options: null };
          basicFields['Uric Acid'] = { type: 'number', required: true, unit: 'mg/dL', options: null };
        } else if (testName.includes('liver') || testName.includes('lft')) {
          basicFields['ALT'] = { type: 'number', required: true, unit: 'U/L', options: null };
          basicFields['AST'] = { type: 'number', required: true, unit: 'U/L', options: null };
          basicFields['ALP'] = { type: 'number', required: true, unit: 'U/L', options: null };
          basicFields['Total Bilirubin'] = { type: 'number', required: true, unit: 'mg/dL', options: null };
          basicFields['Direct Bilirubin'] = { type: 'number', required: true, unit: 'mg/dL', options: null };
          basicFields['Total Protein'] = { type: 'number', required: true, unit: 'g/dL', options: null };
          basicFields['Albumin'] = { type: 'number', required: true, unit: 'g/dL', options: null };
        }

        const template = await prisma.labTestTemplate.create({
          data: {
            name: invType.name,
            category: invType.category || 'LAB',
            fields: basicFields,
            description: `Template for ${invType.name}`,
            isActive: true
          }
        });

        console.log(`   ✅ Created template for: ${invType.name} (${Object.keys(basicFields).length} fields)`);
        createdCount++;
      } catch (error) {
        console.error(`   ❌ Failed to create template for ${invType.name}:`, error.message);
      }
    }

    console.log(`\n✅ Created ${createdCount} templates successfully!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Total investigation types in orders: ${usedInvestigationTypes.size}`);
    console.log(`   - Existing templates: ${existingTemplates.length}`);
    console.log(`   - Missing templates: ${missingTemplates.length}`);
    console.log(`   - Created templates: ${createdCount}`);

  } catch (error) {
    console.error('❌ Error checking/creating templates:', error);
    throw error;
  }
}

// Run the script
checkAndCreateMissingTemplates()
  .then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

