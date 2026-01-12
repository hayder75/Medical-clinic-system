/**
 * Script to seed ALL missing lab tests with proper classification
 * Includes: Standalone tests, Blood Chemistry individual tests, etc.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllMissingLabTests() {
  console.log('🔬 Seeding all missing lab tests...\n');

  try {
    // Define all missing tests with their categories and classifications
    const allTests = [
      // ==========================================
      // STANDALONE TESTS (Blood Chemistry - Individual)
      // ==========================================
      {
        code: 'ALP001',
        name: 'ALP',
        category: 'Blood Chemistry',
        description: 'ALP test',
        price: 300.00,
        groupId: null, // Standalone
        resultFields: [
          { fieldName: 'value', label: 'ALP', fieldType: 'number', unit: 'U/L', normalRange: '44-147', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'ALT001',
        name: 'ALT',
        category: 'Blood Chemistry',
        description: 'ALT test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'ALT', fieldType: 'number', unit: 'U/L', normalRange: '7-56', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'AST001',
        name: 'AST',
        category: 'Blood Chemistry',
        description: 'AST test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'AST', fieldType: 'number', unit: 'U/L', normalRange: '10-40', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'ALB001',
        name: 'Albumin',
        category: 'Blood Chemistry',
        description: 'Albumin test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Albumin', fieldType: 'number', unit: 'g/dL', normalRange: '3.5-5.0', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'BUN001',
        name: 'BUN',
        category: 'Blood Chemistry',
        description: 'BUN test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'BUN', fieldType: 'number', unit: 'mg/dL', normalRange: '7-20', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'CREA001',
        name: 'Creatinine',
        category: 'Blood Chemistry',
        description: 'Creatinine test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Creatinine', fieldType: 'number', unit: 'mg/dL', normalRange: '0.6-1.2 (M), 0.5-1.1 (F)', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'DBIL001',
        name: 'Direct Bilirubin',
        category: 'Blood Chemistry',
        description: 'Direct Bilirubin test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Direct Bilirubin', fieldType: 'number', unit: 'mg/dL', normalRange: '0.0-0.3', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'TBIL001',
        name: 'Total Bilirubin',
        category: 'Blood Chemistry',
        description: 'Total Bilirubin test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Total Bilirubin', fieldType: 'number', unit: 'mg/dL', normalRange: '0.1-1.2', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'TP001',
        name: 'Total Protein',
        category: 'Blood Chemistry',
        description: 'Total Protein test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Total Protein', fieldType: 'number', unit: 'g/dL', normalRange: '6.0-8.3', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'UA001',
        name: 'Uric Acid',
        category: 'Blood Chemistry',
        description: 'Uric Acid test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Uric Acid', fieldType: 'number', unit: 'mg/dL', normalRange: '3.5-7.2 (M), 2.6-6.0 (F)', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'HDL001',
        name: 'HDL Cholesterol',
        category: 'Blood Chemistry',
        description: 'HDL Cholesterol test',
        price: 500.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'HDL Cholesterol', fieldType: 'number', unit: 'mg/dL', normalRange: '> 40 (M), > 50 (F)', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'LDL001',
        name: 'LDL Cholesterol',
        category: 'Blood Chemistry',
        description: 'LDL Cholesterol test',
        price: 500.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'LDL Cholesterol', fieldType: 'number', unit: 'mg/dL', normalRange: '< 100', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'CHOL001',
        name: 'Total Cholesterol',
        category: 'Blood Chemistry',
        description: 'Total Cholesterol test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Total Cholesterol', fieldType: 'number', unit: 'mg/dL', normalRange: '< 200', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'TG001',
        name: 'Triglycerides',
        category: 'Blood Chemistry',
        description: 'Triglycerides test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Triglycerides', fieldType: 'number', unit: 'mg/dL', normalRange: '< 150', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'TSH001',
        name: 'TSH (Thyroid Stimulating Hormone)',
        category: 'Blood Chemistry',
        description: 'TSH (Thyroid Stimulating Hormone) test',
        price: 1000.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'TSH', fieldType: 'number', unit: 'mIU/L', normalRange: '0.4-4.0', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'FT3001',
        name: 'Free T3 (Triiodothyronine)',
        category: 'Blood Chemistry',
        description: 'Free T3 (Triiodothyronine) test',
        price: 1000.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Free T3', fieldType: 'number', unit: 'pg/mL', normalRange: '2.3-4.2', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'FT4001',
        name: 'Free T4 (Thyroxine)',
        category: 'Blood Chemistry',
        description: 'Free T4 (Thyroxine) test',
        price: 1000.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Free T4', fieldType: 'number', unit: 'ng/dL', normalRange: '0.8-1.8', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      // ==========================================
      // STANDALONE TESTS (Glucose)
      // ==========================================
      {
        code: 'FBG001',
        name: 'Fasting Blood Glucose',
        category: 'Blood Chemistry',
        description: 'Fasting Blood Glucose test',
        price: 50.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Fasting Blood Glucose', fieldType: 'number', unit: 'mg/dL', normalRange: '70-100', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'RBG001',
        name: 'Random Blood Glucose',
        category: 'Blood Chemistry',
        description: 'Random Blood Glucose test',
        price: 70.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Random Blood Glucose', fieldType: 'number', unit: 'mg/dL', normalRange: '< 140', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'HBA1C001',
        name: 'HbA1c',
        category: 'Blood Chemistry',
        description: 'HbA1c test',
        price: 1500.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'HbA1c', fieldType: 'number', unit: '%', normalRange: '< 5.7', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      // ==========================================
      // STANDALONE TESTS (Hematology - if not already in groups)
      // ==========================================
      {
        code: 'RET001',
        name: 'Reticulocyte Count',
        category: 'Hematology',
        description: 'Reticulocyte Count test',
        price: 200.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Reticulocyte Count', fieldType: 'number', unit: '%', normalRange: '0.5-2.0', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'BT001',
        name: 'Bleeding Time (BT)',
        category: 'Hematology',
        description: 'Bleeding Time (BT) test',
        price: 300.00,
        groupId: null,
        resultFields: [
          { fieldName: 'value', label: 'Bleeding Time', fieldType: 'number', unit: 'minutes', normalRange: '2-9', isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'PBF001',
        name: 'Blood Film',
        category: 'Hematology',
        description: 'Peripheral Blood Film test',
        price: 150.00,
        groupId: null,
        resultFields: [
          { fieldName: 'result', label: 'Result', fieldType: 'textarea', unit: null, normalRange: null, isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      // ==========================================
      // STANDALONE TESTS (Urinalysis & Stool - if not already created)
      // ==========================================
      {
        code: 'URINE001',
        name: 'Urinalysis',
        category: 'Urinalysis',
        description: 'Urinalysis test',
        price: 100.00,
        groupId: null,
        resultFields: [
          { fieldName: 'color', label: 'Color', fieldType: 'select', unit: null, normalRange: null, options: ['Yellow', 'Clear', 'Cloudy', 'Dark Yellow', 'Amber', 'Red', 'Brown'], isRequired: true },
          { fieldName: 'appearance', label: 'Appearance', fieldType: 'select', unit: null, normalRange: null, options: ['Clear', 'Cloudy', 'Turbid'], isRequired: true },
          { fieldName: 'protein', label: 'Protein', fieldType: 'select', unit: null, normalRange: 'Negative', options: ['Negative', 'Trace', '+', '++'], isRequired: true },
          { fieldName: 'glucose', label: 'Glucose', fieldType: 'select', unit: null, normalRange: 'Negative', options: ['Negative', '+', '++'], isRequired: true },
          { fieldName: 'ketone', label: 'Ketone', fieldType: 'select', unit: null, normalRange: 'Negative', options: ['Negative', '+'], isRequired: true },
          { fieldName: 'blood', label: 'Blood', fieldType: 'select', unit: null, normalRange: 'Negative', options: ['Negative', '+'], isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      },
      {
        code: 'STOOL001',
        name: 'Stool Examination',
        category: 'Stool Examination',
        description: 'Stool Examination test',
        price: 100.00,
        groupId: null,
        resultFields: [
          { fieldName: 'consistency', label: 'Consistency', fieldType: 'select', unit: null, normalRange: null, options: ['Formed', 'Semi-formed', 'Loose', 'Watery', 'Hard'], isRequired: true },
          { fieldName: 'blood', label: 'Blood', fieldType: 'select', unit: null, normalRange: 'No', options: ['Yes', 'No'], isRequired: true },
          { fieldName: 'mucus', label: 'Mucus', fieldType: 'select', unit: null, normalRange: 'No', options: ['Yes', 'No'], isRequired: true },
          { fieldName: 'ova', label: 'Ova', fieldType: 'select', unit: null, normalRange: 'Not seen', options: ['Seen', 'Not seen'], isRequired: true },
          { fieldName: 'parasite', label: 'Parasite', fieldType: 'select', unit: null, normalRange: 'Not seen', options: ['Seen', 'Not seen'], isRequired: true },
          { fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false }
        ]
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const testData of allTests) {
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
            category: testData.category,
            description: testData.description,
            price: testData.price,
            unit: 'UNIT',
            isActive: true,
            serviceId: service.id,
            groupId: testData.groupId,
            displayOrder: 0
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
              normalRange: field.normalRange || null,
              options: field.options ? JSON.stringify(field.options) : null,
              isRequired: field.isRequired,
              displayOrder: i + 1
            }
          });
        }

        createdCount++;
        console.log(`   ✅ Created: ${testData.name} (${testData.code}) - ${testData.category}`);
      } else {
        // Update existing test
        await prisma.labTest.update({
          where: { id: existingTest.id },
          data: {
            name: testData.name,
            category: testData.category,
            price: testData.price,
            groupId: testData.groupId,
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
              normalRange: field.normalRange || null,
              options: field.options ? JSON.stringify(field.options) : null,
              isRequired: field.isRequired,
              displayOrder: i + 1
            }
          });
        }

        updatedCount++;
        console.log(`   ✅ Updated: ${testData.name} (${testData.code}) - ${testData.category}`);
      }
    }

    console.log(`\n✅ All missing lab tests seeding completed!`);
    console.log(`   Created: ${createdCount} tests`);
    console.log(`   Updated: ${updatedCount} tests`);
    console.log(`   Total processed: ${allTests.length} tests`);

  } catch (error) {
    console.error('❌ Error seeding missing lab tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedAllMissingLabTests()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
