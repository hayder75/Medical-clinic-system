const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function activateNewLabServices() {
  try {
    console.log('🔧 Activating new lab services...');

    // Get the new lab services (the ones we created)
    const newLabServiceCodes = ['HEM001', 'URI002', 'STOOL006', 'CHEM003', 'SERO004', 'BACT005'];

    console.log('📋 Activating new lab services:');
    for (const code of newLabServiceCodes) {
      const service = await prisma.service.findUnique({
        where: { code }
      });

      if (service) {
        await prisma.service.update({
          where: { id: service.id },
          data: { isActive: true }
        });
        console.log(`✅ Activated: ${service.name} (${code}) - ETB ${service.price}`);
      } else {
        console.log(`❌ Service not found: ${code}`);
      }
    }

    // Verify active lab services
    console.log('\n📊 Active lab services:');
    const activeServices = await prisma.service.findMany({
      where: { 
        category: 'LAB',
        isActive: true 
      },
      orderBy: { name: 'asc' }
    });

    activeServices.forEach(service => {
      console.log(`   • ${service.name} (${service.code}) - ETB ${service.price}`);
    });

    console.log(`\n🎉 Successfully activated ${activeServices.length} lab services!`);

  } catch (error) {
    console.error('❌ Error activating lab services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateNewLabServices();
