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
        username: 'admin',
        password: hashedPassword,
        fullname: 'Admin User',
        role: 'ADMIN',
        phone: '1234567890',
        availability: true
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
        username: 'doctor',
        password: doctorPassword,
        fullname: 'Dr. John Smith',
        role: 'DOCTOR',
        phone: '1234567891',
        availability: true,
        consultationFee: 50,
        specialties: ['General Medicine']
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
        username: 'nurse',
        password: nursePassword,
        fullname: 'Jane Doe',
        role: 'NURSE',
        phone: '1234567892',
        availability: true
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
        username: 'reception',
        password: receptionPassword,
        fullname: 'Sarah Johnson',
        role: 'RECEPTIONIST',
        phone: '1234567893',
        availability: true
      }
    });

    console.log('✅ Receptionist user created:', reception.email);

    // Create basic services
    const services = [
      { code: 'CONS001', name: 'General Consultation', price: 50, category: 'CONSULTATION' },
      { code: 'LAB001', name: 'Blood Test', price: 25, category: 'LAB' },
      { code: 'RAD001', name: 'X-Ray', price: 75, category: 'RADIOLOGY' },
      { code: 'DENT001', name: 'Dental Checkup', price: 60, category: 'PROCEDURE' },
      { code: 'EMER001', name: 'Emergency Consultation', price: 100, category: 'EMERGENCY' }
    ];

    for (const service of services) {
      await prisma.service.upsert({
        where: { code: service.code },
        update: {},
        create: service
      });
    }

    console.log('✅ Services created');

    // Create insurance providers
    const insuranceProviders = [
      { name: 'Blue Cross', code: 'BC001', coveragePercentage: 80 },
      { name: 'Aetna', code: 'AET001', coveragePercentage: 75 },
      { name: 'Cigna', code: 'CIG001', coveragePercentage: 85 },
      { name: 'Medicare', code: 'MED001', coveragePercentage: 90 }
    ];

    for (const provider of insuranceProviders) {
      await prisma.insurance.upsert({
        where: { code: provider.code },
        update: {},
        create: {
          name: provider.name,
          code: provider.code,
          contactInfo: `Contact: ${provider.name} Customer Service`
        }
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
