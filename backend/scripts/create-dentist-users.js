const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDentistUsers() {
  try {
    console.log('🦷 Creating dentist users...');

    // Create dentist users
    const dentists = [
      {
        fullname: 'Dr. Ahmed Hassan',
        username: 'dentist1',
        password: await bcrypt.hash('dentist123', 10),
        email: 'ahmed.hassan@clinic.com',
        phone: '+251911234567',
        role: 'DOCTOR',
        specialties: ['Dentist', 'Oral Surgery'],
        licenseNumber: 'DENT-001',
        consultationFee: 800
      },
      {
        fullname: 'Dr. Fatima Ali',
        username: 'dentist2',
        password: await bcrypt.hash('dentist123', 10),
        email: 'fatima.ali@clinic.com',
        phone: '+251911234568',
        role: 'DOCTOR',
        specialties: ['Dentist', 'Orthodontics'],
        licenseNumber: 'DENT-002',
        consultationFee: 750
      },
      {
        fullname: 'Dr. Omar Mohamed',
        username: 'dentist3',
        password: await bcrypt.hash('dentist123', 10),
        email: 'omar.mohamed@clinic.com',
        phone: '+251911234569',
        role: 'DOCTOR',
        specialties: ['Dentist', 'Periodontics'],
        licenseNumber: 'DENT-003',
        consultationFee: 700
      }
    ];

    for (const dentist of dentists) {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { username: dentist.username }
      });

      if (existingUser) {
        console.log(`✅ Dentist ${dentist.username} already exists`);
        continue;
      }

      const createdDentist = await prisma.user.create({
        data: dentist
      });

      console.log(`✅ Created dentist: ${createdDentist.fullname} (${createdDentist.username})`);
    }

    // Create some tooth data for reference
    console.log('🦷 Creating tooth reference data...');
    
    const toothData = [
      // Upper jaw (right to left)
      { number: 18, eruptionStart: 17, eruptionEnd: 21, rootCompletion: 9 }, // Wisdom tooth
      { number: 17, eruptionStart: 17, eruptionEnd: 21, rootCompletion: 9 }, // Wisdom tooth
      { number: 16, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 },   // First molar
      { number: 15, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // Second premolar
      { number: 14, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // First premolar
      { number: 13, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 11 },  // Canine
      { number: 12, eruptionStart: 8, eruptionEnd: 9, rootCompletion: 10 },   // Lateral incisor
      { number: 11, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 },   // Central incisor
      
      { number: 21, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 },   // Central incisor
      { number: 22, eruptionStart: 8, eruptionEnd: 9, rootCompletion: 10 },   // Lateral incisor
      { number: 23, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 11 },  // Canine
      { number: 24, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // First premolar
      { number: 25, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // Second premolar
      { number: 26, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 },    // First molar
      { number: 27, eruptionStart: 17, eruptionEnd: 21, rootCompletion: 9 },  // Wisdom tooth
      { number: 28, eruptionStart: 17, eruptionEnd: 21, rootCompletion: 9 },  // Wisdom tooth
      
      // Lower jaw (left to right)
      { number: 38, eruptionStart: 17, eruptionEnd: 21, rootCompletion: 9 },  // Wisdom tooth
      { number: 37, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 },   // First molar
      { number: 36, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 },   // First molar
      { number: 35, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // Second premolar
      { number: 34, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // First premolar
      { number: 33, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 11 },  // Canine
      { number: 32, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 },  // Lateral incisor
      { number: 31, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 10 },   // Central incisor
      
      { number: 41, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 10 },  // Central incisor
      { number: 42, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 },  // Lateral incisor
      { number: 43, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 11 },  // Canine
      { number: 44, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // First premolar
      { number: 45, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 13 }, // Second premolar
      { number: 46, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 },    // First molar
      { number: 47, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 },   // First molar
      { number: 48, eruptionStart: 17, eruptionEnd: 21, rootCompletion: 9 },  // Wisdom tooth
    ];

    for (const tooth of toothData) {
      const existingTooth = await prisma.tooth.findFirst({
        where: { number: tooth.number }
      });

      if (!existingTooth) {
        await prisma.tooth.create({
          data: tooth
        });
        console.log(`✅ Created tooth reference: ${tooth.number}`);
      }
    }

    console.log('🎉 Dentist users and tooth data created successfully!');
    console.log('\n📋 Login credentials for dentists:');
    console.log('Username: dentist1, Password: dentist123');
    console.log('Username: dentist2, Password: dentist123');
    console.log('Username: dentist3, Password: dentist123');

  } catch (error) {
    console.error('❌ Error creating dentist users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDentistUsers();
