/**
 * Script to seed Serology Panel with common serology tests
 * Creates Serology group and tests: Weil-Felix, Widal, HBsAg, HCV, VDRL, HIV, etc.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSerologyTests() {
  console.log('🔬 Seeding Serology Panel tests...\n');

  try {
    // Create or find Serology Panel group
    let serologyGroup = await prisma.labTestGroup.findFirst({
      where: { 
        category: 'Serology',
        name: 'Serology Panel'
      }
    });

    if (!serologyGroup) {
      serologyGroup = await prisma.labTestGroup.create({
        data: {
          name: 'Serology Panel',
          category: 'Serology',
          description: 'Common serology tests for infectious diseases',
          displayOrder: 1,
          isActive: true
        }
      });
      console.log('✅ Created Serology Panel group');
    } else {
      console.log('✅ Serology Panel group already exists');
    }

    // Define serology tests with their details
    const serologyTests = [
      {
        code: 'WEIL001',
        name: 'Weil-Felix Test',
        description: 'Weil-Felix test for rickettsial infections',
        price: 150.00,
        displayOrder: 1,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Negative', 'Positive'], normalRange: 'Negative', isRequired: true },
          { fieldName: 'titer', label: 'Titer (if positive)', fieldType: 'text', options: null, normalRange: null, isRequired: false },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'WIDAL001',
        name: 'Widal Test',
        description: 'Widal test for typhoid fever',
        price: 200.00,
        displayOrder: 2,
        resultFields: [
          { fieldName: 'o_antigen', label: 'O Antigen', fieldType: 'select', options: ['Negative', '1:40', '1:80', '1:160', '1:320'], normalRange: 'Negative', isRequired: true },
          { fieldName: 'h_antigen', label: 'H Antigen', fieldType: 'select', options: ['Negative', '1:40', '1:80', '1:160', '1:320'], normalRange: 'Negative', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'HBSAG001',
        name: 'HBsAg',
        description: 'Hepatitis B Surface Antigen',
        price: 250.00,
        displayOrder: 3,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Non-Reactive', 'Reactive'], normalRange: 'Non-Reactive', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'HCV001',
        name: 'HCV Antibody',
        description: 'Hepatitis C Virus Antibody',
        price: 250.00,
        displayOrder: 4,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Non-Reactive', 'Reactive'], normalRange: 'Non-Reactive', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'VDRL001',
        name: 'VDRL',
        description: 'Venereal Disease Research Laboratory test',
        price: 180.00,
        displayOrder: 5,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Non-Reactive', 'Reactive'], normalRange: 'Non-Reactive', isRequired: true },
          { fieldName: 'titer', label: 'Titer (if reactive)', fieldType: 'text', options: null, normalRange: null, isRequired: false },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'HIV001',
        name: 'HIV Test (PICT)',
        description: 'HIV antibody screening test',
        price: 200.00,
        displayOrder: 6,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Non-Reactive', 'Reactive'], normalRange: 'Non-Reactive', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks (only if Reactive)', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'RPR001',
        name: 'RPR',
        description: 'Rapid Plasma Reagin test',
        price: 180.00,
        displayOrder: 7,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Non-Reactive', 'Reactive'], normalRange: 'Non-Reactive', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'RF001',
        name: 'Rheumatoid Factor',
        description: 'Rheumatoid Factor test',
        price: 220.00,
        displayOrder: 8,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'select', options: ['Negative', 'Positive'], normalRange: 'Negative', isRequired: true },
          { fieldName: 'value', label: 'Value (IU/mL)', fieldType: 'number', options: null, normalRange: '< 15', isRequired: false },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'ASO001',
        name: 'ASO Titer',
        description: 'Anti-Streptolysin O Titer',
        price: 200.00,
        displayOrder: 9,
        resultFields: [
          { fieldName: 'titer', label: 'ASO Titer', fieldType: 'select', options: ['< 200', '200-400', '> 400'], normalRange: '< 200', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', options: null, normalRange: null, isRequired: false }
        ]
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const testData of serologyTests) {
      // Check if test already exists
      let existingTest = await prisma.labTest.findUnique({
        where: { code: testData.code }
      });

      // Create or update Service
      const service = await prisma.service.upsert({
        where: { code: testData.code },
        update: {
          name: testData.name,
          price: testData.price,
          description: testData.description,
          isActive: true
        },
        create: {
          code: testData.code,
          name: testData.name,
          category: 'LAB',
          price: testData.price,
          description: testData.description,
          isActive: true
        }
      });

      if (!existingTest) {
        // Create new test
        existingTest = await prisma.labTest.create({
          data: {
            code: testData.code,
            name: testData.name,
            category: 'Serology',
            description: testData.description,
            price: testData.price,
            unit: 'UNIT',
            isActive: true,
            serviceId: service.id,
            groupId: serologyGroup.id,
            displayOrder: testData.displayOrder
          }
        });

        // Create result fields
        for (let i = 0; i < testData.resultFields.length; i++) {
          const field = testData.resultFields[i];
          await prisma.labTestResultField.create({
            data: {
              testId: existingTest.id,
              fieldName: field.fieldName,
              label: field.label,
              fieldType: field.fieldType,
              unit: field.unit || null,
              normalRange: field.normalRange,
              options: field.options ? JSON.stringify(field.options) : null,
              isRequired: field.isRequired,
              displayOrder: i + 1
            }
          });
        }

        createdCount++;
        console.log(`   ✅ Created: ${testData.name} (${testData.code})`);
      } else {
        // Update existing test to ensure it's in the Serology group
        await prisma.labTest.update({
          where: { id: existingTest.id },
          data: {
            name: testData.name,
            category: 'Serology',
            price: testData.price,
            groupId: serologyGroup.id,
            displayOrder: testData.displayOrder,
            serviceId: service.id,
            isActive: true
          }
        });

        // Update result fields
        await prisma.labTestResultField.deleteMany({
          where: { testId: existingTest.id }
        });

        for (let i = 0; i < testData.resultFields.length; i++) {
          const field = testData.resultFields[i];
          await prisma.labTestResultField.create({
            data: {
              testId: existingTest.id,
              fieldName: field.fieldName,
              label: field.label,
              fieldType: field.fieldType,
              unit: field.unit || null,
              normalRange: field.normalRange,
              options: field.options ? JSON.stringify(field.options) : null,
              isRequired: field.isRequired,
              displayOrder: i + 1
            }
          });
        }

        updatedCount++;
        console.log(`   ✅ Updated: ${testData.name} (${testData.code})`);
      }
    }

    console.log(`\n✅ Serology Panel seeding completed!`);
    console.log(`   Created: ${createdCount} tests`);
    console.log(`   Updated: ${updatedCount} tests`);
    console.log(`   Total in Serology Panel: ${serologyTests.length} tests`);

  } catch (error) {
    console.error('❌ Error seeding serology tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedSerologyTests()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
