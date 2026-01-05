const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addMedicationFields() {
  try {
    console.log('🔄 Adding new fields to MedicationCatalog and MedicationOrder...');
    
    // This script assumes the Prisma schema has been updated
    // We need to run: npx prisma migrate dev --name add_medication_fields
    // Or use raw SQL if needed
    
    console.log('📝 Note: Schema changes should be applied via Prisma migration');
    console.log('   Run: npx prisma migrate dev --name add_medication_fields');
    console.log('   Or: npx prisma db push');
    
    // Verify fields exist by trying to query them
    try {
      const testCatalog = await prisma.medicationCatalog.findFirst({
        select: {
          id: true,
          unit: true,
          packSize: true
        }
      });
      
      if (testCatalog !== null) {
        console.log('✅ MedicationCatalog fields (unit, packSize) are available');
      }
    } catch (error) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('⚠️  Fields not yet added to database. Please run Prisma migration first.');
        console.log('   Command: npx prisma migrate dev --name add_medication_fields');
      } else {
        throw error;
      }
    }
    
    try {
      const testOrder = await prisma.medicationOrder.findFirst({
        select: {
          id: true,
          quantityNumeric: true,
          unit: true
        }
      });
      
      if (testOrder !== null) {
        console.log('✅ MedicationOrder fields (quantityNumeric, unit) are available');
      }
    } catch (error) {
      if (error.message.includes('Unknown column') || error.message.includes('does not exist')) {
        console.log('⚠️  Fields not yet added to database. Please run Prisma migration first.');
        console.log('   Command: npx prisma migrate dev --name add_medication_fields');
      } else {
        throw error;
      }
    }
    
    console.log('✅ Migration check completed');
    
  } catch (error) {
    console.error('❌ Error checking migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addMedicationFields()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = addMedicationFields;

