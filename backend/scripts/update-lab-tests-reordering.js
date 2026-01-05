const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to update lab tests:
 * 1. Rename HIV to "HIV Test (PICT)"
 * 2. Remove PICT – Malaria (set isActive to false)
 * 3. Reorder Serology tests: Widal (1), Weil-Felix (2), HBsAg (3), HCG (4)
 * 4. Move ESR, Blood Group & Rh, and Peripheral Blood Film from CBC group to standalone
 */

async function updateLabTests() {
  console.log('🔧 Updating lab tests...\n');

  try {
    // 1. Rename HIV to "HIV Test (PICT)"
    const hivTest = await prisma.labTest.findFirst({
      where: { code: 'HIV001' }
    });
    
    if (hivTest) {
      await prisma.labTest.update({
        where: { id: hivTest.id },
        data: { name: 'HIV Test (PICT)' }
      });
      
      // Also update the service name if it exists
      const hivService = await prisma.service.findFirst({
        where: { code: 'HIV001' }
      });
      
      if (hivService) {
        await prisma.service.update({
          where: { id: hivService.id },
          data: { name: 'HIV Test (PICT)' }
        });
      }
      
      console.log('✅ Renamed HIV to "HIV Test (PICT)"');
    }

    // 2. Remove PICT – Malaria (set isActive to false)
    const pictMalaria = await prisma.labTest.findFirst({
      where: { code: 'PICT001' }
    });
    
    if (pictMalaria) {
      await prisma.labTest.update({
        where: { id: pictMalaria.id },
        data: { isActive: false }
      });
      
      // Also deactivate the service
      const pictService = await prisma.service.findFirst({
        where: { code: 'PICT001' }
      });
      
      if (pictService) {
        await prisma.service.update({
          where: { id: pictService.id },
          data: { isActive: false }
        });
      }
      
      console.log('✅ Deactivated PICT – Malaria');
    }

    // 3. Reorder Serology tests
    // Find Serology group (might have different names)
    const serologyGroup = await prisma.labTestGroup.findFirst({
      where: { category: 'Serology' }
    });
    
    if (serologyGroup) {
      const serologyTests = await prisma.labTest.findMany({
        where: { groupId: serologyGroup.id, isActive: true }
      });
      
      // Update display orders (Widal first, then Weil-Felix, then HBsAg, then HCG)
      const updates = {
        'WIDAL001': 1,    // Widal Test
        'WEIL001': 2,     // Weil-Felix Test
        'HBSAG001': 3,    // HBsAg
        'HCG001': 4,      // HCG (Qualitative)
        'RPR001': 5,      // RPR
        'RF001': 6,       // Rheumatoid Factor
        'ASO001': 7,      // ASO Titer
        'HCV001': 8,      // HCV Antibody
        'VDRL001': 9,     // VDRL
        'HIV001': 10      // HIV Test (PICT)
      };
      
      let updatedCount = 0;
      for (const test of serologyTests) {
        if (updates[test.code] !== undefined) {
          await prisma.labTest.update({
            where: { id: test.id },
            data: { displayOrder: updates[test.code] }
          });
          updatedCount++;
        }
      }
      
      console.log(`✅ Reordered ${updatedCount} Serology tests`);
    } else {
      console.log('⚠️  Serology group not found');
    }

    // 4. Move ESR, Blood Group & Rh from CBC group to standalone
    const cbcGroup = await prisma.labTestGroup.findFirst({
      where: { category: 'Hematology', name: 'Complete Blood Count (CBC)' }
    });
    
    if (cbcGroup) {
      // Find ESR and Blood Group & Rh tests
      const testsToMove = await prisma.labTest.findMany({
        where: {
          groupId: cbcGroup.id,
          code: { in: ['ESR001', 'BGRH001'] }
        }
      });
      
      for (const test of testsToMove) {
        await prisma.labTest.update({
          where: { id: test.id },
          data: { 
            groupId: null,
            displayOrder: test.displayOrder // Keep same display order for now
          }
        });
      }
      
      console.log('✅ Moved ESR and Blood Group & Rh from CBC group to standalone');
    }

    // 5. Move Peripheral Blood Film to standalone (it should already be standalone, but ensure it)
    const pbfTest = await prisma.labTest.findFirst({
      where: { code: 'PBF001' }
    });
    
    if (pbfTest && pbfTest.groupId) {
      await prisma.labTest.update({
        where: { id: pbfTest.id },
        data: { groupId: null }
      });
      console.log('✅ Ensured Peripheral Blood Film is standalone');
    }

    // 6. Reorder standalone Hematology tests: ESR, Blood Group & Rh, then others
    const standaloneHematology = await prisma.labTest.findMany({
      where: {
        category: 'Hematology',
        groupId: null,
        isActive: true
      }
    });
    
    // Define order for standalone tests
    const standaloneOrder = {
      'ESR001': 1,
      'BGRH001': 2,
      'RET001': 3,
      'BT001': 4,
      'CT001': 5,
      'PBF001': 6
    };
    
    for (const test of standaloneHematology) {
      if (standaloneOrder[test.code]) {
        await prisma.labTest.update({
          where: { id: test.id },
          data: { displayOrder: standaloneOrder[test.code] }
        });
      }
    }
    
    console.log('✅ Reordered standalone Hematology tests');

    console.log('\n✅ All updates completed successfully!\n');

  } catch (error) {
    console.error('❌ Error updating lab tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateLabTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { updateLabTests };

