const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function createTestLabOrders() {
  try {
    console.log('🧪 Creating test lab orders...');

    // Get a doctor user
    const doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR' }
    });

    if (!doctor) {
      console.log('❌ No doctor found. Please create a doctor user first.');
      return;
    }

    // Get a patient
    const patient = await prisma.patient.findFirst();
    if (!patient) {
      console.log('❌ No patient found. Please create a patient first.');
      return;
    }

    // Get lab services
    const labServices = await prisma.service.findMany({
      where: { category: 'LAB' },
      take: 3
    });

    if (labServices.length === 0) {
      console.log('❌ No lab services found. Please run the lab services seeding script first.');
      return;
    }

    console.log(`✅ Found ${labServices.length} lab services`);

    // Create a visit
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        visitUid: `V${Date.now()}`,
        status: 'UNDER_DOCTOR_REVIEW',
        createdAt: new Date()
      }
    });

    console.log(`✅ Created visit: ${visit.visitUid}`);

    // Create batch order for lab tests
    const batchOrder = await prisma.batchOrder.create({
      data: {
        visitId: visit.id,
        patientId: patient.id,
        doctorId: doctor.id,
        type: 'LAB',
        status: 'PAID', // Mark as paid so it shows up in lab orders
        instructions: 'Test lab orders for demonstration',
        services: {
          create: labServices.map(service => ({
            serviceId: service.id,
            status: 'QUEUED',
            instructions: `Test order for ${service.name}`
          }))
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        },
        patient: true,
        doctor: true,
        visit: true
      }
    });

    console.log(`✅ Created batch order #${batchOrder.id} with ${batchOrder.services.length} lab services`);
    console.log('📋 Lab Services:');
    batchOrder.services.forEach(service => {
      console.log(`   - ${service.service.name} (${service.service.price} ETB)`);
    });

    // Create billing for the lab tests
    const totalAmount = labServices.reduce((sum, service) => sum + service.price, 0);
    
    const billing = await prisma.billing.create({
      data: {
        visitId: visit.id,
        patientId: patient.id,
        totalAmount: totalAmount,
        status: 'PAID',
        notes: 'Lab tests billing',
        services: {
          create: labServices.map(service => ({
            serviceId: service.id,
            quantity: 1,
            unitPrice: service.price,
            totalPrice: service.price
          }))
        }
      }
    });

            // Create payment separately
            await prisma.billPayment.create({
              data: {
                billingId: billing.id,
                patientId: patient.id,
                amount: totalAmount,
                type: 'CASH',
                notes: 'Payment for lab tests'
              }
            });

    console.log(`✅ Created billing #${billing.id} for ${totalAmount} ETB`);

    console.log('🎉 Test lab orders created successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • Patient: ${patient.name}`);
    console.log(`   • Doctor: ${doctor.fullname}`);
    console.log(`   • Visit: ${visit.visitUid}`);
    console.log(`   • Batch Order: #${batchOrder.id}`);
    console.log(`   • Lab Services: ${batchOrder.services.length}`);
    console.log(`   • Total Amount: ${totalAmount} ETB`);
    console.log(`   • Status: PAID (ready for lab processing)`);
    console.log('');
    console.log('🔬 You can now login as lab technician and see these orders!');

  } catch (error) {
    console.error('❌ Error creating test lab orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestLabOrders()
  .then(() => {
    console.log('✅ Test lab orders setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test lab orders setup failed:', error);
    process.exit(1);
  });
