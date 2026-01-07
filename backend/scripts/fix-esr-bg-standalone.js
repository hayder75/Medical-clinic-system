const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script to move ESR and Blood Group & Rh from CBC group to standalone
 * and ensure they're independent categories
 */
async function fixESRAndBloodGroup() {
  console.log('🔧 Moving ESR and Blood Group & Rh to standalone...\n');

  try {
    // Find CBC group
    const cbcGroup = await prisma.labTestGroup.findFirst({
      where: { 
        name: { contains: 'Complete Blood Count', mode: 'insensitive' },
        category: 'Hematology'
      }
    });

    if (!cbcGroup) {
      console.log('⚠️  CBC group not found. Skipping...');
      return;
    }

    // Find ESR test
    const esrTest = await prisma.labTest.findFirst({
      where: { code: 'ESR001' }
    });

    // Find Blood Group & Rh test
    const bgTest = await prisma.labTest.findFirst({
      where: { code: 'BGRH001' }
    });

    // Update ESR to standalone
    if (esrTest) {
      await prisma.labTest.update({
        where: { id: esrTest.id },
        data: { 
          groupId: null,
          category: 'Hematology',
          displayOrder: 9
        }
      });
      console.log('✅ ESR moved to standalone (removed from CBC group)');
    } else {
      console.log('⚠️  ESR test not found');
    }

    // Update Blood Group & Rh to standalone
    if (bgTest) {
      await prisma.labTest.update({
        where: { id: bgTest.id },
        data: { 
          groupId: null,
          category: 'Hematology',
          displayOrder: 10
        }
      });
      console.log('✅ Blood Group & Rh moved to standalone (removed from CBC group)');
    } else {
      console.log('⚠️  Blood Group & Rh test not found');
    }

    // Verify they're now standalone
    const standaloneESR = await prisma.labTest.findFirst({
      where: { code: 'ESR001', groupId: null }
    });
    const standaloneBG = await prisma.labTest.findFirst({
      where: { code: 'BGRH001', groupId: null }
    });

    if (standaloneESR && standaloneBG) {
      console.log('\n✅ Both tests are now standalone!');
      console.log('   They will appear as independent categories via backend logic.');
    }

    console.log('\n✅ All updates completed successfully!\n');

  } catch (error) {
    console.error('❌ Error fixing ESR and Blood Group:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  fixESRAndBloodGroup()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { fixESRAndBloodGroup };


