const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test admin user...\n');

  try {
    // Create simple admin user
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@clinic.com' },
      update: {},
      create: {
        username: 'admin',
        fullname: 'System Administrator',
        email: 'admin@clinic.com',
        role: 'ADMIN',
        password: await bcrypt.hash('admin123', 10),
        availability: true,
        isActive: true,
        specialties: []
      }
    });

    console.log('✅ Admin user created:');
    console.log(`   Username: admin`);
    console.log(`   Password: admin123`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Role: ${adminUser.role}\n`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('You can now test login at: https://medical-clinic-frontend1.onrender.com');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
