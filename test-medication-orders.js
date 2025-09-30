const { PrismaClient } = require('./backend/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function testMedicationOrders() {
  try {
    console.log('🔍 Checking medication orders...');
    
    const orders = await prisma.medicationOrder.findMany({
      where: {
        visitId: 49
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log(`Found ${orders.length} medication orders for visit 49:`);
    orders.forEach(order => {
      console.log(`- ID: ${order.id}, Name: ${order.name}, Status: ${order.status}, Patient: ${order.patient.name}`);
    });
    
    // Check pharmacy invoices
    console.log('\n🔍 Checking pharmacy invoices...');
    const invoices = await prisma.pharmacyInvoice.findMany({
      where: {
        visitId: 49
      },
      include: {
        items: true
      }
    });
    
    console.log(`Found ${invoices.length} pharmacy invoices for visit 49:`);
    invoices.forEach(invoice => {
      console.log(`- ID: ${invoice.id}, Status: ${invoice.status}, Items: ${invoice.items.length}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMedicationOrders();
