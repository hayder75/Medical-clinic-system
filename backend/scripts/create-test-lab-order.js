const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createTestLabOrder() {
  try {
    console.log('🔬 Creating Test Lab Order...\n');

    // 1. Get or create a test patient
    let patient = await prisma.patient.findFirst({
      where: { type: 'REGULAR' },
      orderBy: { createdAt: 'desc' }
    });

    if (!patient) {
      console.log('   Creating test patient...');
      patient = await prisma.patient.create({
        data: {
          id: `PAT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          name: 'Test Patient',
          type: 'REGULAR',
          gender: 'MALE',
          mobile: '0912345678'
        }
      });
      console.log(`   ✅ Created patient: ${patient.id} - ${patient.name}`);
    } else {
      console.log(`   ✅ Using existing patient: ${patient.id} - ${patient.name}`);
    }

    // 2. Get or create a doctor
    let doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR', isActive: true }
    });

    if (!doctor) {
      console.log('   Creating test doctor...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      doctor = await prisma.user.create({
        data: {
          fullname: 'Test Doctor',
          username: 'testdoctor',
          password: hashedPassword,
          email: 'testdoctor@test.com',
          role: 'DOCTOR',
          specialties: ['General']
        }
      });
      console.log(`   ✅ Created doctor: ${doctor.fullname}`);
    } else {
      console.log(`   ✅ Using existing doctor: ${doctor.fullname}`);
    }

    // 3. Create a visit for the patient
    console.log('   Creating visit...');
    const visitUid = `VISIT-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const visit = await prisma.visit.create({
      data: {
        visitUid: visitUid,
        patientId: patient.id,
        createdById: doctor.id,
        date: new Date(),
        status: 'WAITING_FOR_DOCTOR',
        queueType: 'CONSULTATION',
        isEmergency: false
      }
    });
    console.log(`   ✅ Created visit: ${visit.visitUid}`);

    // 4. Find lab services/investigation types
    const labServices = await prisma.service.findMany({
      where: { category: 'LAB', isActive: true },
      take: 3
    });

    if (labServices.length === 0) {
      console.log('   ⚠️  No lab services found. Creating a test lab service...');
      const labService = await prisma.service.create({
        data: {
          code: 'LAB-CBC-001',
          name: 'Complete Blood Count (CBC)',
          category: 'LAB',
          price: 150.00,
          description: 'Complete blood count test'
        }
      });
      labServices.push(labService);
      console.log(`   ✅ Created lab service: ${labService.name}`);
    }

    console.log(`   ✅ Found ${labServices.length} lab service(s)`);

    // 5. Get investigation types for the services
    const investigationTypes = await prisma.investigationType.findMany({
      where: {
        serviceId: { in: labServices.map(s => s.id) },
        category: 'LAB'
      }
    });

    // 6. Create batch order
    console.log('   Creating batch order...');
    const batchOrder = await prisma.batchOrder.create({
      data: {
        patientId: patient.id,
        visitId: visit.id,
        doctorId: doctor.id,
        type: 'LAB',
        status: 'PAID',
        instructions: 'Test lab order - Please process as soon as possible',
        services: {
          create: labServices.map(service => {
            const investigationType = investigationTypes.find(it => it.serviceId === service.id);
            return {
              serviceId: service.id,
              investigationTypeId: investigationType?.id,
              status: 'QUEUED',
              instructions: `Test order for ${service.name}`
            };
          })
        }
      },
      include: {
        services: {
          include: {
            service: true,
            investigationType: true
          }
        },
        patient: true,
        visit: true,
        doctor: true
      }
    });

    console.log(`   ✅ Created batch order: ${batchOrder.id}`);
    console.log(`      Patient: ${batchOrder.patient.name} (${batchOrder.patient.id})`);
    console.log(`      Visit: ${batchOrder.visit.visitUid}`);
    console.log(`      Doctor: ${batchOrder.doctor.fullname}`);
    console.log(`      Services: ${batchOrder.services.length}`);
    batchOrder.services.forEach((service, index) => {
      console.log(`        ${index + 1}. ${service.service.name} - Status: ${service.status}`);
    });

    console.log('\n✅ Test lab order created successfully!');
    console.log(`\n📋 Order Details:`);
    console.log(`   Batch Order ID: ${batchOrder.id}`);
    console.log(`   Patient: ${batchOrder.patient.name} (${batchOrder.patient.id})`);
    console.log(`   Visit: ${batchOrder.visit.visitUid}`);
    console.log(`   Status: ${batchOrder.status}`);
    console.log(`   Instructions: ${batchOrder.instructions}`);
    console.log(`   Services: ${batchOrder.services.length}`);
    console.log(`\n🔍 You can now check this order in the Lab Dashboard!`);

    return batchOrder;

  } catch (error) {
    console.error('❌ Error creating test lab order:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestLabOrder()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
