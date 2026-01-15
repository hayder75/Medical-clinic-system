/**
 * Comprehensive script to update lab test templates:
 * 1. Add new AFB Sputum (Spot–Morning–Spot) template
 * 2. Update Urinalysis template (bacteria, WBC, RBC, add Epithelial Cells)
 * 3. Update Stool template (parasite default)
 * 4. Update HCV Antibody (change to Positive/Negative)
 * 5. Update HBsAg (change to Positive/Negative)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLabTemplatesComprehensive() {
  console.log('🔬 Starting comprehensive lab template updates...\n');

  try {
    // ============================================
    // 1. CREATE NEW AFB SPUTUM TEMPLATE
    // ============================================
    console.log('1️⃣ Creating AFB Sputum (Spot–Morning–Spot) template...');
    
    // Check if AFB test already exists
    let afbTest = await prisma.labTest.findUnique({
      where: { code: 'AFB001' }
    });

    if (!afbTest) {
      // Create Service first
      const afbService = await prisma.service.upsert({
        where: { code: 'AFB001' },
        update: {
          name: 'AFB Sputum (Spot–Morning–Spot)',
          price: 300.00,
          description: 'Acid-Fast Bacilli Sputum Examination - Three samples (Spot-Morning-Spot)',
          isActive: true
        },
        create: {
          code: 'AFB001',
          name: 'AFB Sputum (Spot–Morning–Spot)',
          category: 'LAB',
          price: 300.00,
          description: 'Acid-Fast Bacilli Sputum Examination - Three samples (Spot-Morning-Spot)',
          isActive: true
        }
      });

      // Create or find Microbiology group
      let microGroup = await prisma.labTestGroup.findFirst({
        where: { 
          category: 'Microbiology',
          name: 'Microbiology'
        }
      });

      if (!microGroup) {
        microGroup = await prisma.labTestGroup.create({
          data: {
            name: 'Microbiology',
            category: 'Microbiology',
            description: 'Microbiology tests',
            displayOrder: 10,
            isActive: true
          }
        });
      }

      // Create LabTest
      afbTest = await prisma.labTest.create({
        data: {
          code: 'AFB001',
          name: 'AFB Sputum (Spot–Morning–Spot)',
          category: 'Microbiology',
          description: 'Acid-Fast Bacilli Sputum Examination - Three samples (Spot-Morning-Spot)',
          price: 300.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: afbService.id,
          groupId: microGroup.id,
          displayOrder: 1
        }
      });
      console.log('   ✅ Created AFB Sputum test');
    } else {
      console.log('   ℹ️  AFB Sputum test already exists, updating fields...');
    }

    // Delete existing fields and create new ones
    await prisma.labTestResultField.deleteMany({
      where: { testId: afbTest.id }
    });

    await prisma.labTestResultField.createMany({
      data: [
        // First Spot Sample
        {
          testId: afbTest.id,
          fieldName: 'afb_result_first_spot',
          label: 'AFB Result (First Spot)',
          fieldType: 'select',
          unit: null,
          normalRange: 'Negative',
          options: ['Negative', 'Scanty', '1+', '2+', '3+'],
          isRequired: true,
          displayOrder: 1
        },
        {
          testId: afbTest.id,
          fieldName: 'afb_count_first_spot',
          label: 'AFB Count (First Spot)',
          fieldType: 'text',
          unit: null,
          normalRange: null,
          options: null,
          isRequired: false,
          displayOrder: 2
        },
        // Morning Sample
        {
          testId: afbTest.id,
          fieldName: 'afb_result_morning',
          label: 'AFB Result (Morning)',
          fieldType: 'select',
          unit: null,
          normalRange: 'Negative',
          options: ['Negative', 'Scanty', '1+', '2+', '3+'],
          isRequired: true,
          displayOrder: 3
        },
        {
          testId: afbTest.id,
          fieldName: 'afb_count_morning',
          label: 'AFB Count (Morning)',
          fieldType: 'text',
          unit: null,
          normalRange: null,
          options: null,
          isRequired: false,
          displayOrder: 4
        },
        // Second Spot Sample
        {
          testId: afbTest.id,
          fieldName: 'afb_result_second_spot',
          label: 'AFB Result (Second Spot)',
          fieldType: 'select',
          unit: null,
          normalRange: 'Negative',
          options: ['Negative', 'Scanty', '1+', '2+', '3+'],
          isRequired: true,
          displayOrder: 5
        },
        {
          testId: afbTest.id,
          fieldName: 'afb_count_second_spot',
          label: 'AFB Count (Second Spot)',
          fieldType: 'text',
          unit: null,
          normalRange: null,
          options: null,
          isRequired: false,
          displayOrder: 6
        },
        // Final Comment
        {
          testId: afbTest.id,
          fieldName: 'final_comment',
          label: 'Final Comment / Remarks',
          fieldType: 'textarea',
          unit: null,
          normalRange: null,
          options: null,
          isRequired: false,
          displayOrder: 7
        }
      ]
    });
    console.log('   ✅ AFB Sputum template created/updated\n');

    // ============================================
    // 2. UPDATE URINALYSIS TEMPLATE
    // ============================================
    console.log('2️⃣ Updating Urinalysis template...');
    const urinalysisTests = await prisma.labTest.findMany({
      where: {
        OR: [
          { name: { contains: 'Urinalysis', mode: 'insensitive' } },
          { name: { contains: 'Urine', mode: 'insensitive' } },
          { category: 'Urinalysis' }
        ]
      },
      include: { resultFields: true }
    });

    for (const test of urinalysisTests) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: test.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          // Physical
          {
            testId: test.id,
            fieldName: 'color',
            label: 'Color',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['Yellow', 'Clear', 'Cloudy', 'Dark Yellow', 'Amber', 'Red', 'Brown'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: test.id,
            fieldName: 'appearance',
            label: 'Appearance',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['Clear', 'Cloudy', 'Turbid'],
            isRequired: true,
            displayOrder: 2
          },
          // Chemical
          {
            testId: test.id,
            fieldName: 'protein',
            label: 'Protein',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', 'Trace', '+', '++'],
            isRequired: true,
            displayOrder: 3
          },
          {
            testId: test.id,
            fieldName: 'glucose',
            label: 'Glucose',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '+', '++'],
            isRequired: true,
            displayOrder: 4
          },
          {
            testId: test.id,
            fieldName: 'ketone',
            label: 'Ketone',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '+'],
            isRequired: true,
            displayOrder: 5
          },
          {
            testId: test.id,
            fieldName: 'blood',
            label: 'Blood',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '+'],
            isRequired: true,
            displayOrder: 6
          },
          // Microscopy - UPDATED FIELDS
          {
            testId: test.id,
            fieldName: 'wbc', // Changed from pus_cells
            label: 'WBC', // Changed from Pus Cells
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['None', 'Few', 'Moderate', 'Many', 'Full'],
            isRequired: false,
            displayOrder: 7
          },
          {
            testId: test.id,
            fieldName: 'rbc',
            label: 'RBC',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['None', 'Few', 'Moderate', 'Many', 'Full'], // Updated options
            isRequired: false,
            displayOrder: 8
          },
          {
            testId: test.id,
            fieldName: 'bacteria',
            label: 'Bacteria',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['Few', 'Moderate', 'Full'], // Changed from ['Seen', 'Not seen']
            isRequired: false,
            displayOrder: 9
          },
          // NEW FIELD: Epithelial Cells
          {
            testId: test.id,
            fieldName: 'epithelial_cells',
            label: 'Epithelial Cells',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['None', 'Few', 'Moderate', 'Many'],
            isRequired: false,
            displayOrder: 10
          }
        ]
      });
      console.log(`   ✅ Updated Urinalysis: ${test.name} (${test.code || 'N/A'})`);
    }
    console.log('');

    // ============================================
    // 3. UPDATE STOOL EXAMINATION TEMPLATE
    // ============================================
    console.log('3️⃣ Updating Stool Examination template...');
    const stoolTests = await prisma.labTest.findMany({
      where: {
        OR: [
          { name: { contains: 'Stool', mode: 'insensitive' } },
          { category: 'Stool Examination' }
        ]
      },
      include: { resultFields: true }
    });

    for (const test of stoolTests) {
      // Find the parasite field
      const parasiteField = test.resultFields.find(f => f.fieldName === 'parasite');
      
      if (parasiteField) {
        // Update parasite field to have "Not seen" as first option (default)
        await prisma.labTestResultField.update({
          where: { id: parasiteField.id },
          data: {
            options: ['Not seen', 'Seen'], // Reordered: Not seen first
            normalRange: 'Not seen'
          }
        });
        console.log(`   ✅ Updated Stool parasite field: ${test.name} (${test.code || 'N/A'})`);
      } else {
        // If field doesn't exist, recreate all fields
        await prisma.labTestResultField.deleteMany({
          where: { testId: test.id }
        });

        await prisma.labTestResultField.createMany({
          data: [
            {
              testId: test.id,
              fieldName: 'consistency',
              label: 'Consistency',
              fieldType: 'select',
              unit: null,
              normalRange: null,
              options: ['Formed', 'Semi-formed', 'Loose', 'Watery', 'Hard'],
              isRequired: true,
              displayOrder: 1
            },
            {
              testId: test.id,
              fieldName: 'blood',
              label: 'Blood',
              fieldType: 'select',
              unit: null,
              normalRange: 'No',
              options: ['Yes', 'No'],
              isRequired: true,
              displayOrder: 2
            },
            {
              testId: test.id,
              fieldName: 'mucus',
              label: 'Mucus',
              fieldType: 'select',
              unit: null,
              normalRange: 'No',
              options: ['Yes', 'No'],
              isRequired: true,
              displayOrder: 3
            },
            {
              testId: test.id,
              fieldName: 'ova',
              label: 'Ova',
              fieldType: 'select',
              unit: null,
              normalRange: 'Not seen',
              options: ['Not seen', 'Seen'],
              isRequired: true,
              displayOrder: 4
            },
            {
              testId: test.id,
              fieldName: 'parasite',
              label: 'Parasite',
              fieldType: 'select',
              unit: null,
              normalRange: 'Not seen',
              options: ['Not seen', 'Seen'], // Not seen first (default)
              isRequired: true,
              displayOrder: 5
            },
            {
              testId: test.id,
              fieldName: 'parasite_type',
              label: 'Parasite Type (if seen)',
              fieldType: 'select',
              unit: null,
              normalRange: null,
              options: [
                'Ascaris lumbricoides',
                'Trichuris trichiura',
                'Hookworm',
                'Entamoeba histolytica',
                'Giardia lamblia',
                'Taenia species',
                'Hymenolepis nana',
                'Enterobius vermicularis',
                'Strongyloides stercoralis',
                'Schistosoma mansoni',
                'Other (specify in remarks)'
              ],
              isRequired: false,
              displayOrder: 6
            },
            {
              testId: test.id,
              fieldName: 'cyst',
              label: 'Cyst',
              fieldType: 'select',
              unit: null,
              normalRange: 'Not seen',
              options: ['Not seen', 'Seen'],
              isRequired: true,
              displayOrder: 7
            },
            {
              testId: test.id,
              fieldName: 'remarks',
              label: 'Remarks',
              fieldType: 'textarea',
              unit: null,
              normalRange: null,
              options: null,
              isRequired: false,
              displayOrder: 8
            }
          ]
        });
        console.log(`   ✅ Recreated Stool fields: ${test.name} (${test.code || 'N/A'})`);
      }
    }
    console.log('');

    // ============================================
    // 4. UPDATE HCV ANTIBODY (HCV001)
    // ============================================
    console.log('4️⃣ Updating HCV Antibody template...');
    const hcvTest = await prisma.labTest.findUnique({
      where: { code: 'HCV001' },
      include: { resultFields: true }
    });

    if (hcvTest) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: hcvTest.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hcvTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative (-ve)',
            options: ['Negative (-ve)', 'Positive (+ve)'], // Changed from Non-Reactive/Reactive
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hcvTest.id,
            fieldName: 'remarks',
            label: 'Remarks',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 2
          }
        ]
      });
      console.log('   ✅ Updated HCV Antibody (HCV001)\n');
    } else {
      console.log('   ⚠️  HCV Antibody (HCV001) not found\n');
    }

    // ============================================
    // 5. UPDATE HBsAg (HBSAG001)
    // ============================================
    console.log('5️⃣ Updating HBsAg template...');
    const hbsagTest = await prisma.labTest.findUnique({
      where: { code: 'HBSAG001' },
      include: { resultFields: true }
    });

    if (hbsagTest) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: hbsagTest.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hbsagTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', 'Positive'], // Changed from Non-Reactive/Reactive
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hbsagTest.id,
            fieldName: 'remarks',
            label: 'Remarks',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 2
          }
        ]
      });
      console.log('   ✅ Updated HBsAg (HBSAG001)\n');
    } else {
      console.log('   ⚠️  HBsAg (HBSAG001) not found\n');
    }

    console.log('✅ All lab template updates completed successfully!');
  } catch (error) {
    console.error('❌ Error updating lab templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateLabTemplatesComprehensive()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
