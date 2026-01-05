const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating default admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@clinic.com' },
      update: {},
      create: {
        username: 'admin',
        fullname: 'System Administrator',
        email: 'admin@clinic.com',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
        specialties: [],
        consultationFee: 100
      },
    });

    console.log('\n✅ Default admin user created/updated!');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123`);
    console.log(`   Role: ${adminUser.role}`);
    console.log('\n⚠️  IMPORTANT: Change password immediately after first login!');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error.message);
    if (error.message.includes('connect')) {
      console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

