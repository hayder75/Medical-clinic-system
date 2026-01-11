const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to check if all lab orders are completed and update visit status
async function checkAndUpdateVisitStatus(visitId) {
  if (!visitId) return false;

  try {
    // Check for active lab test orders (new system)
    const activeLabTestOrders = await prisma.labTestOrder.count({
      where: {
        visitId: visitId,
        status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
      }
    });

    // Check for active old system lab orders
    const activeOldLabOrders = await prisma.labOrder.count({
      where: {
        visitId: visitId,
        status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
      }
    });

    // Check for active batch orders (old system)
    // Only count batch orders that have services OR don't have corresponding labTestOrders
    const batchOrders = await prisma.batchOrder.findMany({
      where: {
        visitId: visitId,
        type: { in: ['LAB', 'MIXED'] },
        status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
      },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });

    // Check if batch orders have corresponding labTestOrders (new system)
    const batchOrderIds = batchOrders.map(bo => bo.id);
    const labTestOrdersWithBatchIds = await prisma.labTestOrder.count({
      where: {
        visitId: visitId,
        batchOrderId: { in: batchOrderIds }
      }
    });

    // Active batch orders are those that:
    // 1. Have services, OR
    // 2. Don't have corresponding labTestOrders (new system hasn't replaced them)
    const activeBatchOrders = batchOrders.filter(bo => {
      const hasServices = bo._count.services > 0;
      const hasLabTestOrders = batchOrderIds.includes(bo.id) && labTestOrdersWithBatchIds > 0;
      // If it has services, it's active. If it has no services but also has labTestOrders, it's replaced (not active)
      return hasServices || !hasLabTestOrders;
    }).length;

    const hasActiveLabOrders = activeLabTestOrders > 0 || activeOldLabOrders > 0 || activeBatchOrders > 0;

    if (!hasActiveLabOrders) {
      // All lab orders are completed, check visit status and update if needed
      const visit = await prisma.visit.findUnique({
        where: { id: visitId },
        select: { status: true }
      });

      if (visit && ['SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'].includes(visit.status)) {
        // Check if there are any pending radiology orders
        const pendingRadiologyOrders = await prisma.radiologyOrder.count({
          where: {
            visitId: visitId,
            status: { in: ['PAID', 'QUEUED', 'IN_PROGRESS'] }
          }
        });

        if (pendingRadiologyOrders === 0) {
          // No pending radiology orders, return to doctor queue
          await prisma.visit.update({
            where: { id: visitId },
            data: { status: 'IN_DOCTOR_QUEUE' }
          });
          console.log(`✅ Updated visit ${visitId} status to IN_DOCTOR_QUEUE (all lab orders completed)`);
          return true;
        } else if (visit.status === 'SENT_TO_LAB') {
          // There are radiology orders pending, update to SENT_TO_BOTH
          await prisma.visit.update({
            where: { id: visitId },
            data: { status: 'SENT_TO_BOTH' }
          });
          console.log(`✅ Updated visit ${visitId} status to SENT_TO_BOTH (lab completed, radiology pending)`);
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.error(`Error checking/updating visit status for visit ${visitId}:`, error);
    return false;
  }
}

async function fixAllVisitStatuses() {
  try {
    console.log('🔧 Fixing visit statuses for all visits with completed lab orders...\n');

    // Find all visits that are in SENT_TO_LAB, SENT_TO_RADIOLOGY, or SENT_TO_BOTH status
    const visits = await prisma.visit.findMany({
      where: {
        status: { in: ['SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH'] }
      },
      select: { id: true, status: true, visitUid: true }
    });

    console.log(`Found ${visits.length} visits to check\n`);

    let updated = 0;
    for (const visit of visits) {
      const wasUpdated = await checkAndUpdateVisitStatus(visit.id);
      if (wasUpdated) {
        updated++;
      }
    }

    console.log(`\n✅ Fixed ${updated} visit status(es)!`);

  } catch (error) {
    console.error('❌ Error fixing visit statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixAllVisitStatuses();
}

module.exports = { checkAndUpdateVisitStatus, fixAllVisitStatuses };

