const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Add unit column to Service table if it doesn't exist
 * This is a migration script to add the unit field
 */
async function addUnitColumn() {
  try {
    console.log('📝 Adding unit column to Service table...\n');

    // Check if column exists by trying to query it
    try {
      await prisma.$executeRawUnsafe(`
        SELECT unit FROM "Service" LIMIT 1;
      `);
      console.log('✅ Unit column already exists');
    } catch (error) {
      if (error.message.includes('column "unit" does not exist')) {
        // Column doesn't exist, add it
        console.log('📝 Column does not exist, adding it...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "Service" ADD COLUMN IF NOT EXISTS "unit" TEXT DEFAULT 'UNIT';
        `);
        console.log('✅ Unit column added successfully');
      } else {
        throw error;
      }
    }

    // Update all existing services to have default unit if null
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "Service" 
      SET "unit" = 'UNIT' 
      WHERE "unit" IS NULL;
    `);
    console.log(`✅ Updated existing services with default unit`);

    console.log('\n✨ Unit column migration completed!');

  } catch (error) {
    console.error('\n❌ Error adding unit column:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
if (require.main === module) {
  addUnitColumn()
    .then(() => {
      console.log('\n✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addUnitColumn };

