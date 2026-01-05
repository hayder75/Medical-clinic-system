const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('Clearing all patient data...');
    
    // Delete in the correct order to respect foreign key constraints
    await prisma.billPayment.deleteMany();
    console.log('✓ Cleared bill payments');
    
    await prisma.billingService.deleteMany();
    console.log('✓ Cleared billing services');
    
    await prisma.billing.deleteMany();
    console.log('✓ Cleared billings');
    
    await prisma.pharmacyInvoice.deleteMany();
    console.log('✓ Cleared pharmacy invoices');
    
    await prisma.batchOrderService.deleteMany();
    console.log('✓ Cleared batch order services');
    
    await prisma.batchOrder.deleteMany();
    console.log('✓ Cleared batch orders');
    
    await prisma.file.deleteMany();
    console.log('✓ Cleared files');
    
    await prisma.medicationOrder.deleteMany();
    console.log('✓ Cleared medication orders');
    
    await prisma.labOrder.deleteMany();
    console.log('✓ Cleared lab orders');
    
    await prisma.radiologyOrder.deleteMany();
    console.log('✓ Cleared radiology orders');
    
    await prisma.vitalSign.deleteMany();
    console.log('✓ Cleared vital signs');
    
    await prisma.assignment.deleteMany();
    console.log('✓ Cleared assignments');
    
    await prisma.visit.deleteMany();
    console.log('✓ Cleared visits');
    
    await prisma.patient.deleteMany();
    console.log('✓ Cleared patients');
    
    console.log('\n🎉 All patient data has been cleared successfully!');
    console.log('The database is now clean and ready for testing the complete workflow.');
    
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
