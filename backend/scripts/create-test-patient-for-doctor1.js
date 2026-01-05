const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const generateVisitUid = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = String(Date.now()).slice(-4);
  return `VISIT-${dateStr}-${timeStr}`;
};

async function createTestPatient() {
  try {
    console.log('🚀 Creating test patient for doctor1...\n');

    // 1. Find doctor1
    const doctor = await prisma.user.findFirst({
      where: { username: 'doctor1', role: 'DOCTOR' },
      select: { 
        id: true, 
        username: true, 
        fullname: true, 
        consultationFee: true,
        waiveConsultationFee: true 
      }
    });

    if (!doctor) {
      console.error('❌ Doctor1 not found!');
      process.exit(1);
    }

    console.log('✅ Found doctor:', doctor.fullname);
    console.log(`   Consultation Fee: ${doctor.consultationFee || 'N/A'}`);
    console.log(`   Waive Fee: ${doctor.waiveConsultationFee ? 'Yes' : 'No'}\n`);

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
        name: 'Test Patient Doctor1',
        mobile: '0912345678',
        type: 'REGULAR',
        cardStatus: 'INACTIVE',
        gender: 'MALE',
        dob: new Date('1990-01-01')
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

    // 7. Create visit with IN_DOCTOR_QUEUE status
    const visit = await prisma.visit.create({
      data: {
        visitUid: generateVisitUid(),
        patientId: patient.id,
        suggestedDoctorId: doctor.id,
        status: 'IN_DOCTOR_QUEUE',
        queueType: 'CONSULTATION',
        isEmergency: false,
        notes: 'Test visit - directly assigned to doctor1'
      }
    });

    console.log('✅ Created visit:', visit.visitUid, '- Status: IN_DOCTOR_QUEUE');

    // 8. Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        status: 'Pending'
      }
    });

    console.log('✅ Created assignment:', assignment.id);

    // 9. Update visit with assignment
    await prisma.visit.update({
      where: { id: visit.id },
      data: {
        assignmentId: assignment.id
      }
    });

    // 10. Create consultation billing if doctor doesn't waive fee
    let consultationBilling = null;
    if (!doctor.waiveConsultationFee && doctor.consultationFee) {
      const consultationService = await prisma.service.findFirst({
        where: {
          category: 'CONSULTATION',
          name: { contains: 'Consultation', mode: 'insensitive' }
        }
      });

      if (consultationService) {
        consultationBilling = await prisma.billing.create({
          data: {
            patientId: patient.id,
            visitId: visit.id,
            totalAmount: doctor.consultationFee,
            status: 'PENDING',
            billingType: 'REGULAR',
            services: {
              create: {
                serviceId: consultationService.id,
                quantity: 1,
                unitPrice: doctor.consultationFee,
                totalPrice: doctor.consultationFee
              }
            }
          }
        });

        console.log('✅ Created consultation billing:', consultationBilling.id, `(${doctor.consultationFee} Birr)`);

        // Pay consultation fee as well
        await prisma.billPayment.create({
          data: {
            billingId: consultationBilling.id,
            patientId: patient.id,
            amount: doctor.consultationFee,
            type: 'CASH'
          }
        });

        await prisma.billing.update({
          where: { id: consultationBilling.id },
          data: { status: 'PAID' }
        });

        console.log('✅ Consultation fee paid');
      }
    } else {
      console.log('ℹ️  Consultation fee waived - no billing created');
    }

    console.log('\n🎉 Success! Patient is now in doctor1 queue.');
    console.log('\n📋 Summary:');
    console.log(`   Patient ID: ${patient.id}`);
    console.log(`   Patient Name: ${patient.name}`);
    console.log(`   Visit UID: ${visit.visitUid}`);
    console.log(`   Visit Status: ${visit.status}`);
    console.log(`   Assigned Doctor: ${doctor.fullname}`);
    console.log(`   Assignment ID: ${assignment.id}`);
    console.log('\n✅ Patient is ready for doctor1 to review!');

  } catch (error) {
    console.error('\n❌ Error creating test patient:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatient()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

