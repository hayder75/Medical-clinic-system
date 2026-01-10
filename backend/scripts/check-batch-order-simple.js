const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find a recent batch order
    const recentOrder = await prisma.batchOrder.findFirst({
      where: { type: 'RADIOLOGY' },
      include: {
        services: {
          include: {
            investigationType: {
              include: { service: { select: { code: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    if (recentOrder) {
      console.log('=== Recent Batch Order ===\n');
      console.log(`Batch Order ID: ${recentOrder.id}`);
      console.log(`Created: ${recentOrder.createdAt}`);
      console.log(`Services:`);
      
      for (const service of recentOrder.services) {
        console.log(`  - InvestigationType ID: ${service.investigationTypeId}`);
        console.log(`    Name: '${service.investigationType?.name}'`);
        console.log(`    Service Code: '${service.investigationType?.service?.code}'`);
        
        // Check template
        if (service.investigationTypeId) {
          const template = await prisma.radiologyTemplate.findUnique({
            where: { investigationTypeId: service.investigationTypeId }
          });
          
          if (template) {
            console.log(`    ✅ Template EXISTS (Findings: ${template.findingsTemplate?.length || 0} chars, Conclusion: ${template.conclusionTemplate?.length || 0} chars)`);
          } else {
            console.log(`    ❌ Template MISSING for ID ${service.investigationTypeId}`);
          }
        }
        console.log('');
      }
    } else {
      console.log('No recent radiology batch orders found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
