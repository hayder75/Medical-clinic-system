const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to move ESR from CBC group to standalone Hematology tests
 */

async function moveESR() {
  console.log('🔧 Moving ESR to standalone Hematology tests...\n');

  try {
    // Find ESR test
    const esrTest = await prisma.labTest.findFirst({
      where: { code: 'ESR001' }
    });
    
    if (!esrTest) {
      console.log('⚠️  ESR test not found. It may already be standalone or doesn\'t exist.');
      return;
    }

    // Check if it's in a group
    if (esrTest.groupId) {
      // Move to standalone (remove groupId)
      await prisma.labTest.update({
        where: { id: esrTest.id },
        data: { 
          groupId: null,
          displayOrder: 9 // Before Reticulocyte Count (10)
        }
      });
      
      console.log('✅ ESR moved from CBC group to standalone Hematology tests');
      console.log(`   Display Order: 9 (before Reticulocyte Count)`);
    } else {
      // Already standalone, just ensure display order
      await prisma.labTest.update({
        where: { id: esrTest.id },
        data: { 
          displayOrder: 9
        }
      });
      
      console.log('✅ ESR is already standalone, display order updated to 9');
    }

    // Update display orders for other standalone tests
    const standaloneHematology = await prisma.labTest.findMany({
      where: {
        category: 'Hematology',
        groupId: null,
        isActive: true
      },
      orderBy: { displayOrder: 'asc' }
    });

    // Reorder: ESR (9), Reticulocyte (10), Bleeding Time (11), Clotting Time (12), Peripheral Blood Film (13)
    const orderMap = {
      'ESR001': 9,
      'RET001': 10,
      'BT001': 11,
      'CT001': 12,
      'BGRH001': 13,
      'PBF001': 14
    };

    for (const test of standaloneHematology) {
      if (orderMap[test.code] !== undefined) {
        await prisma.labTest.update({
          where: { id: test.id },
          data: { displayOrder: orderMap[test.code] }
        });
      }
    }

    console.log('✅ Standalone Hematology tests reordered');

    console.log('\n✅ All updates completed successfully!\n');

  } catch (error) {
    console.error('❌ Error moving ESR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  moveESR()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { moveESR };

