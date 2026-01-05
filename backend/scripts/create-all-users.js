const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAllUsers() {
  console.log('🌱 Creating all test users...\n');

  try {
    const testUsers = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'ADMIN',
        fullname: 'System Administrator',
        email: 'admin@clinic.com'
      },
      {
        username: 'doctor1',
        password: 'doctor123',
        role: 'DOCTOR',
        fullname: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@clinic.com',
        specialties: ['General Medicine'],
        consultationFee: 500
      },
      {
        username: 'nurse1',
        password: 'nurse123',
        role: 'NURSE',
        fullname: 'Nurse Mary Wilson',
        email: 'mary.wilson@clinic.com'
      },
      {
        username: 'billing1',
        password: 'billing123',
        role: 'BILLING_OFFICER',
        fullname: 'John Smith',
        email: 'john.smith@clinic.com'
      },
      {
        username: 'pharmacy1',
        password: 'pharmacy123',
        role: 'PHARMACIST',
        fullname: 'Pharmacy Manager',
        email: 'pharmacy@clinic.com'
      },
      {
        username: 'pharmacy_billing1',
        password: 'pharmacy123',
        role: 'PHARMACY_BILLING_OFFICER',
        fullname: 'Pharmacy Billing Officer',
        email: 'pharmacy.billing@clinic.com'
      },
      {
        username: 'lab1',
        password: 'lab123',
        role: 'LAB_TECHNICIAN',
        fullname: 'Lab Technician',
        email: 'lab@clinic.com'
      },
      {
        username: 'radiology1',
        password: 'radiology123',
        role: 'RADIOLOGIST',
        fullname: 'Radiologist',
        email: 'radiology@clinic.com'
      },
      {
        username: 'reception1',
        password: 'reception123',
        role: 'RECEPTIONIST',
        fullname: 'Reception Staff',
        email: 'reception@clinic.com'
      }
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await prisma.user.upsert({
        where: { username: userData.username },
        update: {
          password: hashedPassword,
          isActive: true,
          fullname: userData.fullname,
          email: userData.email,
          role: userData.role,
          specialties: userData.specialties || [],
          consultationFee: userData.consultationFee || 100
        },
        create: {
          username: userData.username,
          password: hashedPassword,
          fullname: userData.fullname,
          email: userData.email,
          role: userData.role,
          isActive: true,
          specialties: userData.specialties || [],
          consultationFee: userData.consultationFee || 100
        }
      });

      console.log(`✅ ${userData.role.padEnd(20)} - ${userData.username.padEnd(15)} / ${userData.password}`);
    }

    console.log('\n🎉 All users created/updated successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────────────────────────────────────────');
    testUsers.forEach(u => {
      console.log(`   ${u.role.padEnd(20)} → Username: ${u.username.padEnd(15)} Password: ${u.password}`);
    });
    console.log('─────────────────────────────────────────────────────────');
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    if (error.message.includes('connect')) {
      console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAllUsers();

