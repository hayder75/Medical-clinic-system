const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser(username) {
  try {
    console.log(`🔍 Checking user: ${username}\n`);
    
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        role: true,
        isActive: true,
        password: true
      }
    });

    if (!user) {
      console.log(`❌ User '${username}' not found in database!`);
      console.log('\n💡 Run: node scripts/create-all-users.js to create test users');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Full Name: ${user.fullname}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive ? '✅ YES' : '❌ NO'}`);
    console.log(`   Has Password: ${user.password ? '✅ YES' : '❌ NO'}`);

    if (!user.isActive) {
      console.log('\n⚠️  USER IS INACTIVE - This is why login fails!');
      console.log('\n💡 To fix, run: node scripts/activate-user.js ' + username);
    } else if (!user.password) {
      console.log('\n⚠️  USER HAS NO PASSWORD - This is why login fails!');
      console.log('\n💡 To fix, run: node scripts/reset-user-password.js ' + username);
    } else {
      console.log('\n✅ User should be able to login!');
      console.log('   If login still fails, check:');
      console.log('   1. Password is correct');
      console.log('   2. Username is spelled correctly');
      console.log('   3. Backend server is running');
    }
  } catch (error) {
    console.error('❌ Error checking user:', error.message);
    if (error.message.includes('connect')) {
      console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

const username = process.argv[2];
if (!username) {
  console.log('Usage: node scripts/check-user.js <username>');
  console.log('Example: node scripts/check-user.js doctor1');
  process.exit(1);
}

checkUser(username);

