const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDentalVisitStatus() {
  console.log('🦷 Adding DENTAL_SERVICES_ORDERED to VisitStatus enum...\n');

  try {
    // Check if DENTAL_SERVICES_ORDERED already exists
    try {
      await prisma.$executeRaw`ALTER TYPE "VisitStatus" ADD VALUE IF NOT EXISTS 'DENTAL_SERVICES_ORDERED'`;
      console.log('✅ DENTAL_SERVICES_ORDERED added to VisitStatus enum');
    } catch (error) {
      // Check if error is because value already exists
      if (error.message.includes('already exists') || error.code === '42710' || error.meta?.code === '42710') {
        console.log('✅ DENTAL_SERVICES_ORDERED already exists in VisitStatus enum');
      } else {
        // Try alternative approach
        try {
          await prisma.$executeRaw`ALTER TYPE "VisitStatus" ADD VALUE 'DENTAL_SERVICES_ORDERED'`;
          console.log('✅ DENTAL_SERVICES_ORDERED added to VisitStatus enum');
        } catch (err) {
          if (err.message.includes('already exists') || err.code === '42710' || err.meta?.code === '42710') {
            console.log('✅ DENTAL_SERVICES_ORDERED already exists in VisitStatus enum');
          } else {
            console.log('⚠️  Could not add DENTAL_SERVICES_ORDERED. Error:', err.message);
            throw err;
          }
        }
      }
    }

    console.log('\n✨ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDentalVisitStatus()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  });

