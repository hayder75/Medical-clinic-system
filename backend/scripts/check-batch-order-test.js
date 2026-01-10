const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find a recent batch order with US001
    const recentOrder = await prisma.batchOrder.findFirst({
      where: {
        type: 'RADIOLOGY',
        services: {
          some: {
            investigationType: {
              service: { code: 'US001' }
            }
          }
        }
      },
      include: {
        services: {
          include: {
            investigationType: {
              select: { id: true, name: true },
              include: { service: { select: { code: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (recentOrder) {
      console.log('=== Recent Batch Order with US001 ===\n');
      console.log(`Batch Order ID: ${recentOrder.id}`);
      console.log(`Services:`);
      
      for (const service of recentOrder.services) {
        console.log(`  Service: ${service.serviceId}`);
        console.log(`  InvestigationType ID: ${service.investigationTypeId}`);
        console.log(`  InvestigationType Name: '${service.investigationType?.name}'`);
        console.log(`  Service Code: '${service.investigationType?.service?.code}'`);
        
        // Check template
        if (service.investigationTypeId) {
          const template = await prisma.radiologyTemplate.findUnique({
            where: { investigationTypeId: service.investigationTypeId }
          });
          
          if (template) {
            console.log(`  ✅ Template EXISTS (Findings: ${template.findingsTemplate?.length || 0} chars)`);
          } else {
            console.log(`  ❌ Template MISSING for ID ${service.investigationTypeId}`);
          }
        }
        console.log('');
      }
    } else {
      console.log('No recent batch orders with US001 found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
