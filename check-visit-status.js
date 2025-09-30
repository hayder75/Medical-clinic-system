const { PrismaClient } = require('./backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function checkVisitStatus() {
  try {
    console.log('🔍 Checking visit status for patient hayder...\n');
    
    // Find patient hayder's visit
    const patient = await prisma.patient.findFirst({
      where: { name: 'hayder' },
      include: {
        visits: {
          include: {
            batchOrders: true
          }
        }
      }
    });

    if (!patient) {
      console.log('❌ Patient hayder not found');
      return;
    }

    const visit = patient.visits[0];
    console.log(`📋 Visit ${visit.id} (${visit.visitUid}):`);
    console.log(`   Status: ${visit.status}`);
    console.log(`   Queue Type: ${visit.queueType}`);
    console.log(`   Batch Orders: ${visit.batchOrders.length}`);
    
    // Check batch order statuses
    visit.batchOrders.forEach((order, index) => {
      console.log(`     ${index + 1}. ${order.type} - ${order.status}`);
    });
    
    // Check what the results queue query should return
    console.log('\n🔍 Checking results queue query...');
    const resultsQueue = await prisma.visit.findMany({
      where: {
        status: 'AWAITING_RESULTS_REVIEW',
        queueType: 'RESULTS_REVIEW',
        assignmentId: {
          not: null
        }
      },
      include: {
        patient: true,
        assignment: true
      }
    });
    
    console.log(`📊 Results queue count: ${resultsQueue.length}`);
    resultsQueue.forEach((visit, index) => {
      console.log(`   ${index + 1}. ${visit.patient.name} (${visit.visitUid}) - ${visit.status}`);
      console.log(`      Assignment ID: ${visit.assignmentId}`);
    });
    
    // Check if hayder's visit has an assignment
    console.log(`\n🎯 Hayder's visit assignment ID: ${visit.assignmentId}`);
    
    if (visit.assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: visit.assignmentId },
        include: { doctor: true }
      });
      
      if (assignment) {
        console.log(`   Doctor: ${assignment.doctor.fullname}`);
        console.log(`   Status: ${assignment.status}`);
      } else {
        console.log('   ❌ Assignment not found');
      }
    } else {
      console.log('   ❌ No assignment ID');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVisitStatus();
