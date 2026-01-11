const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function activateUser(username) {
  try {
    console.log(`🔧 Activating user: ${username}\n`);
    
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log(`❌ User '${username}' not found!`);
      process.exit(1);
    }

    await prisma.user.update({
      where: { username },
      data: { isActive: true }
    });

    console.log(`✅ User '${username}' has been activated!`);
    console.log('   They should now be able to login.');
  } catch (error) {
    console.error('❌ Error activating user:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const username = process.argv[2];
if (!username) {
  console.log('Usage: node scripts/activate-user.js <username>');
  console.log('Example: node scripts/activate-user.js doctor1');
  process.exit(1);
}

activateUser(username);

