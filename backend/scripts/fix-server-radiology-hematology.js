const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The 9 ultrasound tests we should keep
const keepRadiologyCodes = ['US001', 'US002', 'US003', 'US004', 'US005', 'US006', 'US007', 'US008', 'US009'];

async function fixRadiologyAndHematology() {
  try {
    console.log('🔧 Fixing radiology and hematology on server...\n');

    // ========== RADIOLOGY: Remove non-ultrasound tests ==========
    console.log('📋 Step 1: Cleaning up radiology tests...');
    const allRadiology = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      include: {
        service: {
          select: { id: true, code: true, name: true, isActive: true }
        }
      }
    });

    const toDelete = [];
    const toKeep = [];

    for (const invType of allRadiology) {
      const code = invType.service?.code;
      if (code && keepRadiologyCodes.includes(code)) {
        toKeep.push(invType);
      } else {
        toDelete.push(invType);
      }
    }

    console.log(`   Found ${allRadiology.length} radiology tests`);
    console.log(`   Keeping: ${toKeep.length} (${toKeep.map(t => t.service?.code).join(', ')})`);
    console.log(`   Deleting: ${toDelete.length} (${toDelete.map(t => t.service?.code).join(', ')})`);

    for (const invType of toDelete) {
      try {
        // Check for results
        const resultCount = await prisma.radiologyResult.count({
          where: { testTypeId: invType.id }
        });

        if (resultCount > 0) {
          // Delete results first
          const results = await prisma.radiologyResult.findMany({
            where: { testTypeId: invType.id },
            select: { id: true }
          });

          for (const result of results) {
            await prisma.radiologyResultFile.deleteMany({
              where: { resultId: result.id }
            });
          }

          await prisma.radiologyResult.deleteMany({
            where: { testTypeId: invType.id }
          });
        }

        // Delete template if exists
        await prisma.radiologyTemplate.deleteMany({
          where: { investigationTypeId: invType.id }
        });

        // Delete investigation type
        await prisma.investigationType.delete({
          where: { id: invType.id }
        });

        // Check for billing before deleting service
        if (invType.service) {
          const billingCount = await prisma.billingService.count({
            where: { serviceId: invType.service.id }
          });

          if (billingCount > 0) {
            await prisma.service.update({
              where: { id: invType.service.id },
              data: { isActive: false }
            });
            console.log(`   ⚠️  Deactivated service: ${invType.service.name} (has billing)`);
          } else {
            await prisma.service.delete({
              where: { id: invType.service.id }
            });
            console.log(`   ✅ Deleted: ${invType.service.name}`);
          }
        }
      } catch (error) {
        console.error(`   ❌ Error deleting ${invType.name}:`, error.message);
      }
    }

    // ========== HEMATOLOGY: Keep only 4 tests (CBC, ESR, Blood Group & Rh, Blood Film) ==========
    console.log('\n📋 Step 2: Fixing hematology tests...');
    
    const keepHematologyCodes = ['CBC001', 'ESR001', 'BGRH001', 'PICT001'];
    
    // Get all hematology tests
    const allHematology = await prisma.labTest.findMany({
      where: { category: 'Hematology' },
      include: { service: true }
    });

    console.log(`   Found ${allHematology.length} hematology tests`);

    for (const test of allHematology) {
      const shouldKeep = keepHematologyCodes.includes(test.code);
      
      if (shouldKeep) {
        // Activate and ensure correct settings
        if (!test.isActive) {
          await prisma.labTest.update({
            where: { id: test.id },
            data: { isActive: true }
          });
          console.log(`   ✅ Activated: ${test.name} (${test.code})`);
        }

        if (test.service && !test.service.isActive) {
          await prisma.service.update({
            where: { id: test.service.id },
            data: { isActive: true }
          });
          console.log(`   ✅ Activated service for: ${test.name}`);
        }

        // Ensure it's standalone (no group)
        if (test.groupId) {
          await prisma.labTest.update({
            where: { id: test.id },
            data: { groupId: null }
          });
          console.log(`   ✅ Set ${test.name} to standalone`);
        }
      } else {
        // Deactivate tests we don't want
        if (test.isActive) {
          await prisma.labTest.update({
            where: { id: test.id },
            data: { isActive: false }
          });
          console.log(`   ⚠️  Deactivated: ${test.name} (${test.code})`);
        }

        if (test.service && test.service.isActive) {
          await prisma.service.update({
            where: { id: test.service.id },
            data: { isActive: false }
          });
          console.log(`   ⚠️  Deactivated service for: ${test.name}`);
        }
      }
    }

    // ========== VERIFY FINAL STATE ==========
    console.log('\n📊 Final verification...');

    const finalRadiology = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      include: {
        service: {
          select: { code: true, name: true, isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`\n✅ Radiology tests: ${finalRadiology.length} (should be 9)`);
    finalRadiology.forEach((r, i) => {
      const status = r.service?.isActive === false ? ' [INACTIVE]' : '';
      console.log(`   ${i + 1}. ${r.name} - ${r.service?.code}${status}`);
    });

    const finalHematology = await prisma.labTest.findMany({
      where: {
        category: 'Hematology',
        isActive: true,
        code: { in: keepHematologyCodes }
      },
      include: {
        service: {
          select: { code: true, name: true, isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`\n✅ Active Hematology tests: ${finalHematology.length} (should be 4)`);
    finalHematology.forEach((r, i) => {
      const status = r.service?.isActive === false ? ' [SERVICE INACTIVE]' : '';
      console.log(`   ${i + 1}. ${r.name} - ${r.code}${status}`);
    });

    console.log('\n✨ Done!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixRadiologyAndHematology()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

