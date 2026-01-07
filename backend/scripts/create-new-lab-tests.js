/**
 * Script to create new lab test templates:
 * - H. pylori Antigen (Stool Test)
 * - H. pylori Antibody (Serology)
 * - ESR (Erythrocyte Sedimentation Rate) - Update if exists, create if not
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createNewLabTests() {
  console.log('🔬 Creating new lab test templates...\n');

  try {
    // 1. H. pylori Antigen (Stool Test)
    console.log('📋 Creating H. pylori Antigen (Stool Test)...');
    let hpyloriAgTest = await prisma.labTest.findUnique({
      where: { code: 'HPYLORIAG001' }
    });

    if (!hpyloriAgTest) {
      // Create Service first
      const hpyloriAgService = await prisma.service.upsert({
        where: { code: 'HPYLORIAG001' },
        update: {},
        create: {
          code: 'HPYLORIAG001',
          name: 'H. pylori Antigen (Stool Test)',
          category: 'LAB',
          price: 150.00,
          description: 'H. pylori Antigen detection in stool sample',
          isActive: true
        }
      });

      // Create LabTest
      hpyloriAgTest = await prisma.labTest.create({
        data: {
          code: 'HPYLORIAG001',
          name: 'H. pylori Antigen (Stool Test)',
          category: 'Microbiology',
          description: 'Detection of Helicobacter pylori antigen in stool',
          price: 150.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: hpyloriAgService.id,
          groupId: null, // Standalone
          displayOrder: 0
        }
      });

      // Create result fields
      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hpyloriAgTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', 'Positive'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hpyloriAgTest.id,
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

      console.log('   ✅ Created H. pylori Antigen (Stool Test)');
    } else {
      console.log('   ℹ️  H. pylori Antigen already exists, skipping...');
    }

    // 2. H. pylori Antibody (Serology)
    console.log('\n📋 Creating H. pylori Antibody (Serology)...');
    let hpyloriAbTest = await prisma.labTest.findUnique({
      where: { code: 'HPYLORIAB001' }
    });

    if (!hpyloriAbTest) {
      // Create Service first
      const hpyloriAbService = await prisma.service.upsert({
        where: { code: 'HPYLORIAB001' },
        update: {},
        create: {
          code: 'HPYLORIAB001',
          name: 'H. pylori Antibody (Serology)',
          category: 'LAB',
          price: 200.00,
          description: 'H. pylori antibody serology test',
          isActive: true
        }
      });

      // Create LabTest
      hpyloriAbTest = await prisma.labTest.create({
        data: {
          code: 'HPYLORIAB001',
          name: 'H. pylori Antibody (Serology)',
          category: 'Serology',
          description: 'Detection of Helicobacter pylori antibodies (IgG/IgM)',
          price: 200.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: hpyloriAbService.id,
          groupId: null, // Standalone for now, can be added to Serology Panel later
          displayOrder: 0
        }
      });

      // Create result fields
      await prisma.labTestResultField.createMany({
        data: [
          {
            testId: hpyloriAbTest.id,
            fieldName: 'antibody_type',
            label: 'Antibody Type',
            fieldType: 'select',
            unit: null,
            normalRange: null,
            options: ['IgG', 'IgM', 'IgG & IgM'],
            isRequired: true,
            displayOrder: 1
          },
          {
            testId: hpyloriAbTest.id,
            fieldName: 'result',
            label: 'Result',
            fieldType: 'select',
            unit: null,
            normalRange: 'Negative',
            options: ['Negative', 'Positive', 'Strongly Reactive'],
            isRequired: true,
            displayOrder: 2
          },
          {
            testId: hpyloriAbTest.id,
            fieldName: 'remarks',
            label: 'Remarks',
            fieldType: 'textarea',
            unit: null,
            normalRange: null,
            options: null,
            isRequired: false,
            displayOrder: 3
          }
        ]
      });

      console.log('   ✅ Created H. pylori Antibody (Serology)');
    } else {
      console.log('   ℹ️  H. pylori Antibody already exists, skipping...');
    }

    // 3. ESR (Erythrocyte Sedimentation Rate)
    console.log('\n📋 Creating/Updating ESR (Erythrocyte Sedimentation Rate)...');
    let esrTest = await prisma.labTest.findUnique({
      where: { code: 'ESR001' },
      include: { resultFields: true }
    });

    if (!esrTest) {
      // Create Service first
      const esrService = await prisma.service.upsert({
        where: { code: 'ESR001' },
        update: {},
        create: {
          code: 'ESR001',
          name: 'ESR (Erythrocyte Sedimentation Rate)',
          category: 'LAB',
          price: 100.00,
          description: 'Erythrocyte Sedimentation Rate test',
          isActive: true
        }
      });

      // Create LabTest
      esrTest = await prisma.labTest.create({
        data: {
          code: 'ESR001',
          name: 'ESR (Erythrocyte Sedimentation Rate)',
          category: 'Hematology',
          description: 'Erythrocyte Sedimentation Rate - inflammation marker',
          price: 100.00,
          unit: 'mm/hr',
          isActive: true,
          serviceId: esrService.id,
          groupId: null, // Standalone
          displayOrder: 0
        }
      });

      console.log('   ✅ Created ESR test');
    } else {
      // Update existing ESR test
      await prisma.labTest.update({
        where: { id: esrTest.id },
        data: {
          category: 'Hematology',
          description: 'Erythrocyte Sedimentation Rate - inflammation marker',
          price: 100.00,
          unit: 'mm/hr',
          isActive: true,
          groupId: null // Ensure it's standalone
        }
      });

      // Delete old result fields and create new ones
      await prisma.labTestResultField.deleteMany({
        where: { testId: esrTest.id }
      });

      console.log('   ✅ Updated existing ESR test');
    }

    // Create/Update result fields for ESR
    await prisma.labTestResultField.createMany({
      data: [
        {
          testId: esrTest.id,
          fieldName: 'result',
          label: 'Result (mm/hr)',
          fieldType: 'number',
          unit: 'mm/hr',
          normalRange: 'Male: 0-15 mm/hr, Female: 0-20 mm/hr',
          options: null,
          isRequired: true,
          displayOrder: 1
        },
        {
          testId: esrTest.id,
          fieldName: 'reference_range',
          label: 'Reference Range',
          fieldType: 'text',
          unit: null,
          normalRange: null,
          options: null,
          isRequired: false,
          displayOrder: 2
        },
        {
          testId: esrTest.id,
          fieldName: 'remarks',
          label: 'Remarks',
          fieldType: 'textarea',
          unit: null,
          normalRange: null,
          options: null,
          isRequired: false,
          displayOrder: 3
        }
      ]
    });

    console.log('   ✅ Created/Updated ESR result fields');

    console.log('\n✅ All new lab tests created/updated successfully!');
    console.log('\n📊 Summary:');
    console.log('   - H. pylori Antigen (Stool Test): HPYLORIAG001');
    console.log('   - H. pylori Antibody (Serology): HPYLORIAB001');
    console.log('   - ESR (Erythrocyte Sedimentation Rate): ESR001');

  } catch (error) {
    console.error('❌ Error creating new lab tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createNewLabTests()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createNewLabTests };

