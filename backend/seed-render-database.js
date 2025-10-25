const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.upsert({
      where: { email: 'admin@clinic.com' },
      update: {},
      create: {
        email: 'admin@clinic.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        phone: '1234567890',
        isActive: true
      }
    });

    console.log('✅ Admin user created:', admin.email);

    // Create doctor user
    const doctorPassword = await bcrypt.hash('doctor123', 10);
    
    const doctor = await prisma.user.upsert({
      where: { email: 'doctor@clinic.com' },
      update: {},
      create: {
        email: 'doctor@clinic.com',
        password: doctorPassword,
        firstName: 'Dr. John',
        lastName: 'Smith',
        role: 'doctor',
        phone: '1234567891',
        isActive: true,
        consultationFee: 50
      }
    });

    console.log('✅ Doctor user created:', doctor.email);

    // Create nurse user
    const nursePassword = await bcrypt.hash('nurse123', 10);
    
    const nurse = await prisma.user.upsert({
      where: { email: 'nurse@clinic.com' },
      update: {},
      create: {
        email: 'nurse@clinic.com',
        password: nursePassword,
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'nurse',
        phone: '1234567892',
        isActive: true
      }
    });

    console.log('✅ Nurse user created:', nurse.email);

    // Create receptionist user
    const receptionPassword = await bcrypt.hash('reception123', 10);
    
    const reception = await prisma.user.upsert({
      where: { email: 'reception@clinic.com' },
      update: {},
      create: {
        email: 'reception@clinic.com',
        password: receptionPassword,
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'reception',
        phone: '1234567893',
        isActive: true
      }
    });

    console.log('✅ Receptionist user created:', reception.email);

    // Create basic services
    const services = [
      { name: 'General Consultation', price: 50, category: 'consultation' },
      { name: 'Blood Test', price: 25, category: 'lab' },
      { name: 'X-Ray', price: 75, category: 'radiology' },
      { name: 'Dental Checkup', price: 60, category: 'dental' },
      { name: 'Emergency Consultation', price: 100, category: 'emergency' }
    ];

    for (const service of services) {
      await prisma.service.upsert({
        where: { name: service.name },
        update: {},
        create: service
      });
    }

    console.log('✅ Services created');

    // Create insurance providers
    const insuranceProviders = [
      { name: 'Blue Cross', coveragePercentage: 80 },
      { name: 'Aetna', coveragePercentage: 75 },
      { name: 'Cigna', coveragePercentage: 85 },
      { name: 'Medicare', coveragePercentage: 90 }
    ];

    for (const provider of insuranceProviders) {
      await prisma.insuranceProvider.upsert({
        where: { name: provider.name },
        update: {},
        create: provider
      });
    }

    console.log('✅ Insurance providers created');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@clinic.com / admin123');
    console.log('Doctor: doctor@clinic.com / doctor123');
    console.log('Nurse: nurse@clinic.com / nurse123');
    console.log('Reception: reception@clinic.com / reception123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();
