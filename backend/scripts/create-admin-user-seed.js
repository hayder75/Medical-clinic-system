const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'admin' },
          { role: 'ADMIN' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Full Name: ${existingAdmin.fullname}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n✅ Admin user is ready to use.\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullname: 'System Administrator',
        role: 'ADMIN',
        email: 'admin@medicalclinic.com',
        phone: '0000000000',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n⚠️  IMPORTANT: Change the password after first login!\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createAdminUser()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };


