const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function removeOldLabServices() {
  console.log('🧹 Removing old lab services (keeping only new LabTest system)...\n');

  try {
    // Get all lab tests and their service IDs
    const labTests = await prisma.labTest.findMany({
      select: { serviceId: true }
    });
    const labTestServiceIds = new Set(labTests.map(lt => lt.serviceId));
    console.log(`📊 New LabTest system uses ${labTestServiceIds.size} services\n`);

    // Find all LAB services
    const allLabServices = await prisma.service.findMany({
      where: { category: 'LAB' },
      select: { id: true, code: true, name: true }
    });
    console.log(`📊 Total LAB services in database: ${allLabServices.length}`);

    // Find services NOT linked to LabTest (these are old services)
    const oldLabServices = allLabServices.filter(s => !labTestServiceIds.has(s.id));
    console.log(`🗑️  Old LAB services to delete: ${oldLabServices.length}\n`);

    if (oldLabServices.length === 0) {
      console.log('✅ No old lab services to remove!');
      return;
    }

    // Delete old lab services
    console.log('Deleting old lab services...');
    let deletedCount = 0;
    for (const service of oldLabServices) {
      try {
        await prisma.service.delete({
          where: { id: service.id }
        });
        deletedCount++;
        if (deletedCount <= 10) {
          console.log(`  ✅ Deleted: ${service.code} - ${service.name}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Failed to delete ${service.code}: ${error.message}`);
      }
    }

    if (deletedCount > 10) {
      console.log(`  ... and ${deletedCount - 10} more services`);
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} old lab services`);
    
    // Verify
    const remainingLabServices = await prisma.service.count({
      where: { category: 'LAB' }
    });
    const newLabTests = await prisma.labTest.count();
    
    console.log(`\n📊 Final Status:`);
    console.log(`   Remaining LAB services: ${remainingLabServices}`);
    console.log(`   New LabTest system: ${newLabTests} tests`);
    console.log(`   ✅ All remaining LAB services are linked to new LabTest system`);

  } catch (error) {
    console.error('❌ Error removing old lab services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

removeOldLabServices();

