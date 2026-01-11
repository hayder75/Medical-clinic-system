const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedTestPatient() {
  console.log('🌱 Creating test patient and visit for doctor testing...\n');

  try {
    // Get doctor1 user
    const doctor = await prisma.user.findUnique({
      where: { username: 'doctor1' }
    });

    if (!doctor) {
      console.error('❌ doctor1 user not found. Please create users first.');
      process.exit(1);
    }

    // Create test patient
    console.log('1️⃣  Creating test patient...');
    const patient = await prisma.patient.upsert({
      where: { id: 'test-patient-doctor-001' },
      update: {},
      create: {
        id: 'test-patient-doctor-001',
        name: 'Test Patient for Doctor',
        type: 'REGULAR',
        gender: 'MALE',
        dob: new Date('1990-01-15'),
        mobile: '0912345678',
        email: 'testpatient@example.com',
        address: '123 Test Street',
        bloodType: 'O_PLUS',
        status: 'Active'
      }
    });
    console.log(`✅ Created patient: ${patient.name} (ID: ${patient.id})\n`);

    // Create visit with TRIAGED status (so doctor can access it)
    console.log('2️⃣  Creating test visit...');
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        status: 'TRIAGED',
        isEmergency: false,
        visitUid: `VISIT-${Date.now()}`
      }
    });
    console.log(`✅ Created visit: ${visit.visitUid} (ID: ${visit.id}, Status: ${visit.status})\n`);

    // Create vital signs for the visit
    console.log('3️⃣  Creating vital signs...');
    const vital = await prisma.vitalSign.create({
      data: {
        visitId: visit.id,
        patientId: patient.id,
        bloodPressure: '120/80',
        temperature: 36.5,
        heartRate: 72,
        weight: 70,
        height: 175,
        oxygenSaturation: 98,
        respirationRate: 16
      }
    });
    console.log(`✅ Created vital signs for visit\n`);

    console.log('🎉 Test patient and visit created successfully!');
    console.log(`\n📋 Test Data:`);
    console.log(`   Patient ID: ${patient.id}`);
    console.log(`   Patient Name: ${patient.name}`);
    console.log(`   Visit ID: ${visit.id}`);
    console.log(`   Visit UID: ${visit.visitUid}`);
    console.log(`   Visit Status: ${visit.status}`);
    console.log(`\n💡 Doctor can now access this patient from the triage queue or consultation page.`);

  } catch (error) {
    console.error('❌ Error creating test patient:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestPatient();

