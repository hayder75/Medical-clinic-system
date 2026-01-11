const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Render...\n');

  try {
    // 1. Create ALL Users from local database
    console.log('1. Creating all users...');
    const usersData = [
      { username: 'labtech', fullname: 'Lab Technician', email: 'labtech@tenalesew.com', role: 'LAB_TECHNICIAN', phone: '+251911234567', password: '$2a$10$Xg/sF0iu.DVqOagwLDcx6uydwYwSAx6LYiUZLqcZ4YyYyS5ltZ8Ou', availability: true, specialties: ['Laboratory'] },
      { username: 'reception', fullname: 'kalkidan mengstu ', email: 'tets@gmail.com', role: 'RECEPTIONIST', phone: '0985858585', password: '$2a$10$VoKMsmwmMWiaslxvMkfB/eMsidmrQ27UHUpDnp7PEWrBiG6Jd.T7.', availability: true, specialties: [] },
      { username: 'admin', fullname: 'System Administrator', email: 'admin@clinic.com', role: 'ADMIN', phone: null, password: '$2a$10$KTMku1b18o4GXktOzGqevePO2xQpwqlYSzi4JO9Kw7EpI4LyT//Ee', availability: true, specialties: [] },
      { username: 'billing', fullname: 'Billing Staff', email: 'billing@clinic.com', role: 'BILLING_OFFICER', phone: null, password: '$2a$10$jBMPL7PeGyWApda9pFzwrujBx/DIYCbxqJ9H01ubWkaD8Sfil4UBG', availability: true, specialties: [] },
      { username: 'lab1', fullname: 'Lab Technician', email: 'lab1@clinic.com', role: 'LAB_TECHNICIAN', phone: null, password: '$2a$10$iwDYMZvJEsf38xZJeV15penOu0Us8rxA/Sh69yDN.Xtgy1.2FiF4G', availability: true, specialties: [] },
      { username: 'pharmacy1', fullname: 'Pharmacy Staff', email: 'pharmacy1@clinic.com', role: 'PHARMACIST', phone: null, password: '$2a$10$0nkdWSb1kJpU8CJLZOsdU.dl9zDSMoFNlTwVk7/3iKLHbJCIWXYn6', availability: true, specialties: [] },
      { username: 'radiology1', fullname: 'Radiology Staff', email: 'radiology1@clinic.com', role: 'RADIOLOGIST', phone: null, password: '$2a$10$1AKzyD/7QXNYXhPSiHuI..BcTDLpTNGfiwHBXMcQtHTZdmYtFUyM.', availability: true, specialties: [] },
      { username: 'nurse', fullname: 'Nurse Jane', email: 'nurse@clinic.com', role: 'NURSE', phone: '0912345680', password: '$2b$10$MUc07DKfI1rqwvTZW0I37ecljc9nkK60n0dKW9xbGWOofu/Er8cO.', availability: true, specialties: [] },
      { username: 'doctor1', fullname: 'Dr. Sarah Johnson', email: 'sarah.johnson@clinic.com', role: 'DOCTOR', phone: null, password: '$2a$10$pnmg8zDS7aJLppEDSWfJHO1QUqVc.Hr8En0ZKCQY9imAnRjHbPoKq', availability: true, specialties: [] },
      { username: 'billing1', fullname: 'John Smith', email: 'john.smith@clinic.com', role: 'BILLING_OFFICER', phone: null, password: '$2a$10$ZuC76PJvr5oNhZaKOU5waOnEYjLaGQ/zYrbW6foO./yKmpkjiPV5u', availability: true, specialties: [] },
      { username: 'hayder', fullname: 'Dr. Hayder', email: 'hayder@clinic.com', role: 'DOCTOR', phone: '0912345678', password: '$2a$10$CA6ZGS.n.pLNZubQuqRqPe/UfRbQLoXYBLWOuIOEzQ5JesjNyLYXC', availability: true, specialties: ['General Doctor'] },
      { username: 'pharmacy', fullname: 'Pharmacy Staff', email: 'pharmacy@clinic.com', role: 'PHARMACIST', phone: '0912345679', password: '$2a$10$CA6ZGS.n.pLNZubQuqRqPe/UfRbQLoXYBLWOuIOEzQ5JesjNyLYXC', availability: true, specialties: [] },
      { username: 'dentist1', fullname: 'Dr. Ahmed Hassan', email: 'ahmed.hassan@clinic.com', role: 'DOCTOR', phone: '+251911234567', password: '$2a$10$uuCK0MzwUFzNvF3kx7sI7OGgjBASVC/iwGjVtiRv5xTTYjflltnW2', availability: true, specialties: ['Dentist', 'Oral Surgery'] },
      { username: 'dentist2', fullname: 'Dr. Fatima Ali', email: 'fatima.ali@clinic.com', role: 'DOCTOR', phone: '+251911234568', password: '$2a$10$Ki65ssISNBfT2F9H2aEop.wcR.eu5I4o6tIAidrV2H1cDCvqZC7g2', availability: true, specialties: ['Dentist', 'Orthodontics'] },
      { username: 'dentist3', fullname: 'Dr. Omar Mohamed', email: 'omar.mohamed@clinic.com', role: 'DOCTOR', phone: '+251911234569', password: '$2a$10$pbsQzrAKAGTXR8q8ybrzD.b2MDxPTgrqMngMlJf2mT47xCUgL2LFq', availability: true, specialties: ['Dentist', 'Periodontics'] },
      { username: 'sarah.nurse', fullname: 'Sarah Johnson', email: 'sarah.johnson.nurse@clinic.com', role: 'NURSE', phone: '+1-555-0101', password: '$2a$10$X5/ZMJojt/Gfhe4edY/SIuZ1mHtpl4WTjPoCmkvNag00umiqyF34O', availability: true, specialties: ['General Nursing', 'Emergency Care'] },
      { username: 'michael.nurse', fullname: 'Michael Chen', email: 'michael.chen.nurse@clinic.com', role: 'NURSE', phone: '+1-555-0102', password: '$2a$10$EJ0XzPk6OrwFgcAfAOzdK.mvp5d6HZK1thB2cG8eeB/xt0MyS1fbi', availability: true, specialties: ['Dental Nursing', 'Patient Care'] },
      { username: 'emily.nurse', fullname: 'Emily Rodriguez', email: 'emily.rodriguez.nurse@clinic.com', role: 'NURSE', phone: '+1-555-0103', password: '$2a$10$ZvMgSPulO5yuR0lM6BcIB.4y8QclcNQk2ymN6a0/aQr/y4wsFVFd.', availability: true, specialties: ['Pediatric Care', 'Health Screening'] },
      { username: 'dentist_entry', fullname: 'Dr. Dental Specialist', email: 'dental.specialist@clinic.com', role: 'DOCTOR', phone: '+251911234570', password: '$2b$10$70GiNqYxXKq.YByGruql4.kKHXb1koabJ3z2qgZJHjPZ4f07Gg8Fa', availability: true, specialties: ['Dentist'] },
      { username: 'nurse1', fullname: 'Nurse Mary Wilson', email: 'mary.wilson@clinic.com', role: 'NURSE', phone: null, password: '$2a$10$/gVRzIy6KUV2YLh7tkY.QuPeyYrzhB3O1d1uIaWT3uBjMQFHtsDXm', availability: true, specialties: [] },
      { username: 'doctor2', fullname: 'Abebe Bekele', email: 'hay@gmial.com', role: 'DOCTOR', phone: '0987878787', password: '$2a$10$XxeHEUkuTw96dKYvpDvoVurokLIUb46PcA9ArPM3JM6/z6mEjUEyS', availability: true, specialties: ['Dentist'] }
    ];

    let createdCount = 0;
    for (const userData of usersData) {
      try {
        await prisma.user.upsert({
          where: { email: userData.email },
          update: {},
          create: userData
        });
        createdCount++;
      } catch (error) {
        console.log(`⚠️  Failed to create ${userData.username}: ${error.message}`);
      }
    }
    console.log(`✅ Created ${createdCount} users`);

    // 2. Create Services
    console.log('\n2. Creating services...');
    const services = await prisma.service.createMany({
      data: [
        { name: 'Consultation', code: 'BAS-CON', description: 'Initial examination', price: 50.0, category: 'CONSULTATION' },
        { name: 'Root Canal', code: 'END-RCT', description: 'Root canal treatment', price: 400.0, category: 'TREATMENT' },
        { name: 'X-Ray - Bitewing', code: 'DIA-XBW', description: 'Dental X-Ray', price: 65.0, category: 'RADIOLOGY' },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${services.count} services`);

    // 3. Create Lab Investigation Types
    console.log('\n3. Creating investigation types...');
    const investigations = await prisma.investigationType.createMany({
      data: [
        { name: 'CBC', price: 20.0, category: 'LAB' },
        { name: 'Blood Glucose', price: 15.0, category: 'LAB' },
        { name: 'Hemoglobin (Hb)', price: 25.0, category: 'LAB' },
        { name: 'CT Scan', price: 150.0, category: 'RADIOLOGY' },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${investigations.count} investigation types`);

    // 4. Create Departments
    console.log('\n4. Creating departments...');
    const departments = await prisma.department.createMany({
      data: [
        { name: 'Dentists', description: 'Dental diagnosis and treatment' },
        { name: 'Lab', description: 'Laboratory testing' },
        { name: 'Radiology', description: 'Imaging services' },
        { name: 'Pharmacy', description: 'Medication dispensing' },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${departments.count} departments`);

    // 5. Create Insurance
    console.log('\n5. Creating insurance...');
    const insurance = await prisma.insurance.create({
      data: {
        name: 'Standard Insurance',
        code: 'INS-001',
        isActive: true,
      },
    });
    console.log('✅ Insurance created:', insurance.name);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📝 All users copied from local database');
    console.log('📊 Total users:', createdCount);
    console.log('\n');

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
