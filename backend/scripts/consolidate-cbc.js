/**
 * Script to consolidate CBC tests:
 * 1. Remove old individual CBC tests completely from database
 * 2. Create new consolidated CBC test with comprehensive result fields
 * 3. Mark CBC group as inactive or remove it
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function consolidateCBC() {
  console.log('🔬 Consolidating CBC tests...\n');

  try {
    // Step 1: Find CBC group
    const cbcGroup = await prisma.labTestGroup.findFirst({
      where: { 
        name: { contains: 'Complete Blood Count', mode: 'insensitive' },
        category: 'Hematology'
      },
      include: {
        tests: {
          include: {
            labTestOrders: true,
            labTestResults: true,
            resultFields: true
          }
        }
      }
    });

    if (!cbcGroup) {
      console.log('⚠️  CBC group not found. Creating new CBC test...');
    } else {
      console.log(`📋 Found CBC group: ${cbcGroup.name}`);
      console.log(`   Contains ${cbcGroup.tests.length} individual tests\n`);

      // List all tests
      cbcGroup.tests.forEach(test => {
        const orderCount = test.labTestOrders?.length || 0;
        const resultCount = test.labTestResults?.length || 0;
        console.log(`   - ${test.code} (${test.name}): ${orderCount} orders, ${resultCount} results`);
      });

      // Step 2: Remove individual CBC tests (user confirmed no current patients using them)
      console.log('\n🗑️  Removing individual CBC tests...');
      const cbcTestCodes = ['HCT001', 'RBC001', 'WBC001', 'PLT001', 'RCI001', 'WBCD001', 'HB001'];
      
      for (const testCode of cbcTestCodes) {
        const test = await prisma.labTest.findUnique({
          where: { code: testCode },
          include: {
            resultFields: true,
            labTestOrders: true,
            labTestResults: true,
            service: true
          }
        });

        if (test) {
          // Delete result fields first (cascade should handle this, but being explicit)
          await prisma.labTestResultField.deleteMany({
            where: { testId: test.id }
          });

          // Check for orders and results
          if (test.labTestOrders.length > 0 || test.labTestResults.length > 0) {
            console.log(`   ⚠️  Warning: ${testCode} has ${test.labTestOrders.length} orders and ${test.labTestResults.length} results`);
            console.log(`   ⚠️  Deleting anyway as per user request (no current patients using them)...`);
          }

          // Delete the test
          await prisma.labTest.delete({
            where: { id: test.id }
          });

          // Optionally delete associated service if it exists and not used elsewhere
          if (test.serviceId) {
            const serviceUsage = await prisma.billingService.count({
              where: { serviceId: test.serviceId }
            });

            if (serviceUsage === 0) {
              await prisma.service.delete({
                where: { id: test.serviceId }
              });
              console.log(`   ✅ Deleted test ${testCode} and its service`);
            } else {
              console.log(`   ✅ Deleted test ${testCode} (service still in use, keeping it)`);
            }
          } else {
            console.log(`   ✅ Deleted test ${testCode}`);
          }
        } else {
          console.log(`   ℹ️  Test ${testCode} not found, skipping`);
        }
      }

      // Mark CBC group as inactive (don't delete in case we need to reference it)
      await prisma.labTestGroup.update({
        where: { id: cbcGroup.id },
        data: { isActive: false }
      });
      console.log(`\n✅ Marked CBC group as inactive`);
    }

    // Step 3: Check if CBC001 already exists
    const existingCBC = await prisma.labTest.findUnique({
      where: { code: 'CBC001' }
    });

    if (existingCBC) {
      console.log('\n⚠️  CBC001 already exists. Updating it...');
      
      // Delete existing result fields
      await prisma.labTestResultField.deleteMany({
        where: { testId: existingCBC.id }
      });

      // Update the test
      await prisma.labTest.update({
        where: { id: existingCBC.id },
        data: {
          name: 'Complete Blood Count (CBC)',
          category: 'Hematology',
          price: 400,
          groupId: null, // Standalone
          isActive: true,
          displayOrder: 0
        }
      });

      console.log('   ✅ Updated existing CBC001 test');
    } else {
      console.log('\n📝 Creating new consolidated CBC test...');
      
      // Create or find service for CBC
      let cbcService = await prisma.service.findUnique({
        where: { code: 'CBC001' }
      });

      if (!cbcService) {
        cbcService = await prisma.service.create({
          data: {
            code: 'CBC001',
            name: 'Complete Blood Count (CBC)',
            category: 'LAB',
            price: 400,
            description: 'Complete Blood Count (CBC) - Comprehensive hematology panel',
            isActive: true
          }
        });
        console.log('   ✅ Created CBC service');
      }

      // Create the consolidated CBC test
      const cbcTest = await prisma.labTest.create({
        data: {
          name: 'Complete Blood Count (CBC)',
          code: 'CBC001',
          category: 'Hematology',
          description: 'Complete Blood Count (CBC) - Comprehensive hematology panel including Hemoglobin, Hematocrit, RBC, WBC, Platelets, Indices, and Differential',
          price: 400,
          unit: 'UNIT',
          groupId: null, // Standalone
          displayOrder: 0,
          serviceId: cbcService.id,
          isActive: true
        }
      });

      console.log('   ✅ Created consolidated CBC test');
    }

    // Step 4: Create comprehensive result fields for CBC
    const cbcTest = await prisma.labTest.findUnique({
      where: { code: 'CBC001' }
    });

    if (!cbcTest) {
      throw new Error('CBC001 test not found after creation/update');
    }

    console.log('\n📋 Creating comprehensive CBC result fields...');

    const cbcResultFields = [
      {
        testId: cbcTest.id,
        fieldName: 'hemoglobin',
        label: 'Hemoglobin (Hb)',
        fieldType: 'number',
        unit: 'g/dL',
        normalRange: '12.1-17.2',
        options: null,
        isRequired: true,
        displayOrder: 1
      },
      {
        testId: cbcTest.id,
        fieldName: 'hematocrit',
        label: 'Hematocrit (HCT/PCV)',
        fieldType: 'number',
        unit: '%',
        normalRange: '36.1-50.3',
        options: null,
        isRequired: true,
        displayOrder: 2
      },
      {
        testId: cbcTest.id,
        fieldName: 'rbc',
        label: 'Red Blood Cell Count (RBC)',
        fieldType: 'number',
        unit: '×10⁶/µL',
        normalRange: '4.2-6.1',
        options: null,
        isRequired: true,
        displayOrder: 3
      },
      {
        testId: cbcTest.id,
        fieldName: 'wbc',
        label: 'White Blood Cell Count (WBC)',
        fieldType: 'number',
        unit: '×10³/µL',
        normalRange: '4.5-11.0',
        options: null,
        isRequired: true,
        displayOrder: 4
      },
      {
        testId: cbcTest.id,
        fieldName: 'platelets',
        label: 'Platelets (Plt)',
        fieldType: 'number',
        unit: '×10³/µL',
        normalRange: '150-450',
        options: null,
        isRequired: true,
        displayOrder: 5
      },
      {
        testId: cbcTest.id,
        fieldName: 'mcv',
        label: 'Mean Corpuscular Volume (MCV)',
        fieldType: 'number',
        unit: 'fL',
        normalRange: '80-100',
        options: null,
        isRequired: false,
        displayOrder: 6
      },
      {
        testId: cbcTest.id,
        fieldName: 'mch',
        label: 'Mean Corpuscular Hemoglobin (MCH)',
        fieldType: 'number',
        unit: 'pg',
        normalRange: '27-33',
        options: null,
        isRequired: false,
        displayOrder: 7
      },
      {
        testId: cbcTest.id,
        fieldName: 'mchc',
        label: 'Mean Corpuscular Hemoglobin Concentration (MCHC)',
        fieldType: 'number',
        unit: 'g/dL',
        normalRange: '32-36',
        options: null,
        isRequired: false,
        displayOrder: 8
      },
      {
        testId: cbcTest.id,
        fieldName: 'neutrophils',
        label: 'Neutrophils (N)',
        fieldType: 'number',
        unit: '%',
        normalRange: '40-70',
        options: null,
        isRequired: false,
        displayOrder: 9
      },
      {
        testId: cbcTest.id,
        fieldName: 'lymphocytes',
        label: 'Lymphocytes (L)',
        fieldType: 'number',
        unit: '%',
        normalRange: '20-45',
        options: null,
        isRequired: false,
        displayOrder: 10
      },
      {
        testId: cbcTest.id,
        fieldName: 'monocytes',
        label: 'Monocytes (M)',
        fieldType: 'number',
        unit: '%',
        normalRange: '2-10',
        options: null,
        isRequired: false,
        displayOrder: 11
      },
      {
        testId: cbcTest.id,
        fieldName: 'eosinophils',
        label: 'Eosinophils (E)',
        fieldType: 'number',
        unit: '%',
        normalRange: '0-5',
        options: null,
        isRequired: false,
        displayOrder: 12
      },
      {
        testId: cbcTest.id,
        fieldName: 'basophils',
        label: 'Basophils (B)',
        fieldType: 'number',
        unit: '%',
        normalRange: '0-2',
        options: null,
        isRequired: false,
        displayOrder: 13
      },
      {
        testId: cbcTest.id,
        fieldName: 'additional_notes',
        label: 'Additional Notes',
        fieldType: 'textarea',
        unit: null,
        normalRange: null,
        options: null,
        isRequired: false,
        displayOrder: 14
      }
    ];

    await prisma.labTestResultField.createMany({
      data: cbcResultFields
    });

    console.log(`✅ Created ${cbcResultFields.length} result fields for CBC`);
    console.log('\n✅ CBC consolidation completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Removed individual CBC component tests');
    console.log('   - Created/Updated consolidated CBC001 test');
    console.log('   - Added comprehensive result fields template');
    console.log('   - CBC is now a standalone test (not in a group)');

  } catch (error) {
    console.error('❌ Error consolidating CBC:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
consolidateCBC()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

