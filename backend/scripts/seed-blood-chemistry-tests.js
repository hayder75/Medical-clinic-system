/**
 * Script to seed Blood Chemistry tests
 * Creates groups and tests for: Lipid Profile, Liver Function, Kidney Function, Thyroid Function, etc.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedBloodChemistryTests() {
  console.log('🧪 Seeding Blood Chemistry tests...\n');

  try {
    // 1. Lipid Profile Group
    let lipidGroup = await prisma.labTestGroup.findFirst({
      where: { 
        category: 'Blood Chemistry',
        name: 'Lipid Profile'
      }
    });

    if (!lipidGroup) {
      lipidGroup = await prisma.labTestGroup.create({
        data: {
          name: 'Lipid Profile',
          category: 'Blood Chemistry',
          description: 'Complete lipid profile panel',
          displayOrder: 1,
          isActive: true
        }
      });
      console.log('✅ Created Lipid Profile group');
    }

    // Create Lipid Profile test
    const lipidService = await prisma.service.upsert({
      where: { code: 'LIPID001' },
      update: {},
      create: {
        code: 'LIPID001',
        name: 'Lipid Profile',
        category: 'LAB',
        price: 300.00,
        description: 'Complete lipid profile including Total Cholesterol, Triglycerides, HDL, LDL',
        isActive: true
      }
    });

    let lipidTest = await prisma.labTest.findUnique({
      where: { code: 'LIPID001' }
    });

    if (!lipidTest) {
      lipidTest = await prisma.labTest.create({
        data: {
          code: 'LIPID001',
          name: 'Lipid Profile',
          category: 'Blood Chemistry',
          description: 'Complete lipid profile',
          price: 300.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: lipidService.id,
          groupId: lipidGroup.id,
          displayOrder: 1
        }
      });

      await prisma.labTestResultField.createMany({
        data: [
          { testId: lipidTest.id, fieldName: 'total_cholesterol', label: 'Total Cholesterol', fieldType: 'number', unit: 'mg/dL', normalRange: '< 200', isRequired: true, displayOrder: 1 },
          { testId: lipidTest.id, fieldName: 'triglycerides', label: 'Triglycerides', fieldType: 'number', unit: 'mg/dL', normalRange: '< 150', isRequired: true, displayOrder: 2 },
          { testId: lipidTest.id, fieldName: 'hdl', label: 'HDL Cholesterol', fieldType: 'number', unit: 'mg/dL', normalRange: '> 40 (M), > 50 (F)', isRequired: true, displayOrder: 3 },
          { testId: lipidTest.id, fieldName: 'ldl', label: 'LDL Cholesterol', fieldType: 'number', unit: 'mg/dL', normalRange: '< 100', isRequired: true, displayOrder: 4 },
          { testId: lipidTest.id, fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false, displayOrder: 5 }
        ]
      });
      console.log('   ✅ Created Lipid Profile test');
    } else {
      await prisma.labTest.update({
        where: { id: lipidTest.id },
        data: { groupId: lipidGroup.id, category: 'Blood Chemistry', isActive: true }
      });
      console.log('   ✅ Updated Lipid Profile test');
    }

    // 2. Liver Function Test (LFT) Group
    let lftGroup = await prisma.labTestGroup.findFirst({
      where: { 
        category: 'Blood Chemistry',
        name: 'Liver Function Test (LFT)'
      }
    });

    if (!lftGroup) {
      lftGroup = await prisma.labTestGroup.create({
        data: {
          name: 'Liver Function Test (LFT)',
          category: 'Blood Chemistry',
          description: 'Complete liver function panel',
          displayOrder: 2,
          isActive: true
        }
      });
      console.log('✅ Created Liver Function Test group');
    }

    const lftService = await prisma.service.upsert({
      where: { code: 'LFT001' },
      update: {},
      create: {
        code: 'LFT001',
        name: 'Liver Function Test (LFT)',
        category: 'LAB',
        price: 350.00,
        description: 'Complete liver function test panel',
        isActive: true
      }
    });

    let lftTest = await prisma.labTest.findUnique({
      where: { code: 'LFT001' }
    });

    if (!lftTest) {
      lftTest = await prisma.labTest.create({
        data: {
          code: 'LFT001',
          name: 'Liver Function Test (LFT)',
          category: 'Blood Chemistry',
          description: 'Complete liver function panel',
          price: 350.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: lftService.id,
          groupId: lftGroup.id,
          displayOrder: 1
        }
      });

      await prisma.labTestResultField.createMany({
        data: [
          { testId: lftTest.id, fieldName: 'alt', label: 'ALT (Alanine Aminotransferase)', fieldType: 'number', unit: 'U/L', normalRange: '7-56', isRequired: true, displayOrder: 1 },
          { testId: lftTest.id, fieldName: 'ast', label: 'AST (Aspartate Aminotransferase)', fieldType: 'number', unit: 'U/L', normalRange: '10-40', isRequired: true, displayOrder: 2 },
          { testId: lftTest.id, fieldName: 'alp', label: 'ALP (Alkaline Phosphatase)', fieldType: 'number', unit: 'U/L', normalRange: '44-147', isRequired: true, displayOrder: 3 },
          { testId: lftTest.id, fieldName: 'total_bilirubin', label: 'Total Bilirubin', fieldType: 'number', unit: 'mg/dL', normalRange: '0.1-1.2', isRequired: true, displayOrder: 4 },
          { testId: lftTest.id, fieldName: 'direct_bilirubin', label: 'Direct Bilirubin', fieldType: 'number', unit: 'mg/dL', normalRange: '0.0-0.3', isRequired: true, displayOrder: 5 },
          { testId: lftTest.id, fieldName: 'total_protein', label: 'Total Protein', fieldType: 'number', unit: 'g/dL', normalRange: '6.0-8.3', isRequired: true, displayOrder: 6 },
          { testId: lftTest.id, fieldName: 'albumin', label: 'Albumin', fieldType: 'number', unit: 'g/dL', normalRange: '3.5-5.0', isRequired: true, displayOrder: 7 },
          { testId: lftTest.id, fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false, displayOrder: 8 }
        ]
      });
      console.log('   ✅ Created Liver Function Test');
    } else {
      await prisma.labTest.update({
        where: { id: lftTest.id },
        data: { groupId: lftGroup.id, category: 'Blood Chemistry', isActive: true }
      });
      console.log('   ✅ Updated Liver Function Test');
    }

    // 3. Kidney Function Test (KFT) Group
    let kftGroup = await prisma.labTestGroup.findFirst({
      where: { 
        category: 'Blood Chemistry',
        name: 'Kidney Function Test (KFT)'
      }
    });

    if (!kftGroup) {
      kftGroup = await prisma.labTestGroup.create({
        data: {
          name: 'Kidney Function Test (KFT)',
          category: 'Blood Chemistry',
          description: 'Complete kidney function panel',
          displayOrder: 3,
          isActive: true
        }
      });
      console.log('✅ Created Kidney Function Test group');
    }

    const kftService = await prisma.service.upsert({
      where: { code: 'KFT001' },
      update: {},
      create: {
        code: 'KFT001',
        name: 'Kidney Function Test (KFT)',
        category: 'LAB',
        price: 280.00,
        description: 'Complete kidney function test panel',
        isActive: true
      }
    });

    let kftTest = await prisma.labTest.findUnique({
      where: { code: 'KFT001' }
    });

    if (!kftTest) {
      kftTest = await prisma.labTest.create({
        data: {
          code: 'KFT001',
          name: 'Kidney Function Test (KFT)',
          category: 'Blood Chemistry',
          description: 'Complete kidney function panel',
          price: 280.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: kftService.id,
          groupId: kftGroup.id,
          displayOrder: 1
        }
      });

      await prisma.labTestResultField.createMany({
        data: [
          { testId: kftTest.id, fieldName: 'urea', label: 'Urea', fieldType: 'number', unit: 'mg/dL', normalRange: '15-45', isRequired: true, displayOrder: 1 },
          { testId: kftTest.id, fieldName: 'creatinine', label: 'Creatinine', fieldType: 'number', unit: 'mg/dL', normalRange: '0.6-1.2 (M), 0.5-1.1 (F)', isRequired: true, displayOrder: 2 },
          { testId: kftTest.id, fieldName: 'uric_acid', label: 'Uric Acid', fieldType: 'number', unit: 'mg/dL', normalRange: '3.5-7.2 (M), 2.6-6.0 (F)', isRequired: true, displayOrder: 3 },
          { testId: kftTest.id, fieldName: 'sodium', label: 'Sodium (Na)', fieldType: 'number', unit: 'mEq/L', normalRange: '136-145', isRequired: true, displayOrder: 4 },
          { testId: kftTest.id, fieldName: 'potassium', label: 'Potassium (K)', fieldType: 'number', unit: 'mEq/L', normalRange: '3.5-5.0', isRequired: true, displayOrder: 5 },
          { testId: kftTest.id, fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false, displayOrder: 6 }
        ]
      });
      console.log('   ✅ Created Kidney Function Test');
    } else {
      await prisma.labTest.update({
        where: { id: kftTest.id },
        data: { groupId: kftGroup.id, category: 'Blood Chemistry', isActive: true }
      });
      console.log('   ✅ Updated Kidney Function Test');
    }

    // 4. Thyroid Function Test Group
    let thyroidGroup = await prisma.labTestGroup.findFirst({
      where: { 
        category: 'Blood Chemistry',
        name: 'Thyroid Function Test'
      }
    });

    if (!thyroidGroup) {
      thyroidGroup = await prisma.labTestGroup.create({
        data: {
          name: 'Thyroid Function Test',
          category: 'Blood Chemistry',
          description: 'Complete thyroid function panel',
          displayOrder: 4,
          isActive: true
        }
      });
      console.log('✅ Created Thyroid Function Test group');
    }

    const thyroidService = await prisma.service.upsert({
      where: { code: 'THYROID001' },
      update: {},
      create: {
        code: 'THYROID001',
        name: 'Thyroid Function Test',
        category: 'LAB',
        price: 400.00,
        description: 'Complete thyroid function test panel',
        isActive: true
      }
    });

    let thyroidTest = await prisma.labTest.findUnique({
      where: { code: 'THYROID001' }
    });

    if (!thyroidTest) {
      thyroidTest = await prisma.labTest.create({
        data: {
          code: 'THYROID001',
          name: 'Thyroid Function Test',
          category: 'Blood Chemistry',
          description: 'Complete thyroid function panel',
          price: 400.00,
          unit: 'UNIT',
          isActive: true,
          serviceId: thyroidService.id,
          groupId: thyroidGroup.id,
          displayOrder: 1
        }
      });

      await prisma.labTestResultField.createMany({
        data: [
          { testId: thyroidTest.id, fieldName: 'tsh', label: 'TSH (Thyroid Stimulating Hormone)', fieldType: 'number', unit: 'mIU/L', normalRange: '0.4-4.0', isRequired: true, displayOrder: 1 },
          { testId: thyroidTest.id, fieldName: 't3', label: 'T3 (Triiodothyronine)', fieldType: 'number', unit: 'ng/dL', normalRange: '80-200', isRequired: true, displayOrder: 2 },
          { testId: thyroidTest.id, fieldName: 't4', label: 'T4 (Thyroxine)', fieldType: 'number', unit: 'µg/dL', normalRange: '4.5-12.0', isRequired: true, displayOrder: 3 },
          { testId: thyroidTest.id, fieldName: 'ft3', label: 'Free T3', fieldType: 'number', unit: 'pg/mL', normalRange: '2.3-4.2', isRequired: false, displayOrder: 4 },
          { testId: thyroidTest.id, fieldName: 'ft4', label: 'Free T4', fieldType: 'number', unit: 'ng/dL', normalRange: '0.8-1.8', isRequired: false, displayOrder: 5 },
          { testId: thyroidTest.id, fieldName: 'remarks', label: 'Remarks', fieldType: 'textarea', unit: null, normalRange: null, isRequired: false, displayOrder: 6 }
        ]
      });
      console.log('   ✅ Created Thyroid Function Test');
    } else {
      await prisma.labTest.update({
        where: { id: thyroidTest.id },
        data: { groupId: thyroidGroup.id, category: 'Blood Chemistry', isActive: true }
      });
      console.log('   ✅ Updated Thyroid Function Test');
    }

    console.log('\n✅ Blood Chemistry tests seeding completed!');
    console.log('   Groups created: 4 (Lipid Profile, LFT, KFT, Thyroid Function)');
    console.log('   Tests created/updated: 4');

  } catch (error) {
    console.error('❌ Error seeding blood chemistry tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedBloodChemistryTests()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
