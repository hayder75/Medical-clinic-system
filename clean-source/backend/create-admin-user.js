const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  try {
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

    console.log('✅ Default admin user created/updated');
    console.log(`   Username: ${adminUser.username}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: admin123 (change immediately!)`);
  } catch (error) {
    console.log('⚠️  Could not create admin user:', error.message);
    if (error.message.includes('connect')) {
      console.log('   Make sure PostgreSQL is running and DATABASE_URL is correct');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
