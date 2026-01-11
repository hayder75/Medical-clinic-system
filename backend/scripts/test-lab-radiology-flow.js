const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLabRadiologyFlow() {
  try {
    console.log('🔍 Testing Lab and Radiology Order Flow...\n');

    // 1. Check for UNPAID lab orders
    console.log('1️⃣ Checking UNPAID Lab Orders:');
    const unpaidLabOrders = await prisma.labOrder.findMany({
      where: { status: 'UNPAID' },
      include: {
        patient: { select: { id: true, name: true } },
        type: { select: { id: true, name: true, category: true } },
        visit: { select: { id: true, visitUid: true, status: true } }
      }
    });
    console.log(`   Found ${unpaidLabOrders.length} UNPAID lab orders`);
    unpaidLabOrders.forEach(order => {
      console.log(`   - Order ID: ${order.id}, Patient: ${order.patient.name}, Test: ${order.type.name}, Visit: ${order.visit?.visitUid || 'N/A'}`);
    });

    // 2. Check for QUEUED lab orders (should appear in lab queue)
    console.log('\n2️⃣ Checking QUEUED Lab Orders (should be in lab queue):');
    const queuedLabOrders = await prisma.labOrder.findMany({
      where: { status: 'QUEUED' },
      include: {
        patient: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        visit: { select: { id: true, visitUid: true } }
      }
    });
    console.log(`   Found ${queuedLabOrders.length} QUEUED lab orders`);
    queuedLabOrders.forEach(order => {
      console.log(`   - Order ID: ${order.id}, Patient: ${order.patient.name}, Test: ${order.type.name}`);
    });

    // 3. Check for UNPAID radiology orders
    console.log('\n3️⃣ Checking UNPAID Radiology Orders:');
    const unpaidRadiologyOrders = await prisma.radiologyOrder.findMany({
      where: { status: 'UNPAID' },
      include: {
        patient: { select: { id: true, name: true } },
        type: { select: { id: true, name: true, category: true } },
        visit: { select: { id: true, visitUid: true, status: true } }
      }
    });
    console.log(`   Found ${unpaidRadiologyOrders.length} UNPAID radiology orders`);
    unpaidRadiologyOrders.forEach(order => {
      console.log(`   - Order ID: ${order.id}, Patient: ${order.patient.name}, Test: ${order.type.name}, Visit: ${order.visit?.visitUid || 'N/A'}`);
    });

    // 4. Check for QUEUED radiology orders (should appear in radiology queue)
    console.log('\n4️⃣ Checking QUEUED Radiology Orders (should be in radiology queue):');
    const queuedRadiologyOrders = await prisma.radiologyOrder.findMany({
      where: { status: 'QUEUED' },
      include: {
        patient: { select: { id: true, name: true } },
        type: { select: { id: true, name: true } },
        visit: { select: { id: true, visitUid: true } }
      }
    });
    console.log(`   Found ${queuedRadiologyOrders.length} QUEUED radiology orders`);
    queuedRadiologyOrders.forEach(order => {
      console.log(`   - Order ID: ${order.id}, Patient: ${order.patient.name}, Test: ${order.type.name}`);
    });

    // 5. Check batch orders
    console.log('\n5️⃣ Checking Batch Orders:');
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        OR: [
          { type: 'LAB' },
          { type: 'RADIOLOGY' },
          { type: 'MIXED' }
        ]
      },
      include: {
        patient: { select: { id: true, name: true } },
        visit: { select: { id: true, visitUid: true, status: true } },
        services: {
          include: {
            service: { select: { id: true, name: true, category: true } },
            investigationType: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log(`   Found ${batchOrders.length} recent batch orders`);
    batchOrders.forEach(order => {
      console.log(`   - Batch ID: ${order.id}, Type: ${order.type}, Status: ${order.status}, Patient: ${order.patient.name}, Visit: ${order.visit?.visitUid || 'N/A'}`);
      console.log(`     Services: ${order.services.length}`);
    });

    // 6. Check billings with lab/radiology services
    console.log('\n6️⃣ Checking Billings with Lab/Radiology Services:');
    const diagnosticsBillings = await prisma.billing.findMany({
      where: {
        services: {
          some: {
            service: {
              category: {
                in: ['LAB', 'RADIOLOGY']
              }
            }
          }
        }
      },
      include: {
        patient: { select: { id: true, name: true } },
        visit: { select: { id: true, visitUid: true } },
        services: {
          include: {
            service: { select: { id: true, name: true, category: true } }
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log(`   Found ${diagnosticsBillings.length} recent diagnostics billings`);
    diagnosticsBillings.forEach(billing => {
      const labServices = billing.services.filter(s => s.service.category === 'LAB');
      const radiologyServices = billing.services.filter(s => s.service.category === 'RADIOLOGY');
      const isPaid = billing.status === 'PAID';
      console.log(`   - Billing ID: ${billing.id}, Status: ${billing.status}, Patient: ${billing.patient.name}`);
      console.log(`     Lab Services: ${labServices.length}, Radiology Services: ${radiologyServices.length}`);
      console.log(`     Visit: ${billing.visit?.visitUid || 'N/A'}, Paid: ${isPaid ? 'YES' : 'NO'}`);
    });

    // 7. Check if orders match billings
    console.log('\n7️⃣ Checking Order-Billing Linkage:');
    for (const billing of diagnosticsBillings.slice(0, 5)) {
      if (!billing.visit) continue;
      
      const relatedLabOrders = await prisma.labOrder.findMany({
        where: {
          visitId: billing.visit.id,
          status: { in: ['UNPAID', 'QUEUED', 'PAID'] }
        }
      });
      
      const relatedRadiologyOrders = await prisma.radiologyOrder.findMany({
        where: {
          visitId: billing.visit.id,
          status: { in: ['UNPAID', 'QUEUED', 'PAID'] }
        }
      });
      
      console.log(`   Billing ${billing.id} (${billing.status}):`);
      console.log(`     - Lab Orders: ${relatedLabOrders.length} (UNPAID: ${relatedLabOrders.filter(o => o.status === 'UNPAID').length}, QUEUED: ${relatedLabOrders.filter(o => o.status === 'QUEUED').length})`);
      console.log(`     - Radiology Orders: ${relatedRadiologyOrders.length} (UNPAID: ${relatedRadiologyOrders.filter(o => o.status === 'UNPAID').length}, QUEUED: ${relatedRadiologyOrders.filter(o => o.status === 'QUEUED').length})`);
      
      if (billing.status === 'PAID') {
        const unpaidLab = relatedLabOrders.filter(o => o.status === 'UNPAID').length;
        const unpaidRad = relatedRadiologyOrders.filter(o => o.status === 'UNPAID').length;
        if (unpaidLab > 0 || unpaidRad > 0) {
          console.log(`     ⚠️  WARNING: Billing is PAID but orders are still UNPAID!`);
        }
      }
    }

    console.log('\n✅ Flow check completed!\n');
    console.log('📋 Summary:');
    console.log(`   - UNPAID Lab Orders: ${unpaidLabOrders.length}`);
    console.log(`   - QUEUED Lab Orders: ${queuedLabOrders.length} (should appear in lab queue)`);
    console.log(`   - UNPAID Radiology Orders: ${unpaidRadiologyOrders.length}`);
    console.log(`   - QUEUED Radiology Orders: ${queuedRadiologyOrders.length} (should appear in radiology queue)`);
    console.log(`   - Batch Orders: ${batchOrders.length}`);
    console.log(`   - Diagnostics Billings: ${diagnosticsBillings.length}`);

  } catch (error) {
    console.error('❌ Error testing flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLabRadiologyFlow();

