const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Add DENTAL value to ServiceCategory enum in PostgreSQL
 * This is a one-time migration script
 */
async function addDentalCategory() {
  try {
    console.log('🦷 Adding DENTAL category to ServiceCategory enum...\n');

    // First, check if DENTAL already exists in the enum using raw SQL
    const checkResult = await prisma.$queryRawUnsafe(`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'DENTAL' 
        AND enumtypid = (
          SELECT oid FROM pg_type WHERE typname = 'ServiceCategory'
        )
      ) as exists;
    `);

    const exists = checkResult[0]?.exists || false;

    if (exists) {
      console.log('✅ DENTAL category already exists in database');
      return;
    }

    // Add DENTAL to enum using raw SQL
    console.log('📝 Adding DENTAL value to ServiceCategory enum...');
    await prisma.$executeRawUnsafe(`
      ALTER TYPE "ServiceCategory" ADD VALUE IF NOT EXISTS 'DENTAL';
    `);

    console.log('✅ DENTAL category added to ServiceCategory enum');
    
    // Wait a moment for the enum to be updated
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify by trying to create a test service
    try {
      const testCode = `TEST-DENTAL-${Date.now()}`;
      await prisma.service.create({
        data: {
          code: testCode,
          name: 'Test Dental Service',
          category: 'DENTAL',
          price: 0,
          isActive: false
        }
      });
      
      // Delete test service
      await prisma.service.delete({
        where: { code: testCode }
      });
      
      console.log('✅ Verified: DENTAL category is working correctly\n');
    } catch (error) {
      console.error('❌ Error verifying DENTAL category:', error.message);
      throw error;
    }

  } catch (error) {
    // If IF NOT EXISTS doesn't work, try without it
    if (error.message.includes('IF NOT EXISTS')) {
      try {
        console.log('⚠️  IF NOT EXISTS not supported, trying alternative method...');
        await prisma.$executeRawUnsafe(`
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'DENTAL' 
              AND enumtypid = (
                SELECT oid FROM pg_type WHERE typname = 'ServiceCategory'
              )
            ) THEN
              ALTER TYPE "ServiceCategory" ADD VALUE 'DENTAL';
            END IF;
          END $$;
        `);
        console.log('✅ DENTAL category added using alternative method');
      } catch (altError) {
        console.error('❌ Error adding DENTAL category:', altError.message);
        throw altError;
      }
    } else {
      console.error('❌ Error adding DENTAL category:', error);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  addDentalCategory()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addDentalCategory };

