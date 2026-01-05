const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showUsersWithPasswords() {
  try {
    console.log('📋 Fetching all users with passwords from database...\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        phone: true,
        role: true,
        password: true, // Include password hash
        isActive: true,
        availability: true,
        specialties: true,
        consultationFee: true,
        createdAt: true
      },
      orderBy: [
        { role: 'asc' },
        { username: 'asc' }
      ]
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    console.log('═'.repeat(150));
    console.log('ALL USERS WITH PASSWORD HASHES');
    console.log('═'.repeat(150));
    console.log('');

    // Group by role
    const usersByRole = {};
    users.forEach(user => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    // Display by role
    Object.keys(usersByRole).sort().forEach(role => {
      console.log(`\n📌 ${role} (${usersByRole[role].length} user(s))`);
      console.log('─'.repeat(150));
      
      usersByRole[role].forEach((user, index) => {
        const status = user.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
        const avail = user.availability ? 'Available' : 'Unavailable';
        
        console.log(`\n${index + 1}. Username: ${user.username}`);
        console.log(`   Full Name: ${user.fullname || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Status: ${status}`);
        console.log(`   Availability: ${avail}`);
        
        if (user.role === 'DOCTOR') {
          console.log(`   Specialties: ${user.specialties?.join(', ') || 'N/A'}`);
          console.log(`   Consultation Fee: ${user.consultationFee ? '$' + user.consultationFee : 'N/A'}`);
        }
        
        console.log(`   Password Hash: ${user.password}`);
        console.log(`   Password Length: ${user.password.length} characters`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log(`   ID: ${user.id}`);
      });
    });

    console.log('\n');
    console.log('═'.repeat(150));
    console.log('SUMMARY TABLE');
    console.log('═'.repeat(150));
    console.log('');
    console.log('┌─────────────────────┬──────────────────┬─────────────────────────────┬──────────────────────────────────────────────────────────┐');
    console.log('│ Username            │ Password Hash    │ Role                        │ Status  │');
    console.log('├─────────────────────┼──────────────────┼─────────────────────────────┼─────────┤');
    
    users.forEach(user => {
      const usernameCol = (user.username || '').padEnd(19);
      const passwordHash = user.password.substring(0, 16) + '...'; // Show first 16 chars
      const passwordCol = passwordHash.padEnd(16);
      const roleCol = user.role.padEnd(27);
      const statusCol = user.isActive ? 'ACTIVE' : 'INACTIVE';
      console.log(`│ ${usernameCol} │ ${passwordCol} │ ${roleCol} │ ${statusCol.padEnd(7)} │`);
    });
    
    console.log('└─────────────────────┴──────────────────┴─────────────────────────────┴─────────┘');
    
    console.log('\n⚠️  NOTES:');
    console.log('   1. Passwords are stored as bcrypt hashes (one-way encryption)');
    console.log('   2. Password hashes cannot be reversed to get the original password');
    console.log('   3. To verify a password, use bcrypt.compare()');
    console.log('   4. To reset a password, use the admin panel or update the hash directly');
    console.log('');

  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error('\n   Database connection failed!');
      console.error('   Make sure:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. DATABASE_URL in .env file is correct');
      console.error('   3. Database exists and is accessible');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

showUsersWithPasswords();

