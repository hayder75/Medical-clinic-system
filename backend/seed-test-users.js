const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUsers() {
  console.log('🌱 Creating test users...');

  try {
    // Create test users with different roles
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
        email: 'sarah.johnson@clinic.com'
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
      }
    ];

    for (const userData of testUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await prisma.user.upsert({
        where: { username: userData.username },
        update: {
          password: hashedPassword,
          role: userData.role,
          fullname: userData.fullname,
          email: userData.email
        },
        create: {
          username: userData.username,
          password: hashedPassword,
          role: userData.role,
          fullname: userData.fullname,
          email: userData.email
        }
      });

      console.log(`✅ Created/Updated user: ${userData.username} (${userData.role})`);
    }

    // Create some basic services
    const services = [
      {
        code: 'ENTRY001',
        name: 'Entry Fee',
        price: 200,
        category: 'OTHER',
        description: 'Patient registration and entry fee'
      },
      {
        code: 'CONS001',
        name: 'Doctor Consultation',
        price: 300,
        category: 'CONSULTATION',
        description: 'General consultation with doctor'
      },
      {
        code: 'LAB001',
        name: 'CBC Test',
        price: 150,
        category: 'LAB',
        description: 'Complete Blood Count test'
      },
      {
        code: 'RAD001',
        name: 'Chest X-Ray',
        price: 200,
        category: 'RADIOLOGY',
        description: 'Chest X-Ray examination'
      },
      {
        code: 'MED001',
        name: 'Paracetamol',
        price: 50,
        category: 'MEDICATION',
        description: 'Pain relief medication'
      }
    ];

    for (const serviceData of services) {
      await prisma.service.upsert({
        where: { code: serviceData.code },
        update: serviceData,
        create: serviceData
      });

      console.log(`✅ Created/Updated service: ${serviceData.code} - ${serviceData.name}`);
    }

    console.log('\n🎉 Test users and services created successfully!');
    console.log('\n📋 Test User Credentials:');
    console.log('┌─────────────────────┬──────────────┬─────────────┬─────────────────────────┐');
    console.log('│ Username            │ Password     │ Role        │ Name                    │');
    console.log('├─────────────────────┼──────────────┼─────────────┼─────────────────────────┤');
    console.log('│ admin               │ admin123     │ ADMIN       │ System Administrator    │');
    console.log('│ doctor1             │ doctor123    │ DOCTOR      │ Dr. Sarah Johnson       │');
    console.log('│ nurse1              │ nurse123     │ NURSE       │ Nurse Mary Wilson       │');
    console.log('│ billing1            │ billing123   │ BILLING     │ John Smith              │');
    console.log('│ pharmacy1           │ pharmacy123  │ PHARMACIST  │ Pharmacy Manager        │');
    console.log('│ pharmacy_billing1   │ pharmacy123  │ PHARMACY_BILLING │ Pharmacy Billing Officer │');
    console.log('│ lab1                │ lab123       │ LAB_TECH    │ Lab Technician          │');
    console.log('│ radiology1          │ radiology123 │ RADIOLOGIST │ Radiologist             │');
    console.log('└─────────────────────┴──────────────┴─────────────┴─────────────────────────┘');

  } catch (error) {
    console.error('❌ Error creating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
