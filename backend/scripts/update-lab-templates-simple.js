/**
 * Script to update lab test templates for medium clinic standards:
 * - HIV Test (HIV001)
 * - HBsAg (HBSAG001)
 * - HCG (HCG001, HCG002)
 * - Urinalysis
 * - Stool Examination
 * - CBC (CBC001) - Minimal with core/additional fields
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLabTemplates() {
  console.log('🔬 Updating lab test templates for medium clinic standards...\n');

  try {
    // 1. HIV Test (HIV001)
    const hivTest = await prisma.labTest.findUnique({
      where: { code: 'HIV001' },
      include: { resultFields: true }
    });

    if (hivTest) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: hivTest.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hivTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Non-Reactive',
            options: ['Non-Reactive', 'Reactive'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hivTest.id,
            fieldName: 'remarks',
            label: 'Remarks (only if Reactive)',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 2
          }
        ]
      });
      console.log('✅ Updated HIV Test (HIV001)');
    } else {
      console.log('⚠️  HIV Test (HIV001) not found');
    }

    // 2. HBsAg (HBSAG001)
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
            normalRange: 'Non-Reactive',
            options: ['Non-Reactive', 'Reactive'],
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
      console.log('✅ Updated HBsAg (HBSAG001)');
    } else {
      console.log('⚠️  HBsAg (HBSAG001) not found');
    }

    // 3. HCG Qualitative (HCG001)
    const hcgQualTest = await prisma.labTest.findUnique({
      where: { code: 'HCG001' },
      include: { resultFields: true }
    });

    if (hcgQualTest) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: hcgQualTest.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hcgQualTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Positive', 'Negative'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hcgQualTest.id,
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
      console.log('✅ Updated HCG Qualitative (HCG001)');
    } else {
      console.log('⚠️  HCG Qualitative (HCG001) not found');
    }

    // 4. HCG Quantitative (HCG002) - Keep simple, no weeks/hormone levels
    const hcgQuantTest = await prisma.labTest.findUnique({
      where: { code: 'HCG002' },
      include: { resultFields: true }
    });

    if (hcgQuantTest) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: hcgQuantTest.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hcgQuantTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Positive', 'Negative'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hcgQuantTest.id,
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
      console.log('✅ Updated HCG Quantitative (HCG002)');
    } else {
      console.log('⚠️  HCG Quantitative (HCG002) not found');
    }

    // 5. Urinalysis - Find by name or category
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
          // Microscopy (Optional)
          {
            testId: test.id,
            fieldName: 'pus_cells',
            label: 'Pus Cells',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['Few', 'Moderate', 'Many'],
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
            options: ['Few', 'Many'],
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
            options: ['Seen', 'Not seen'],
            isRequired: false,
            displayOrder: 9
          }
        ]
      });
      console.log(`✅ Updated Urinalysis: ${test.name} (${test.code || 'N/A'})`);
    }

    // 6. Stool Examination
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
      await prisma.labTestResultField.deleteMany({
        where: { testId: test.id }
      });

      await prisma.labTestResultField.createMany({
        data: [
          // Macroscopic
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
          // Microscopy
          {
            testId: test.id,
            fieldName: 'ova',
            label: 'Ova',
            fieldType: 'select',
            unit: null,
            normalRange: 'Not seen',
            options: ['Seen', 'Not seen'],
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
            options: ['Seen', 'Not seen'],
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
            options: ['Seen', 'Not seen'],
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
      console.log(`✅ Updated Stool Examination: ${test.name} (${test.code || 'N/A'})`);
    }

    // 7. CBC (CBC001) - Minimal with core/additional fields
    const cbcTest = await prisma.labTest.findUnique({
      where: { code: 'CBC001' },
      include: { resultFields: true }
    });

    if (cbcTest) {
      await prisma.labTestResultField.deleteMany({
        where: { testId: cbcTest.id }
      });

      // Core fields (MUST HAVE - always shown)
      await prisma.labTestResultField.createMany({
        data: [
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
            label: 'Hematocrit (HCT / PCV)',
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
          // Additional fields (OPTIONAL - only shown if filled)
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
          }
        ]
      });
      console.log('✅ Updated CBC (CBC001) - Minimal template with core/additional fields');
    } else {
      console.log('⚠️  CBC (CBC001) not found');
    }

    console.log('\n✅ All lab test templates updated successfully!');
  } catch (error) {
    console.error('❌ Error updating lab test templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateLabTemplates()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

