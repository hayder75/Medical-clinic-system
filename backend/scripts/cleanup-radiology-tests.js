const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The 9 ultrasound tests to keep (from the document)
const testsToKeep = [
  { name: 'Abdominal Ultrasound', code: 'US001' },
  { name: 'Ultrasound - Pelvis', code: 'US002' }, // PELVIC ULTRASOUND
  { name: 'Obstetric Ultrasound', code: 'US003' },
  { name: 'Thyroid Ultrasound', code: 'US004' },
  { name: 'Breast Ultrasound', code: 'US005' },
  { name: 'Doppler Ultrasound', code: 'US006' }
];

// Additional tests from document that might need to be created
const testsToCreate = [
  { name: 'Abdomino-Pelvic Ultrasound (Female)', code: 'US007' },
  { name: 'Abdomino-Pelvic Ultrasound (Male)', code: 'US008' },
  { name: 'Transvaginal Ultrasound (TVS)', code: 'US009' }
];

async function cleanupRadiologyTests() {
  try {
    console.log('🔍 Starting radiology test cleanup...\n');

    // Get all radiology investigation types
    const allRadiology = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      include: {
        service: {
          select: { id: true, code: true, name: true }
        },
        radiologyTemplate: true,
        _count: {
          select: {
            radiologyOrders: true,
            labOrders: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    console.log(`📋 Found ${allRadiology.length} radiology tests in database\n`);

    // Identify tests to keep (by code matching)
    const codesToKeep = testsToKeep.map(t => t.code.toLowerCase());
    const namesToKeep = testsToKeep.map(t => t.name.toLowerCase());
    
    const testsToDelete = [];
    const testsToDeactivate = [];
    const testsToKeepIds = [];

    for (const test of allRadiology) {
      const serviceCode = test.service?.code?.toLowerCase() || '';
      const testName = test.name.toLowerCase();
      
      // Check if this test should be kept
      const shouldKeep = codesToKeep.includes(serviceCode) || 
                        namesToKeep.some(n => testName.includes(n)) ||
                        (testName.includes('abdominal') && testName.includes('pelvic')) ||
                        testName.includes('abdomino-pelvic') ||
                        testName.includes('transvaginal') ||
                        testName.includes('tvs');

      if (shouldKeep) {
        testsToKeepIds.push(test.id);
        console.log(`✅ KEEP: ${test.name} (${test.service?.code || 'N/A'}) - ID: ${test.id}`);
      } else {
        // Check if it has orders
        const hasOrders = (test._count.radiologyOrders || 0) > 0 || 
                         (test._count.labOrders || 0) > 0;

        if (hasOrders) {
          testsToDeactivate.push(test);
          console.log(`⚠️  DEACTIVATE (has orders): ${test.name} (${test.service?.code || 'N/A'}) - ID: ${test.id}`);
        } else {
          testsToDelete.push(test);
          console.log(`🗑️  DELETE: ${test.name} (${test.service?.code || 'N/A'}) - ID: ${test.id}`);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Keep: ${testsToKeepIds.length}`);
    console.log(`   Delete: ${testsToDelete.length}`);
    console.log(`   Deactivate: ${testsToDeactivate.length}`);

    // Delete tests without orders
    let deletedCount = 0;
    let deactivatedCount = 0;
    let failedToDelete = [];
    for (const test of testsToDelete) {
      try {
        // Check for RadiologyResult records
        const resultCount = await prisma.radiologyResult.count({
          where: { testTypeId: test.id }
        });

        if (resultCount > 0) {
          // Get all result IDs
          const results = await prisma.radiologyResult.findMany({
            where: { testTypeId: test.id },
            select: { id: true }
          });

          // Delete RadiologyResultFile records first (foreign key constraint)
          for (const result of results) {
            await prisma.radiologyResultFile.deleteMany({
              where: { resultId: result.id }
            });
          }

          // Delete RadiologyResult records
          await prisma.radiologyResult.deleteMany({
            where: { testTypeId: test.id }
          });
          console.log(`   ✓ Deleted ${resultCount} result(s) for ${test.name}`);
        }

        // Delete radiology template if exists
        if (test.radiologyTemplate) {
          await prisma.radiologyTemplate.delete({
            where: { investigationTypeId: test.id }
          });
          console.log(`   ✓ Deleted template for ${test.name}`);
        }

        // Delete investigation type
        await prisma.investigationType.delete({
          where: { id: test.id }
        });

        // Delete service (check for billing records first)
        if (test.service) {
          // Check for BillingService records
          const billingServiceCount = await prisma.billingService.count({
            where: { serviceId: test.service.id }
          });

          if (billingServiceCount > 0) {
            // Deactivate instead of deleting if there are billing records
            await prisma.service.update({
              where: { id: test.service.id },
              data: { isActive: false }
            });
            console.log(`   ⚠️  Deactivated service (has billing records) for ${test.name}`);
          } else {
            await prisma.service.delete({
              where: { id: test.service.id }
            });
            console.log(`   ✓ Deleted service for ${test.name}`);
          }
        }

        deletedCount++;
        console.log(`   ✅ Deleted: ${test.name}`);
      } catch (error) {
        console.error(`   ❌ Error deleting ${test.name}:`, error.message);
        // If deletion fails, try to deactivate the service instead
        try {
          if (test.service) {
            await prisma.service.update({
              where: { id: test.service.id },
              data: { isActive: false }
            });
            console.log(`   ⚠️  Deactivated service instead: ${test.name}`);
            deactivatedCount++;
          } else {
            failedToDelete.push(test.name);
          }
        } catch (deactivateError) {
          console.error(`   ❌ Could not deactivate ${test.name}:`, deactivateError.message);
          failedToDelete.push(test.name);
        }
      }
    }

    // Deactivate tests with orders
    for (const test of testsToDeactivate) {
      try {
        // Deactivate investigation type
        await prisma.investigationType.update({
          where: { id: test.id },
          data: { isActive: false }
        });

        // Deactivate service
        if (test.service) {
          await prisma.service.update({
            where: { id: test.service.id },
            data: { isActive: false }
          });
        }

        deactivatedCount++;
        console.log(`   ✅ Deactivated: ${test.name}`);
      } catch (error) {
        console.error(`   ❌ Error deactivating ${test.name}:`, error.message);
      }
    }

    // Check which tests from document need to be created
    console.log(`\n🔍 Checking if additional tests need to be created...`);
    for (const testToCreate of testsToCreate) {
      const exists = allRadiology.some(t => 
        t.name.toLowerCase().includes(testToCreate.name.toLowerCase().split(' ')[0]) &&
        (t.name.toLowerCase().includes('pelvic') || t.name.toLowerCase().includes('transvaginal'))
      );

      if (!exists) {
        console.log(`   ℹ️  Need to create: ${testToCreate.name} (${testToCreate.code})`);
        console.log(`      This will be done manually or via admin panel.`);
      } else {
        console.log(`   ✓ Already exists: ${testToCreate.name}`);
      }
    }

    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Deleted: ${deletedCount}`);
    console.log(`   Deactivated: ${deactivatedCount}`);
    console.log(`   Kept: ${testsToKeepIds.length}`);
    if (failedToDelete.length > 0) {
      console.log(`   ⚠️  Failed to delete/deactivate: ${failedToDelete.join(', ')}`);
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupRadiologyTests()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

