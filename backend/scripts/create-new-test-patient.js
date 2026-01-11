const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createNewTestPatient() {
  try {
    console.log('🔧 Creating new test patient for doctor...\n');

    // 1. Find a doctor (doctor1 or any available doctor)
    const doctor = await prisma.user.findFirst({
      where: {
        role: 'DOCTOR',
        isActive: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (!doctor) {
      throw new Error('No active doctor found. Please create a doctor first.');
    }

    console.log(`✅ Found doctor: ${doctor.fullname} (${doctor.username})\n`);

    // 2. Generate unique patient ID
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todaysPatients = await prisma.patient.count({
      where: {
        id: { startsWith: `PAT-${dateStr}-` }
      }
    });

    const patientId = `PAT-${dateStr}-${String(todaysPatients + 1).padStart(3, '0')}`;
    console.log(`📝 Generated Patient ID: ${patientId}\n`);

    // 3. Create patient
    const patient = await prisma.patient.create({
      data: {
        id: patientId,
        name: 'New Test Patient',
        type: 'REGULAR',
        mobile: `091${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        gender: 'MALE',
        dob: new Date('1990-01-01'),
        status: 'Active',
        cardStatus: 'INACTIVE'
      }
    });

    console.log(`✅ Created patient: ${patient.name} (${patient.id})\n`);

    // 4. Get card services
    const cardRegService = await prisma.service.findUnique({
      where: { code: 'CARD-REG' }
    });

    const cardActService = await prisma.service.findUnique({
      where: { code: 'CARD-ACT' }
    });

    if (!cardRegService || !cardActService) {
      throw new Error('Card services (CARD-REG, CARD-ACT) not found. Please run seed files first.');
    }

    console.log('✅ Found card services\n');

    // 5. Create billing for card registration
    const registrationBilling = await prisma.billing.create({
      data: {
        patientId: patient.id,
        totalAmount: cardRegService.price,
        status: 'PAID',
        notes: 'Card registration payment'
      }
    });

    // Add service to billing
    await prisma.billingService.create({
      data: {
        billingId: registrationBilling.id,
        serviceId: cardRegService.id,
        quantity: 1,
        unitPrice: cardRegService.price,
        totalPrice: cardRegService.price
      }
    });

    // Add payment
    await prisma.billPayment.create({
      data: {
        billingId: registrationBilling.id,
        patientId: patient.id,
        amount: cardRegService.price,
        type: 'CASH',
        notes: 'Card registration payment'
      }
    });

    console.log('✅ Paid for card registration\n');

    // 6. Activate card
    const activationBilling = await prisma.billing.create({
      data: {
        patientId: patient.id,
        totalAmount: cardActService.price,
        status: 'PAID',
        notes: 'Card activation payment'
      }
    });

    await prisma.billingService.create({
      data: {
        billingId: activationBilling.id,
        serviceId: cardActService.id,
        quantity: 1,
        unitPrice: cardActService.price,
        totalPrice: cardActService.price
      }
    });

    await prisma.billPayment.create({
      data: {
        billingId: activationBilling.id,
        patientId: patient.id,
        amount: cardActService.price,
        type: 'CASH',
        notes: 'Card activation payment'
      }
    });

    // Create card activation record (if CardActivation model exists)
    try {
      await prisma.cardActivation.create({
        data: {
          patient: { connect: { id: patient.id } },
          billing: { connect: { id: activationBilling.id } },
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          activatedBy: doctor.id
        }
      });
    } catch (e) {
      // CardActivation model might not exist or have different structure, just skip
      console.log('ℹ️  CardActivation record skipped');
    }

    // Update patient card status
    await prisma.patient.update({
      where: { id: patient.id },
      data: { cardStatus: 'ACTIVE' }
    });

    // Refresh patient to get updated card status
    const updatedPatient = await prisma.patient.findUnique({
      where: { id: patient.id },
      select: { cardStatus: true }
    });

    console.log('✅ Card activated\n');

    // 7. Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        status: 'Pending'
      }
    });

    console.log('✅ Created assignment\n');

    // 8. Create visit in IN_DOCTOR_QUEUE status
    const visitUid = `VISIT-${dateStr}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const visit = await prisma.visit.create({
      data: {
        visitUid: visitUid,
        patientId: patient.id,
        suggestedDoctorId: doctor.id,
        assignmentId: assignment.id,
        status: 'IN_DOCTOR_QUEUE',
        queueType: 'CONSULTATION',
        isEmergency: false,
        notes: 'Test visit for lab ordering - new test patient'
      }
    });

    console.log(`✅ Created visit: ${visit.visitUid} (Status: ${visit.status})\n`);

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ NEW TEST PATIENT CREATED SUCCESSFULLY!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    // Get final patient data
    const finalPatient = await prisma.patient.findUnique({
      where: { id: patient.id },
      select: { name: true, id: true, mobile: true, cardStatus: true }
    });

    console.log('Patient Details:');
    console.log(`  Name: ${finalPatient.name}`);
    console.log(`  ID: ${finalPatient.id}`);
    console.log(`  Mobile: ${finalPatient.mobile}`);
    console.log(`  Card Status: ${finalPatient.cardStatus}`);
    console.log(`\nVisit Details:`);
    console.log(`  Visit UID: ${visit.visitUid}`);
    console.log(`  Visit ID: ${visit.id}`);
    console.log(`  Status: ${visit.status}`);
    console.log(`  Doctor: ${doctor.fullname}`);
    console.log(`\n✅ Patient is ready for lab test ordering!`);
    console.log('   You can now order lab tests from the doctor side.\n');

  } catch (error) {
    console.error('❌ Error creating test patient:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createNewTestPatient();

