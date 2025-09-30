const { PrismaClient } = require('./backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function updateOrders() {
  try {
    console.log('🔍 Updating medication orders to QUEUED...');
    
    const result = await prisma.medicationOrder.updateMany({
      where: {
        visitId: 49,
        status: 'UNPAID'
      },
      data: { status: 'QUEUED' }
    });
    
    console.log(`Updated ${result.count} medication orders to QUEUED status`);
    
    // Check the updated orders
    const orders = await prisma.medicationOrder.findMany({
      where: { visitId: 49 },
      select: { id: true, name: true, status: true }
    });
    
    console.log('\nCurrent medication orders:');
    orders.forEach(order => {
      console.log(`- ID: ${order.id}, Name: ${order.name}, Status: ${order.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateOrders();
