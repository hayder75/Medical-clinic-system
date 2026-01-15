/**
 * Script to move AFB Sputum test to Standalone Tests
 * Removes it from Microbiology group so it appears in Standalone Tests category
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function moveAFBToStandalone() {
  console.log('🔬 Moving AFB Sputum to Standalone Tests...\n');

  try {
    // Find AFB test
    const afbTest = await prisma.labTest.findUnique({
      where: { code: 'AFB001' },
      include: { group: true }
    });

    if (!afbTest) {
      console.log('❌ AFB Sputum test (AFB001) not found!');
      return;
    }

    console.log('📋 Current AFB test status:');
    console.log(`   Name: ${afbTest.name}`);
    console.log(`   Category: ${afbTest.category}`);
    console.log(`   Group: ${afbTest.group ? afbTest.group.name : 'None'}`);
    console.log(`   Group ID: ${afbTest.groupId || 'None'}`);

    // Remove from group (set groupId to null)
    const updatedTest = await prisma.labTest.update({
      where: { code: 'AFB001' },
      data: {
        groupId: null, // Remove from group to make it standalone
        category: 'Microbiology' // Keep category for reference, but it will appear in Standalone Tests
      }
    });

    console.log('\n✅ AFB Sputum test updated:');
    console.log(`   Group ID: ${updatedTest.groupId || 'None (Standalone)'}`);
    console.log(`   Category: ${updatedTest.category}`);
    console.log('\n✅ AFB Sputum will now appear in "Standalone Tests" category on doctor side!');

  } catch (error) {
    console.error('❌ Error moving AFB to standalone:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
moveAFBToStandalone()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
