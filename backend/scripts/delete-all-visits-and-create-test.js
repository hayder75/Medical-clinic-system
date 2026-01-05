const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🗑️  Starting cleanup and test setup...\n');

    // Step 1: Delete all visits and related data (in correct order to respect foreign keys)
    console.log('1️⃣  Deleting all visits and related data...');
    
    // Delete in order: files/attachments first, then results, orders, bills, then visits
    await prisma.radiologyResultFile.deleteMany({});
    console.log('   ✅ Deleted radiology result files');
    
    await prisma.labResultFile.deleteMany({});
    console.log('   ✅ Deleted lab result files');
    
    await prisma.detailedLabResult.deleteMany({});
    console.log('   ✅ Deleted detailed lab results');
    
    await prisma.labResult.deleteMany({});
    console.log('   ✅ Deleted lab results');
    
    await prisma.radiologyResult.deleteMany({});
    console.log('   ✅ Deleted radiology results');
    
    await prisma.batchOrderService.deleteMany({});
    console.log('   ✅ Deleted batch order services');
    
    await prisma.batchOrder.deleteMany({});
    console.log('   ✅ Deleted batch orders');
    
    await prisma.labOrder.deleteMany({});
    console.log('   ✅ Deleted lab orders');
    
    await prisma.radiologyOrder.deleteMany({});
    console.log('   ✅ Deleted radiology orders');
    
    await prisma.medicationOrder.deleteMany({});
    console.log('   ✅ Deleted medication orders');
    
    await prisma.billPayment.deleteMany({});
    console.log('   ✅ Deleted bill payments');
    
    await prisma.billingService.deleteMany({});
    console.log('   ✅ Deleted billing services');
    
    await prisma.billing.deleteMany({});
    console.log('   ✅ Deleted bills');
    
    await prisma.vitalSign.deleteMany({});
    console.log('   ✅ Deleted vital signs');
    
    await prisma.assignment.deleteMany({});
    console.log('   ✅ Deleted assignments');
    
    await prisma.visit.deleteMany({});
    console.log('   ✅ Deleted all visits\n');

    // Step 2: Find or create a test patient
    console.log('2️⃣  Setting up test patient...');
    let testPatient = await prisma.patient.findFirst({
      where: {
        name: { contains: 'Test Patient', mode: 'insensitive' }
      }
    });

    if (!testPatient) {
      // Generate a patient ID in the format PAT-YYYY-MM-DD-XXXX
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const patientId = `PAT-${dateStr}-${randomNum}`;
      
      testPatient = await prisma.patient.create({
        data: {
          id: patientId,
          name: 'Test Patient',
          type: 'REGULAR',
          mobile: '0912345678',
          gender: 'MALE',
          dob: new Date('1990-01-01'),
          bloodType: 'O_PLUS' // Use enum value
        }
      });
      console.log('   ✅ Created test patient:', testPatient.id);
    } else {
      console.log('   ✅ Using existing test patient:', testPatient.id);
    }

    // Step 3: Find consultation service
    console.log('\n3️⃣  Finding consultation service...');
    const consultationService = await prisma.service.findFirst({
      where: {
        category: 'CONSULTATION',
        isActive: true
      }
    });

    if (!consultationService) {
      throw new Error('No consultation service found! Please seed the database first.');
    }
    console.log('   ✅ Found consultation service:', consultationService.name);

    // Step 4: Create visit
    console.log('\n4️⃣  Creating test visit...');
    // Generate visitUid in format VISIT-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    // Get count of visits today to generate unique number
    const todaysVisits = await prisma.visit.count({
      where: {
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }
    });
    const visitNumber = String(todaysVisits + 1).padStart(4, '0');
    const visitUid = `VISIT-${dateStr}-${visitNumber}`;
    
    const visit = await prisma.visit.create({
      data: {
        visitUid: visitUid,
        patientId: testPatient.id,
        status: 'WAITING_FOR_TRIAGE',
        isEmergency: false
      }
    });
    console.log('   ✅ Created visit:', visit.id, 'visitUid:', visit.visitUid);

    // Step 5: Create bill with consultation service
    console.log('\n5️⃣  Creating bill with consultation service...');
    const bill = await prisma.billing.create({
      data: {
        visitId: visit.id,
        patientId: testPatient.id,
        status: 'PENDING', // Use PENDING instead of UNPAID
        totalAmount: consultationService.price || 100,
        services: {
          create: {
            serviceId: consultationService.id,
            quantity: 1,
            unitPrice: consultationService.price || 100,
            totalPrice: consultationService.price || 100
          }
        }
      }
    });
    console.log('   ✅ Created bill:', bill.id);

    // Step 6: Pay the bill
    console.log('\n6️⃣  Paying the bill...');
    const payment = await prisma.billPayment.create({
      data: {
        billingId: bill.id,
        patientId: testPatient.id,
        amount: bill.totalAmount,
        type: 'CASH'
      }
    });

    await prisma.billing.update({
      where: { id: bill.id },
      data: { status: 'PAID' }
    });
    console.log('   ✅ Bill paid:', payment.id);

    // Step 7: Record vitals (nurse triage)
    console.log('\n7️⃣  Recording vitals (nurse triage)...');
    const vital = await prisma.vitalSign.create({
      data: {
        visitId: visit.id,
        patientId: testPatient.id,
        bloodPressure: '120/80',
        temperature: 36.5,
        heartRate: 72,
        respirationRate: 16, // Fixed: use respirationRate not respiratoryRate
        oxygenSaturation: 98,
        weight: 70,
        height: 170
        // triagePriority is optional, skip it for now
      }
    });
    console.log('   ✅ Vitals recorded:', vital.id);

    // Step 8: Find a doctor (or use the first available)
    console.log('\n8️⃣  Finding doctor...');
    const doctor = await prisma.user.findFirst({
      where: {
        role: 'DOCTOR',
        isActive: true
      }
    });

    if (!doctor) {
      throw new Error('No doctor found! Please create a doctor user first.');
    }
    console.log('   ✅ Found doctor:', doctor.fullname || doctor.name);

    // Step 9: Assign doctor
    console.log('\n9️⃣  Assigning doctor...');
    const assignment = await prisma.assignment.create({
      data: {
        patientId: testPatient.id,
        doctorId: doctor.id,
        status: 'Active'
      }
    });

    await prisma.visit.update({
      where: { id: visit.id },
      data: {
        assignmentId: assignment.id,
        status: 'WAITING_FOR_DOCTOR'
      }
    });
    console.log('   ✅ Doctor assigned, visit status: WAITING_FOR_DOCTOR');
    console.log('   ✅ Assignment ID:', assignment.id);

    console.log('\n✅ Test setup complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Patient: ${testPatient.name} (${testPatient.id})`);
    console.log(`   - Visit: ${visit.id} (Status: WAITING_FOR_DOCTOR)`);
    console.log(`   - Bill: ${bill.id} (Status: PAID)`);
    console.log(`   - Doctor: ${doctor.fullname || doctor.name} (${doctor.id})`);
    console.log(`   - Assignment: ${assignment.id}`);
    console.log('\n🔍 This visit should appear in the MAIN queue, NOT in the sent queue.');
    console.log('   Test by checking the doctor dashboard queue.');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();

