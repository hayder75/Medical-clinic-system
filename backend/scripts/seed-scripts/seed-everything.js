const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting complete database seeding...\n');

  try {
    // ==========================================
    // 1. CREATE ALL STAFF USERS
    // ==========================================
    console.log('1️⃣  Creating staff users...');
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
      },
      {
        username: 'reception1',
        password: 'reception123',
        role: 'RECEPTIONIST',
        fullname: 'Receptionist',
        email: 'reception@clinic.com'
      }
    ];

    let userCount = 0;
    for (const userData of testUsers) {
      try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await prisma.user.upsert({
          where: { username: userData.username },
          update: {
            password: hashedPassword,
            role: userData.role,
            fullname: userData.fullname,
            email: userData.email,
            isActive: true,
            availability: true,
            specialties: []
          },
          create: {
            username: userData.username,
            password: hashedPassword,
            role: userData.role,
            fullname: userData.fullname,
            email: userData.email,
            isActive: true,
            availability: true,
            specialties: []
          }
        });
        userCount++;
      } catch (error) {
        console.log(`⚠️  Failed to create user ${userData.username}: ${error.message}`);
      }
    }
    console.log(`✅ Created/updated ${userCount} staff users\n`);

    // ==========================================
    // 2. CREATE SERVICES FROM EXPORT FILE
    // ==========================================
    console.log('2️⃣  Creating services from export file...');
    let serviceCount = 0;
    
    // Try to read the latest export file
    const exportFile = 'complete-database-export-2025-10-28.json';
    if (fs.existsSync(exportFile)) {
      try {
        const jsonData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
        const { services, investigations, teeth } = jsonData;

        // Create Services
        if (services && Array.isArray(services)) {
          for (const service of services) {
            try {
              await prisma.service.upsert({
                where: { code: service.code },
                update: {},
                create: {
                  code: service.code,
                  name: service.name,
                  category: service.category,
                  price: service.price || 0,
                  description: service.description || '',
                  isActive: service.isActive !== false
                }
              });
              serviceCount++;
            } catch (error) {
              console.log(`⚠️  Failed to create service ${service.code}: ${error.message}`);
            }
          }
        }

        // Create Investigation Types
        let investCount = 0;
        if (investigations && Array.isArray(investigations)) {
          console.log('\n3️⃣  Creating investigation types...');
          for (const inv of investigations) {
            try {
              const matchingService = await prisma.service.findFirst({
                where: { name: inv.name }
              });
              
              if (matchingService) {
                await prisma.investigationType.upsert({
                  where: { id: inv.id },
                  update: {
                    name: inv.name,
                    price: inv.price,
                    category: inv.category,
                    serviceId: matchingService.id
                  },
                  create: {
                    id: inv.id,
                    name: inv.name,
                    price: inv.price,
                    category: inv.category,
                    serviceId: matchingService.id
                  }
                });
                investCount++;
              }
            } catch (error) {
              console.log(`⚠️  Failed to create investigation ${inv.name}: ${error.message}`);
            }
          }
          console.log(`✅ Created/updated ${investCount} investigations\n`);
        }

        // Create Teeth
        let teethCount = 0;
        if (teeth && Array.isArray(teeth)) {
          console.log('4️⃣  Creating teeth data...');
          for (const tooth of teeth) {
            try {
              await prisma.tooth.upsert({
                where: { id: tooth.id },
                update: {
                  number: tooth.number,
                  eruptionStart: tooth.eruptionStart,
                  eruptionEnd: tooth.eruptionEnd,
                  rootCompletion: tooth.rootCompletion
                },
                create: {
                  id: tooth.id,
                  number: tooth.number,
                  eruptionStart: tooth.eruptionStart,
                  eruptionEnd: tooth.eruptionEnd,
                  rootCompletion: tooth.rootCompletion
                }
              });
              teethCount++;
            } catch (error) {
              console.log(`⚠️  Failed to create tooth ${tooth.number}: ${error.message}`);
            }
          }
          console.log(`✅ Created/updated ${teethCount} teeth\n`);
        }

      } catch (error) {
        console.log(`⚠️  Could not read export file ${exportFile}: ${error.message}`);
        console.log('   Creating basic services instead...\n');
      }
    } else {
      console.log(`⚠️  Export file ${exportFile} not found, creating basic services...\n`);
    }

    // ==========================================
    // 3. CREATE BASIC SERVICES (if export not available)
    // ==========================================
    if (serviceCount === 0) {
      console.log('3️⃣  Creating basic services...');
      const basicServices = [
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
        }
      ];

      for (const serviceData of basicServices) {
        try {
          await prisma.service.upsert({
            where: { code: serviceData.code },
            update: serviceData,
            create: serviceData
          });
          serviceCount++;
        } catch (error) {
          console.log(`⚠️  Failed to create service ${serviceData.code}: ${error.message}`);
        }
      }
    }

    // ==========================================
    // 4. CREATE DEPARTMENTS
    // ==========================================
    console.log('4️⃣  Creating departments...');
    const depts = await prisma.department.createMany({
      data: [
        { name: 'Dentists', description: 'Dental diagnosis and treatment' },
        { name: 'Lab', description: 'Laboratory testing' },
        { name: 'Radiology', description: 'Imaging services' },
        { name: 'Pharmacy', description: 'Medication dispensing' },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${depts.count} departments\n`);

    // ==========================================
    // 5. CREATE INSURANCE
    // ==========================================
    console.log('5️⃣  Creating insurance...');
    try {
      await prisma.insurance.upsert({
        where: { code: 'INS-001' },
        update: {},
        create: {
          name: 'Standard Insurance',
          code: 'INS-001',
          isActive: true,
        },
      });
      console.log('✅ Insurance created/updated\n');
    } catch (error) {
      console.log(`⚠️  Insurance error: ${error.message}\n`);
    }

    // ==========================================
    // SUMMARY
    // ==========================================
    console.log('🎉 Complete database seeding finished!\n');
    console.log('📊 Summary:');
    console.log(`   ✅ Staff Users: ${userCount}`);
    console.log(`   ✅ Services: ${serviceCount}`);
    console.log(`   ✅ Departments: ${depts.count}`);
    console.log('\n📋 Staff Login Credentials:');
    console.log('   admin / admin123 (ADMIN)');
    console.log('   doctor1 / doctor123 (DOCTOR)');
    console.log('   nurse1 / nurse123 (NURSE)');
    console.log('   billing1 / billing123 (BILLING_OFFICER)');
    console.log('   pharmacy1 / pharmacy123 (PHARMACIST)');
    console.log('   lab1 / lab123 (LAB_TECHNICIAN)');
    console.log('   radiology1 / radiology123 (RADIOLOGIST)');
    console.log('   reception1 / reception123 (RECEPTIONIST)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

