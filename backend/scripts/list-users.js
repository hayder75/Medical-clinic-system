const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('📋 Listing all users in database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        role: true,
        isActive: true,
        phone: true
      },
      orderBy: {
        username: 'asc'
      }
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 Run: node scripts/seed-scripts/seed-test-users.js');
      console.log('   Or: node scripts/seed-scripts/create-admin-user.js');
    } else {
      console.log(`✅ Found ${users.length} user(s):\n`);
      console.log('┌─────────────┬──────────────────────┬─────────────────────┬──────────────────┐');
      console.log('│ Username    │ Full Name            │ Email               │ Role             │');
      console.log('├─────────────┼──────────────────────┼─────────────────────┼──────────────────┤');
      
      users.forEach(user => {
        const status = user.isActive ? '✅' : '❌';
        const username = (user.username || '').padEnd(11);
        const fullname = (user.fullname || '').substring(0, 20).padEnd(20);
        const email = (user.email || '').substring(0, 19).padEnd(19);
        const role = (user.role || '').padEnd(16);
        console.log(`│ ${username} │ ${fullname} │ ${email} │ ${role} │ ${status}`);
      });
      
      console.log('└─────────────┴──────────────────────┴─────────────────────┴──────────────────┘');
      console.log('\n💡 Default passwords (if created by seed scripts):');
      console.log('   - admin: admin123');
      console.log('   - doctor1: doctor123');
      console.log('   - nurse1: nurse123');
      console.log('   - billing1: billing123');
      console.log('   - pharmacy1: pharmacy123');
      console.log('   - lab1: lab123');
      console.log('   - radiology1: radiology123');
      console.log('   - reception1: reception123');
    }
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    if (error.message.includes('connect')) {
      console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

