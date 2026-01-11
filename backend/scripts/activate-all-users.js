const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateAllUsers() {
  try {
    console.log('🔧 Activating all inactive users...\n');
    
    const result = await prisma.user.updateMany({
      where: { isActive: false },
      data: { isActive: true }
    });

    console.log(`✅ Activated ${result.count} user(s)!`);
    console.log('   All users can now login.');
  } catch (error) {
    console.error('❌ Error activating users:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

activateAllUsers();

