const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function setUserPassword(username, newPassword) {
  try {
    console.log(`🔐 Setting password for user: ${username}...\n`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { username: username },
      select: { id: true, username: true, fullname: true, role: true }
    });

    if (!user) {
      console.error(`❌ User "${username}" not found!`);
      console.log('\n💡 Available users:');
      const allUsers = await prisma.user.findMany({
        select: { username: true, role: true },
        orderBy: { username: 'asc' }
      });
      allUsers.forEach(u => console.log(`   - ${u.username} (${u.role})`));
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await prisma.user.update({
      where: { username: username },
      data: {
        password: hashedPassword,
        passwordChangedAt: new Date()
      }
    });

    console.log('✅ Password updated successfully!');
    console.log(`\n📋 User Details:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Full Name: ${user.fullname || 'N/A'}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`\n⚠️  Password has been hashed and stored securely.`);

  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error('\n   Database connection failed!');
      console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Get command line arguments
const username = process.argv[2];
const password = process.argv[3];

if (!username || !password) {
  console.log('Usage: node set-user-password.js <username> <password>');
  console.log('Example: node set-user-password.js reception reception123');
  process.exit(1);
}

setUserPassword(username, password);



