const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createDaniel() {
    const patientId = 'PAT-2026-DANIEL';

    // 1. Create Patient Daniel
    const patient = await prisma.patient.upsert({
        where: { id: patientId },
        update: {
            name: 'Daniel Test',
            gender: 'MALE',
            type: 'REGULAR',
            mobile: '0912345678',
            status: 'Active',
            cardStatus: 'ACTIVE',
            cardActivatedAt: new Date(),
            cardExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        create: {
            id: patientId,
            name: 'Daniel Test',
            gender: 'MALE',
            type: 'REGULAR',
            mobile: '0912345678',
            status: 'Active',
            cardStatus: 'ACTIVE',
            cardActivatedAt: new Date(),
            cardExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
    });
    console.log('✅ Patient Daniel created/updated');

    // 2. Create Billing for Registration and Consultation
    const billing = await prisma.billing.create({
        data: {
            patientId: patient.id,
            totalAmount: 500,
            status: 'PAID',
            billingType: 'REGULAR',
            services: {
                create: [
                    {
                        serviceId: '25e0e781-7c16-49a6-bbb1-2d3e90ea88ab', // Patient Card Registration
                        quantity: 1,
                        unitPrice: 300,
                        totalPrice: 300
                    },
                    {
                        serviceId: '686f57bc-f275-4b5d-a69e-d3a41bcb2c5d', // General Doctor Consultation
                        quantity: 1,
                        unitPrice: 200,
                        totalPrice: 200
                    }
                ]
            }
        }
    });
    console.log('✅ Billing created and marked as PAID');

    // 3. Create Payment record
    await prisma.billPayment.create({
        data: {
            billingId: billing.id,
            patientId: patient.id,
            amount: 500,
            type: 'CASH',
            notes: 'Test payment for Daniel'
        }
    });
    console.log('✅ Payment record created');

    // 4. Create Visit and put him in DOCTOR_ASSIGNED queue
    const visitUid = `VISIT-20260105-DANIEL`;
    const visit = await prisma.visit.create({
        data: {
            visitUid: visitUid,
            patientId: patient.id,
            status: 'WAITING_FOR_DOCTOR', // This usually puts them in the doctor's queue
            queueType: 'CONSULTATION',
            notes: 'Initial visit for Daniel Test'
        }
    });

    // Link billing to visit
    await prisma.billing.update({
        where: { id: billing.id },
        data: { visitId: visit.id }
    });

    console.log(`✅ Visit ${visitUid} created and linked to billing.`);
    console.log(`🚀 Daniel is now ready in the Doctor Queue!`);
}

createDaniel()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
