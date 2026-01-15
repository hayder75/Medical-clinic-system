/**
 * Script to fix AFB Sputum category and ensure it appears in Standalone Tests
 * Changes category to a standard one and ensures it's properly configured
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAFBCategory() {
  console.log('🔬 Fixing AFB Sputum category...\n');

  try {
    // Find AFB test
    const afbTest = await prisma.labTest.findUnique({
      where: { code: 'AFB001' }
    });

    if (!afbTest) {
      console.log('❌ AFB Sputum test (AFB001) not found!');
      return;
    }

    console.log('📋 Current AFB test status:');
    console.log(`   Name: ${afbTest.name}`);
    console.log(`   Category: ${afbTest.category}`);
    console.log(`   Group ID: ${afbTest.groupId || 'None'}`);

    // Update to use a category that will work better - use "Standalone Tests" or keep it but ensure it's standalone
    // Actually, let's change category to something that will definitely work
    const updatedTest = await prisma.labTest.update({
      where: { code: 'AFB001' },
      data: {
        groupId: null, // Ensure it's standalone
        category: 'Microbiology', // Keep category but ensure it's treated as standalone
        // The backend should collect all standalone tests regardless of category
      }
    });

    console.log('\n✅ AFB Sputum test updated:');
    console.log(`   Group ID: ${updatedTest.groupId || 'None (Standalone)'}`);
    console.log(`   Category: ${updatedTest.category}`);
    console.log('\n✅ AFB should now appear in Standalone Tests!');

  } catch (error) {
    console.error('❌ Error fixing AFB category:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixAFBCategory()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
