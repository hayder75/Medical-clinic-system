/**
 * Script to add result fields (templates) for specific lab tests:
 * - Weil-Felix Test (WEIL001)
 * - Widal Test (WIDAL001)
 * - VDRL (VDRL001)
 * - Blood Film / PICT Malaria (PICT001)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addLabTestTemplates() {
  console.log('🔬 Adding lab test result fields (templates)...\n');

  try {
    // 1. Weil-Felix Test (WEIL001)
    const weilTest = await prisma.labTest.findUnique({
      where: { code: 'WEIL001' },
      include: { resultFields: true }
    });

    if (weilTest) {
      // Delete existing fields and recreate
      await prisma.labTestResultField.deleteMany({
        where: { testId: weilTest.id }
      });

      // Add new fields
      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: weilTest.id,
            fieldName: 'ox2',
            label: 'OX-2',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: weilTest.id,
            fieldName: 'ox19',
            label: 'OX-19',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 2
          },
          {
            testId: weilTest.id,
            fieldName: 'oxk',
            label: 'OX-K',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 3
          },
          {
            testId: weilTest.id,
            fieldName: 'interpretation',
            label: 'Interpretation',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 4
          }
        ]
      });
      console.log('✅ Added result fields for Weil-Felix Test (WEIL001)');
    } else {
      console.log('⚠️  Weil-Felix Test (WEIL001) not found');
    }

    // 2. Widal Test (WIDAL001)
    const widalTest = await prisma.labTest.findUnique({
      where: { code: 'WIDAL001' },
      include: { resultFields: true }
    });

    if (widalTest) {
      // Delete existing fields and recreate
      await prisma.labTestResultField.deleteMany({
        where: { testId: widalTest.id }
      });

      // Add new fields
      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: widalTest.id,
            fieldName: 'o_antigen',
            label: 'O Antigen',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: widalTest.id,
            fieldName: 'h_antigen',
            label: 'H Antigen',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 2
          },
          {
            testId: widalTest.id,
            fieldName: 'ah_antigen',
            label: 'AH Antigen',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 3
          },
          {
            testId: widalTest.id,
            fieldName: 'bh_antigen',
            label: 'BH Antigen',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', '1:40', '1:80', '1:160', '1:320', '1:640', '1:1280'],
            isRequired: true,
            displayOrder: 4
          },
          {
            testId: widalTest.id,
            fieldName: 'interpretation',
            label: 'Interpretation',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 5
          }
        ]
      });
      console.log('✅ Added result fields for Widal Test (WIDAL001)');
    } else {
      console.log('⚠️  Widal Test (WIDAL001) not found');
    }

    // 3. VDRL (VDRL001)
    const vdrlTest = await prisma.labTest.findUnique({
      where: { code: 'VDRL001' },
      include: { resultFields: true }
    });

    if (vdrlTest) {
      // Delete existing fields and recreate
      await prisma.labTestResultField.deleteMany({
        where: { testId: vdrlTest.id }
      });

      // Add new fields
      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: vdrlTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Non-reactive',
            options: ['Non-reactive', 'Reactive', 'Weakly Reactive'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: vdrlTest.id,
            fieldName: 'titer',
            label: 'Titer (if reactive)',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['1:1', '1:2', '1:4', '1:8', '1:16', '1:32', '1:64', '1:128', '1:256', '1:512'],
            isRequired: false,
            displayOrder: 2
          },
          {
            testId: vdrlTest.id,
            fieldName: 'interpretation',
            label: 'Interpretation',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 3
          }
        ]
      });
      console.log('✅ Added result fields for VDRL (VDRL001)');
    } else {
      console.log('⚠️  VDRL (VDRL001) not found');
    }

    // 4. Blood Film / PICT Malaria (PICT001)
    const pictTest = await prisma.labTest.findUnique({
      where: { code: 'PICT001' },
      include: { resultFields: true }
    });

    if (pictTest) {
      // Delete existing fields and recreate
      await prisma.labTestResultField.deleteMany({
        where: { testId: pictTest.id }
      });

      // Add new fields
      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: pictTest.id,
            fieldName: 'parasite_detected',
            label: 'Parasite Detected',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', 'Positive'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: pictTest.id,
            fieldName: 'species',
            label: 'Species (if positive)',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['Plasmodium falciparum', 'Plasmodium vivax', 'Plasmodium malariae', 'Plasmodium ovale', 'Mixed infection'],
            isRequired: false,
            displayOrder: 2
          },
          {
            testId: pictTest.id,
            fieldName: 'parasite_count',
            label: 'Parasite Count',
            fieldType: 'text',
            unit: 'parasites/μL',
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 3
          },
          {
            testId: pictTest.id,
            fieldName: 'parasite_density',
            label: 'Parasite Density',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['Low (<1%)', 'Moderate (1-5%)', 'High (5-10%)', 'Very High (>10%)'],
            isRequired: false,
            displayOrder: 4
          },
          {
            testId: pictTest.id,
            fieldName: 'red_blood_cells',
            label: 'Red Blood Cells',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 5
          },
          {
            testId: pictTest.id,
            fieldName: 'white_blood_cells',
            label: 'White Blood Cells',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 6
          },
          {
            testId: pictTest.id,
            fieldName: 'platelets',
            label: 'Platelets',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 7
          },
          {
            testId: pictTest.id,
            fieldName: 'interpretation',
            label: 'Interpretation',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 8
          }
        ]
      });
      console.log('✅ Added result fields for Blood Film / PICT Malaria (PICT001)');
    } else {
      console.log('⚠️  Blood Film / PICT Malaria (PICT001) not found');
    }

    console.log('\n✅ All lab test templates added successfully!');
  } catch (error) {
    console.error('❌ Error adding lab test templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addLabTestTemplates()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });

