const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate unique visit UID
const generateVisitUid = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `VISIT-${dateStr}-${timeStr}`;
};

async function createTestPatient() {
  try {
    console.log('🚀 Creating test patient for dentist...\n');

    // 1. Find the dentist doctor
    const dentist = await prisma.user.findFirst({
      where: { username: 'dentist_entr', role: 'DOCTOR' },
      select: { id: true, username: true, fullname: true, waiveConsultationFee: true }
    });

    if (!dentist) {
      console.error('❌ Dentist doctor not found!');
      process.exit(1);
    }

    console.log('✅ Found dentist:', dentist.fullname, `(waiveConsultationFee: ${dentist.waiveConsultationFee})`);

    // 2. Generate patient ID
    const now = new Date();
    const year = now.getFullYear();
    const patientCount = await prisma.patient.count();
    const patientNumber = String(patientCount + 1).padStart(2, '0');
    const patientId = `PAT-${year}-${patientNumber}`;

    // 3. Get card registration service
    const cardRegService = await prisma.service.findFirst({
      where: { code: 'CARD-REG', isActive: true }
    });

    if (!cardRegService) {
      console.error('❌ Card registration service not found!');
      process.exit(1);
    }

    // 4. Create patient
    const patient = await prisma.patient.create({
      data: {
        id: patientId,
        name: 'Test Patient Print',
        mobile: '0912345678',
        type: 'REGULAR',
        cardStatus: 'INACTIVE'
      }
    });

    console.log('✅ Created patient:', patient.id, '-', patient.name);

    // 5. Create card registration billing
    const billing = await prisma.billing.create({
      data: {
        patientId: patient.id,
        totalAmount: cardRegService.price,
        status: 'PENDING',
        billingType: 'REGULAR',
        services: {
          create: {
            serviceId: cardRegService.id,
            quantity: 1,
            unitPrice: cardRegService.price,
            totalPrice: cardRegService.price
          }
        }
      }
    });

    console.log('✅ Created card registration bill:', billing.id, `(${cardRegService.price} Birr)`);

    // 6. Pay the bill (activate card)
    await prisma.billPayment.create({
      data: {
        billingId: billing.id,
        patientId: patient.id,
        amount: cardRegService.price,
        type: 'CASH'
      }
    });

    // Update billing status
    await prisma.billing.update({
      where: { id: billing.id },
      data: { status: 'PAID' }
    });

    // Activate patient card
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        cardStatus: 'ACTIVE',
        cardActivatedAt: new Date()
      }
    });

    console.log('✅ Card activated and bill paid');

    // 7. Create visit
    const visit = await prisma.visit.create({
      data: {
        visitUid: generateVisitUid(),
        patientId: patient.id,
        status: 'WAITING_FOR_TRIAGE',
        queueType: 'CONSULTATION',
        isEmergency: false
      }
    });

    console.log('✅ Created visit:', visit.id, '- Status:', visit.status);

    // 8. Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        patientId: patient.id,
        doctorId: dentist.id,
        status: 'Pending'
      }
    });

    console.log('✅ Created assignment:', assignment.id);

    // 9. Update visit with assignment and doctor
    // Since doctor has fee waiver, status should be WAITING_FOR_DOCTOR
    await prisma.visit.update({
      where: { id: visit.id },
      data: {
        assignmentId: assignment.id,
        suggestedDoctorId: dentist.id,
        status: 'WAITING_FOR_DOCTOR' // Direct to doctor queue since fee is waived
      }
    });

    console.log('✅ Visit updated - Status: WAITING_FOR_DOCTOR');
    console.log('✅ Patient assigned to dentist:', dentist.fullname);

    console.log('\n🎉 Success! Patient is now in dentist queue.');
    console.log('\n📋 Summary:');
    console.log(`   Patient ID: ${patient.id}`);
    console.log(`   Patient Name: ${patient.name}`);
    console.log(`   Visit ID: ${visit.id}`);
    console.log(`   Doctor: ${dentist.fullname} (${dentist.username})`);
    console.log(`   Status: WAITING_FOR_DOCTOR`);
    console.log(`   Fee Waived: ${dentist.waiveConsultationFee ? 'Yes' : 'No'}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatient();

