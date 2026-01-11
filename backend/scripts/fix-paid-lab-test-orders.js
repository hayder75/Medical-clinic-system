const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Fix LabTestOrder status for already-paid billings
 * This script updates LabTestOrder status from UNPAID to PAID
 * for orders where the associated billing is already PAID
 */
async function fixPaidLabTestOrders() {
  try {
    console.log('🔧 Fixing LabTestOrder status for already-paid billings...\n');

    // Find all PAID billings that have lab services
    const paidBillings = await prisma.billing.findMany({
      where: {
        status: 'PAID',
        services: {
          some: {
            service: {
              category: 'LAB'
            }
          }
        }
      },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    console.log(`Found ${paidBillings.length} paid billings with lab services\n`);

    let totalUpdated = 0;

    for (const billing of paidBillings) {
      const hasLabServices = billing.services.some(service => 
        service.service.category === 'LAB'
      );

      if (!hasLabServices) continue;

      // Update walk-in lab test orders (no visitId, use billingId)
      if (!billing.visitId) {
        const walkInUpdated = await prisma.labTestOrder.updateMany({
          where: {
            billingId: billing.id,
            isWalkIn: true,
            status: 'UNPAID'
          },
          data: { status: 'PAID' }
        });

        if (walkInUpdated.count > 0) {
          console.log(`✅ Billing ${billing.id}: Updated ${walkInUpdated.count} walk-in lab test orders`);
          totalUpdated += walkInUpdated.count;
        }
      } else {
        // Update doctor-ordered lab test orders (has visitId)
        // First check if there are orders
        const ordersCount = await prisma.labTestOrder.count({
          where: {
            visitId: billing.visitId
          }
        });
        
        if (ordersCount > 0) {
          const doctorUpdated = await prisma.labTestOrder.updateMany({
            where: {
              visitId: billing.visitId,
              status: 'UNPAID'
            },
            data: { status: 'PAID' }
          });

          if (doctorUpdated.count > 0) {
            console.log(`✅ Billing ${billing.id} (Visit ${billing.visitId}): Updated ${doctorUpdated.count} lab test orders to PAID`);
            totalUpdated += doctorUpdated.count;
          } else {
            // Check if orders already have different status
            const existingOrders = await prisma.labTestOrder.findMany({
              where: {
                visitId: billing.visitId
              },
              select: { id: true, status: true },
              take: 3
            });
            if (existingOrders.length > 0) {
              console.log(`ℹ️  Billing ${billing.id} (Visit ${billing.visitId}): Found ${ordersCount} orders but none were UNPAID. Sample statuses:`, existingOrders.map(o => o.status));
            }
          }
        } else {
          console.log(`ℹ️  Billing ${billing.id} (Visit ${billing.visitId}): No LabTestOrders found for this visit`);
        }
      }
    }

    console.log(`\n✅ Total LabTestOrders updated: ${totalUpdated}`);
    console.log('\n🎉 Fix complete! All paid lab test orders should now be visible in lab orders page.');

  } catch (error) {
    console.error('❌ Error fixing lab test orders:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixPaidLabTestOrders()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

