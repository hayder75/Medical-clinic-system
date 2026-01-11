const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestPatientForSarah() {
  console.log('🌱 Creating test patient for Dr Sarah Johnson...\n');

  try {
    // Find or create Dr Sarah Johnson
    let sarah = await prisma.user.findFirst({
      where: {
        OR: [
          { fullname: { contains: 'Sarah', mode: 'insensitive' } },
          { fullname: { contains: 'Johnson', mode: 'insensitive' } },
          { username: { contains: 'sarah', mode: 'insensitive' } }
        ],
        role: 'DOCTOR'
      }
    });

    if (!sarah) {
      console.log('Dr Sarah Johnson not found. Creating...');
      const hashedPassword = await bcrypt.hash('doctor123', 10);
      sarah = await prisma.user.create({
        data: {
          username: 'sarah.johnson',
          fullname: 'Dr Sarah Johnson',
          password: hashedPassword,
          email: 'sarah.johnson@clinic.com',
          role: 'DOCTOR',
          isActive: true,
          availability: true,
          specialties: ['General Medicine']
        }
      });
      console.log(`✅ Created Dr Sarah Johnson (username: ${sarah.username})\n`);
    } else {
      console.log(`✅ Found Dr Sarah Johnson (username: ${sarah.username})\n`);
    }

    // Create or update test patient
    console.log('1️⃣  Creating/updating test patient...');
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
    console.log(`✅ Patient: ${patient.name} (ID: ${patient.id})\n`);

    // Delete old visits for this patient
    await prisma.visit.deleteMany({
      where: { patientId: patient.id }
    });
    console.log('✅ Cleared old visits\n');

    // Create assignment to Dr Sarah Johnson
    console.log('2️⃣  Creating assignment to Dr Sarah Johnson...');
    let assignment = await prisma.assignment.findFirst({
      where: {
        patientId: patient.id,
        doctorId: sarah.id
      }
    });

    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          patientId: patient.id,
          doctorId: sarah.id,
          status: 'Active'
        }
      });
    } else {
      assignment = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'Active' }
      });
    }
    console.log(`✅ Assignment created (ID: ${assignment.id})\n`);

    // Create visit with status that shows in doctor queue
    console.log('3️⃣  Creating visit...');
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        assignmentId: assignment.id,
        suggestedDoctorId: sarah.id,
        status: 'IN_DOCTOR_QUEUE', // This status shows in doctor's main queue
        isEmergency: false,
        visitUid: `VISIT-${Date.now()}`
      }
    });
    console.log(`✅ Visit created: ${visit.visitUid} (Status: ${visit.status})\n`);

    // Create vital signs
    console.log('4️⃣  Creating vital signs...');
    const existingVital = await prisma.vitalSign.findFirst({
      where: { visitId: visit.id }
    });

    if (!existingVital) {
      await prisma.vitalSign.create({
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
    }
    console.log(`✅ Vital signs recorded\n`);

    console.log('🎉 Test patient created and assigned to Dr Sarah Johnson!');
    console.log(`\n📋 Summary:`);
    console.log(`   Doctor: ${sarah.fullname} (${sarah.username})`);
    console.log(`   Patient: ${patient.name} (${patient.id})`);
    console.log(`   Visit: ${visit.visitUid} (Status: ${visit.status})`);
    console.log(`   Assignment: ${assignment.id}`);
    console.log(`\n💡 Dr Sarah Johnson should now see this patient in the MAIN queue.`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatientForSarah();

