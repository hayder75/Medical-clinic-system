const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedFourthTestPatient() {
  console.log('🌱 Creating fourth test patient and visit for doctor testing...\n');

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

    // Create fourth test patient
    console.log('1️⃣  Creating/updating fourth test patient...');
    const patient = await prisma.patient.upsert({
      where: { id: 'test-patient-doctor-004' },
      update: {
        name: 'Fourth Test Patient for Doctor',
        gender: 'FEMALE',
        dob: new Date('1988-11-25'),
        mobile: '0934567890',
        email: 'testpatient4@example.com',
        address: '321 Test Circle',
        bloodType: 'AB_PLUS',
        status: 'Active',
        cardStatus: 'ACTIVE' // Ensure card is active for billing
      },
      create: {
        id: 'test-patient-doctor-004',
        name: 'Fourth Test Patient for Doctor',
        gender: 'FEMALE',
        dob: new Date('1988-11-25'),
        mobile: '0934567890',
        email: 'testpatient4@example.com',
        address: '321 Test Circle',
        bloodType: 'AB_PLUS',
        status: 'Active',
        cardStatus: 'ACTIVE', // Ensure card is active for billing
        type: 'REGULAR' // Add patient type
      }
    });
    console.log(`✅ Patient: ${patient.name} (ID: ${patient.id})\n`);

    // Clear old visits for this patient to ensure a clean state
    // Need to delete related records first due to foreign key constraints
    const oldVisits = await prisma.visit.findMany({
      where: { patientId: patient.id },
      select: { id: true }
    });
    
    if (oldVisits.length > 0) {
      const oldVisitIds = oldVisits.map(v => v.id);
      // Delete related records first
      await prisma.medicationOrder.deleteMany({ where: { visitId: { in: oldVisitIds } } });
      await prisma.billPayment.deleteMany({ where: { billing: { visitId: { in: oldVisitIds } } } });
      await prisma.billingService.deleteMany({ where: { billing: { visitId: { in: oldVisitIds } } } });
      await prisma.billing.deleteMany({ where: { visitId: { in: oldVisitIds } } });
      await prisma.vitalSign.deleteMany({ where: { visitId: { in: oldVisitIds } } });
      // Then delete visits
      await prisma.visit.deleteMany({ where: { patientId: patient.id } });
      console.log(`✅ Cleared ${oldVisits.length} old visit(s) and related records\n`);
    } else {
      console.log('✅ No old visits to clear\n');
    }

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
        visitUid: `VISIT-${Date.now()}-004`,
        queueType: 'CONSULTATION'
      }
    });
    console.log(`✅ Visit created: ${visit.visitUid} (Status: ${visit.status})\n`);

    // Find or create consultation service
    console.log('4️⃣  Creating consultation billing...');
    let consultationService = await prisma.service.findFirst({
      where: {
        category: 'CONSULTATION',
        isActive: true
      }
    });

    if (!consultationService) {
      // Create a default consultation service if none exists
      consultationService = await prisma.service.create({
        data: {
          code: 'CONS001',
          name: 'Consultation Fee',
          category: 'CONSULTATION',
          price: 100.00,
          isActive: true
        }
      });
      console.log(`✅ Created default consultation service: ${consultationService.code}\n`);
    } else {
      console.log(`✅ Found consultation service: ${consultationService.code} (${consultationService.name})\n`);
    }

    // Create billing for consultation
    const billing = await prisma.billing.create({
      data: {
        patientId: patient.id,
        visitId: visit.id,
        totalAmount: consultationService.price,
        status: 'PENDING',
        notes: 'Consultation fee for test patient'
      }
    });
    console.log(`✅ Created billing: ${billing.id} (Amount: ${billing.totalAmount})\n`);

    // Add consultation service to billing
    await prisma.billingService.create({
      data: {
        billingId: billing.id,
        serviceId: consultationService.id,
        quantity: 1,
        unitPrice: consultationService.price,
        totalPrice: consultationService.price
      }
    });
    console.log(`✅ Added consultation service to billing\n`);

    // Create payment for consultation (mark as PAID)
    await prisma.billPayment.create({
      data: {
        billingId: billing.id,
        patientId: patient.id,
        amount: consultationService.price,
        type: 'CASH',
        notes: 'Test patient consultation fee payment'
      }
    });
    console.log(`✅ Created payment for consultation\n`);

    // Update billing status to PAID
    await prisma.billing.update({
      where: { id: billing.id },
      data: { status: 'PAID' }
    });
    console.log(`✅ Updated billing status to PAID\n`);

    console.log('🎉 Fourth test patient created and assigned to Dr Sarah Johnson!');
    console.log(`\n📋 Summary:`);
    console.log(`   Doctor: ${doctor.fullname} (${doctor.username})`);
    console.log(`   Patient: ${patient.name} (${patient.id})`);
    console.log(`   Visit: ${visit.visitUid} (Status: ${visit.status})`);
    console.log(`   Assignment: ${assignment.id}`);
    console.log(`\n💡 Dr Sarah Johnson should now see this patient in the TRIAGE queue.`);
    console.log(`   After filling triage, the patient will move to the MAIN queue.`);

  } catch (error) {
    console.error('❌ Error creating fourth test patient:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedFourthTestPatient()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to create fourth test patient:', error);
      process.exit(1);
    });
}

module.exports = { seedFourthTestPatient };

