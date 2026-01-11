const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default passwords from seed scripts
const defaultPasswords = {
  'admin': 'admin123',
  'doctor1': 'doctor123',
  'nurse1': 'nurse123',
  'billing1': 'billing123',
  'pharmacy1': 'pharmacy123',
  'pharmacy_billing1': 'pharmacy123',
  'lab1': 'lab123',
  'radiology1': 'radiology123',
  'reception1': 'reception123'
};

async function listAllUsers() {
  try {
    console.log('📋 Listing all users from database...\n');
    console.log('⚠️  NOTE: Passwords are stored as hashed values in the database.');
    console.log('   Below are the default passwords if users were created from seed scripts.\n');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        fullname: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        availability: true,
        specialties: true,
        consultationFee: true,
        licenseNumber: true,
        createdAt: true
      },
      orderBy: [
        { role: 'asc' },
        { username: 'asc' }
      ]
    });

    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('\n💡 Run: node scripts/create-all-users.js');
      console.log('   Or: node scripts/seed-scripts/seed-test-users.js');
      return;
    }

    console.log(`✅ Found ${users.length} user(s):\n`);
    console.log('═'.repeat(120));
    console.log('USER CREDENTIALS AND DETAILS');
    console.log('═'.repeat(120));
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
      console.log('─'.repeat(120));
      
      usersByRole[role].forEach((user, index) => {
        const status = user.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
        const avail = user.availability ? 'Available' : 'Unavailable';
        const defaultPwd = defaultPasswords[user.username] || '❓ (Unknown - may have been changed)';
        
        console.log(`\n${index + 1}. Username: ${user.username}`);
        console.log(`   Full Name: ${user.fullname || 'N/A'}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Phone: ${user.phone || 'N/A'}`);
        console.log(`   Status: ${status}`);
        console.log(`   Availability: ${avail}`);
        
        if (user.role === 'DOCTOR') {
          console.log(`   Specialties: ${user.specialties?.join(', ') || 'N/A'}`);
          console.log(`   Consultation Fee: ${user.consultationFee ? '$' + user.consultationFee : 'N/A'}`);
          console.log(`   License Number: ${user.licenseNumber || 'N/A'}`);
        }
        
        console.log(`   Default Password: ${defaultPwd}`);
        console.log(`   Created: ${user.createdAt.toLocaleString()}`);
        console.log(`   ID: ${user.id}`);
      });
    });

    console.log('\n');
    console.log('═'.repeat(120));
    console.log('QUICK REFERENCE - DEFAULT PASSWORDS');
    console.log('═'.repeat(120));
    console.log('');
    console.log('┌─────────────────────┬──────────────────┬─────────────────────────────┐');
    console.log('│ Username            │ Password         │ Role                        │');
    console.log('├─────────────────────┼──────────────────┼─────────────────────────────┤');
    
    Object.keys(defaultPasswords).forEach(username => {
      const user = users.find(u => u.username === username);
      if (user) {
        const usernameCol = username.padEnd(19);
        const passwordCol = defaultPasswords[username].padEnd(16);
        const roleCol = user.role.padEnd(27);
        console.log(`│ ${usernameCol} │ ${passwordCol} │ ${roleCol} │`);
      }
    });
    
    console.log('└─────────────────────┴──────────────────┴─────────────────────────────┘');
    
    console.log('\n⚠️  IMPORTANT NOTES:');
    console.log('   1. Passwords are hashed in the database and cannot be retrieved in plain text');
    console.log('   2. The passwords shown above are DEFAULT passwords from seed scripts');
    console.log('   3. If a user changed their password, the default will no longer work');
    console.log('   4. To reset a password, use the admin panel or database directly');
    console.log('');

  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
      console.error('\n   Database connection failed!');
      console.error('   Make sure:');
      console.error('   1. PostgreSQL is running');
      console.error('   2. DATABASE_URL in .env file is correct');
      console.error('   3. Database exists and is accessible');
      console.error('\n   Example DATABASE_URL:');
      console.error('   postgresql://postgres:postgres@localhost:5432/medical_clinic');
    }
  } finally {
    await prisma.$disconnect();
  }
}

listAllUsers();



