const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedThirdTestPatient() {
  console.log('🌱 Creating third test patient and visit for doctor testing...\n');

  try {
    // Get doctor1 user (Dr. Sarah Johnson)
    const doctor = await prisma.user.findUnique({
      where: { username: 'doctor1' }
    });

    if (!doctor) {
      console.error('❌ doctor1 user not found. Please create users first.');
      process.exit(1);
    }
    console.log(`✅ Found Dr Sarah Johnson (username: ${doctor.username})\n`);

    // Create third test patient
    console.log('1️⃣  Creating/updating third test patient...');
    const patient = await prisma.patient.upsert({
      where: { id: 'test-patient-doctor-003' },
      update: {
        name: 'Third Test Patient for Doctor',
        gender: 'MALE',
        dob: new Date('1992-03-10'),
        mobile: '0923456789',
        email: 'testpatient3@example.com',
        address: '789 Test Boulevard',
        bloodType: 'B_PLUS',
        status: 'Active',
        cardStatus: 'ACTIVE' // Ensure card is active for billing
      },
      create: {
        id: 'test-patient-doctor-003',
        name: 'Third Test Patient for Doctor',
        gender: 'MALE',
        dob: new Date('1992-03-10'),
        mobile: '0923456789',
        email: 'testpatient3@example.com',
        address: '789 Test Boulevard',
        bloodType: 'B_PLUS',
        status: 'Active',
        cardStatus: 'ACTIVE', // Ensure card is active for billing
        type: 'REGULAR' // Add patient type
      }
    });
    console.log(`✅ Patient: ${patient.name} (ID: ${patient.id})\n`);

    // Clear old visits for this patient to ensure a clean state
    await prisma.visit.deleteMany({
      where: { patientId: patient.id }
    });
    console.log('✅ Cleared old visits\n');

    // Create assignment to Dr Sarah Johnson
    console.log('2️⃣  Creating assignment to Dr Sarah Johnson...');
    let assignment = await prisma.assignment.findFirst({
      where: {
        patientId: patient.id,
        doctorId: doctor.id
      }
    });

    if (!assignment) {
      assignment = await prisma.assignment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          status: 'Active'
        }
      });
      console.log(`✅ Assignment created (ID: ${assignment.id})\n`);
    } else {
      // Update existing assignment to Active
      assignment = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'Active' }
      });
      console.log(`✅ Assignment updated (ID: ${assignment.id})\n`);
    }

    // Create visit with WAITING_FOR_TRIAGE status and link to assignment
    console.log('3️⃣  Creating visit with WAITING_FOR_TRIAGE status...');
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        suggestedDoctorId: doctor.id,
        assignmentId: assignment.id,
        status: 'WAITING_FOR_TRIAGE', // Set to WAITING_FOR_TRIAGE for triage queue
        isEmergency: false,
        visitUid: `VISIT-${Date.now()}-003`,
        queueType: 'CONSULTATION'
      }
    });
    console.log(`✅ Visit created: ${visit.visitUid} (Status: ${visit.status})\n`);

    console.log('🎉 Third test patient created and assigned to Dr Sarah Johnson!');
    console.log(`\n📋 Summary:`);
    console.log(`   Doctor: ${doctor.fullname} (${doctor.username})`);
    console.log(`   Patient: ${patient.name} (${patient.id})`);
    console.log(`   Visit: ${visit.visitUid} (Status: ${visit.status})`);
    console.log(`   Assignment: ${assignment.id}`);
    console.log(`\n💡 Dr Sarah Johnson should now see this patient in the TRIAGE queue.`);
    console.log(`   After filling triage, the patient will move to the MAIN queue.`);

  } catch (error) {
    console.error('❌ Error creating third test patient:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedThirdTestPatient()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to create third test patient:', error);
      process.exit(1);
    });
}

module.exports = { seedThirdTestPatient };

