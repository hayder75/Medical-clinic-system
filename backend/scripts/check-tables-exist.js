const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
  try {
    // Check if LabTestGroup table exists
    await prisma.$queryRaw`SELECT 1 FROM "LabTestGroup" LIMIT 1`;
    console.log('✅ Tables exist - ready to seed!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    if (error.code === 'P2021' || error.message.includes('does not exist') || error.message.includes('relation')) {
      console.log('❌ ERROR: Database tables are missing!');
      console.log('');
      console.log('Please run: verify-database-tables.bat');
      console.log('OR run: setup-database.bat');
      console.log('');
      await prisma.$disconnect();
      process.exit(1);
    }
    throw error;
  }
}

checkTables().catch(async (error) => {
  console.error('❌ Error checking tables:', error.message);
  await prisma.$disconnect();
  process.exit(1);
});


