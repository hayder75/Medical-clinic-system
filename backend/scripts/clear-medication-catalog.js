const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearMedicationCatalog() {
  try {
    console.log('🗑️  Starting to clear MedicationCatalog...');
    
    // Count existing medications
    const count = await prisma.medicationCatalog.count();
    console.log(`📊 Found ${count} medications in catalog`);
    
    if (count === 0) {
      console.log('✅ Catalog is already empty');
      return;
    }
    
    // Delete all medication catalog entries
    const result = await prisma.medicationCatalog.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.count} medications from catalog`);
    console.log('📦 Catalog is now empty and ready for new import');
    
  } catch (error) {
    console.error('❌ Error clearing medication catalog:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  clearMedicationCatalog()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = clearMedicationCatalog;

