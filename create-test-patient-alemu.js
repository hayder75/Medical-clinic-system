const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestPatientAlemu() {
  try {
    console.log('🏥 Creating test patient Alemu with comprehensive orders...');

    // 1. Create patient
    const patient = await prisma.patient.create({
      data: {
        firstName: 'Alemu',
        lastName: 'Test',
        mobile: '0912345678',
        email: 'alemu.test@example.com',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        bloodType: 'O+',
        address: 'Test Address, Addis Ababa',
        emergencyContact: 'Emergency Contact',
        emergencyPhone: '0912345679',
        insuranceId: null
      }
    });

    console.log('✅ Patient created:', patient.id);

    // 2. Create visit
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        visitUid: `VISIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        date: new Date(),
        status: 'UNDER_DOCTOR_REVIEW',
        priority: 'NORMAL',
        priorityReason: 'Test patient for comprehensive workflow',
        notes: 'Test patient with lab, radiology, and nurse service orders'
      }
    });

    console.log('✅ Visit created:', visit.visitUid);

    // 3. Assign to doctor (Dr. Hayder)
    const doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR', fullname: { contains: 'Hayder' } }
    });

    if (doctor) {
      await prisma.assignment.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          doctorId: doctor.id,
          assignedAt: new Date(),
          status: 'ACTIVE'
        }
      });
      console.log('✅ Assigned to doctor:', doctor.fullname);
    }

    // 4. Create consultation billing (paid)
    const consultationService = await prisma.service.findFirst({
      where: { code: 'CONS001' }
    });

    if (consultationService) {
      const billing = await prisma.billing.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          totalAmount: consultationService.price,
          status: 'PAID',
          notes: 'Consultation fee for test patient'
        }
      });

      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: consultationService.id,
          quantity: 1,
          unitPrice: consultationService.price,
          totalPrice: consultationService.price
        }
      });

      await prisma.billPayment.create({
        data: {
          billingId: billing.id,
          amount: consultationService.price,
          type: 'CASH',
          paidAt: new Date(),
          notes: 'Consultation payment'
        }
      });

      console.log('✅ Consultation billing created and paid');
    }

    // 5. Create lab orders
    const labServices = await prisma.service.findMany({
      where: { category: 'LAB', isActive: true },
      take: 1
    });

    if (labServices.length > 0) {
      const labOrder = await prisma.labOrder.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          status: 'PENDING',
          notes: 'Test lab order for Alemu'
        }
      });

      await prisma.labOrderItem.create({
        data: {
          labOrderId: labOrder.id,
          serviceId: labServices[0].id,
          quantity: 1,
          unitPrice: labServices[0].price,
          totalPrice: labServices[0].price
        }
      });

      console.log('✅ Lab order created:', labServices[0].name);
    }

    // 6. Create radiology orders
    const radiologyServices = await prisma.service.findMany({
      where: { category: 'RADIOLOGY', isActive: true },
      take: 1
    });

    if (radiologyServices.length > 0) {
      const radiologyOrder = await prisma.radiologyOrder.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          status: 'PENDING',
          notes: 'Test radiology order for Alemu'
        }
      });

      await prisma.radiologyOrderItem.create({
        data: {
          radiologyOrderId: radiologyOrder.id,
          serviceId: radiologyServices[0].id,
          quantity: 1,
          unitPrice: radiologyServices[0].price,
          totalPrice: radiologyServices[0].price
        }
      });

      console.log('✅ Radiology order created:', radiologyServices[0].name);
    }

    // 7. Create nurse service orders
    const nurseServices = await prisma.service.findMany({
      where: { category: 'NURSE', isActive: true },
      take: 1
    });

    if (nurseServices.length > 0) {
      const nurse = await prisma.user.findFirst({
        where: { role: 'NURSE', availability: true }
      });

      if (nurse) {
        await prisma.nurseServiceAssignment.create({
          data: {
            visitId: visit.id,
            serviceId: nurseServices[0].id,
            assignedNurseId: nurse.id,
            assignedById: doctor?.id || null,
            status: 'PENDING',
            notes: 'Test nurse service for Alemu',
            orderType: 'DOCTOR_ORDERED'
          }
        });

        console.log('✅ Nurse service order created:', nurseServices[0].name, 'assigned to', nurse.fullname);
      }
    }

    // 8. Create billing for all services
    const allServices = [...(labServices || []), ...(radiologyServices || []), ...(nurseServices || [])];
    if (allServices.length > 0) {
      const totalAmount = allServices.reduce((sum, service) => sum + service.price, 0);
      
      const billing = await prisma.billing.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          totalAmount: totalAmount,
          status: 'PENDING',
          notes: 'Test billing for Alemu - Lab, Radiology, and Nurse services'
        }
      });

      for (const service of allServices) {
        await prisma.billingService.create({
          data: {
            billingId: billing.id,
            serviceId: service.id,
            quantity: 1,
            unitPrice: service.price,
            totalPrice: service.price
          }
        });
      }

      console.log('✅ Billing created for all services - Total:', totalAmount);
    }

    console.log('\n🎉 Test patient Alemu created successfully!');
    console.log('📋 Summary:');
    console.log(`   Patient: ${patient.firstName} ${patient.lastName} (${patient.id})`);
    console.log(`   Visit: ${visit.visitUid}`);
    console.log(`   Status: ${visit.status}`);
    console.log(`   Lab Orders: ${labServices.length > 0 ? '1' : '0'}`);
    console.log(`   Radiology Orders: ${radiologyServices.length > 0 ? '1' : '0'}`);
    console.log(`   Nurse Services: ${nurseServices.length > 0 ? '1' : '0'}`);
    console.log(`   Total Billing Amount: ${allServices.reduce((sum, s) => sum + s.price, 0)} ETB`);

  } catch (error) {
    console.error('❌ Error creating test patient:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatientAlemu();




