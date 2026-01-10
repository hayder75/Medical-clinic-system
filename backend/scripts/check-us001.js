const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find US001 service
    const us001Service = await prisma.service.findFirst({
      where: { code: 'US001' },
      include: {
        investigationTypes: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!us001Service) {
      console.log('❌ US001 service not found');
      process.exit(1);
    }
    
    console.log('=== US001 Service Check ===\n');
    console.log(`Service Code: ${us001Service.code}`);
    console.log(`Service Name: ${us001Service.name}`);
    console.log(`InvestigationTypes linked:`);
    
    us001Service.investigationTypes.forEach(it => {
      console.log(`  - ID: ${it.id}, Name: '${it.name}'`);
      
      // Check template
      prisma.radiologyTemplate.findUnique({
        where: { investigationTypeId: it.id }
      }).then(template => {
        if (template) {
          console.log(`    ✅ Has Template (Findings: ${template.findingsTemplate?.length || 0} chars, Conclusion: ${template.conclusionTemplate?.length || 0} chars)`);
        } else {
          console.log(`    ❌ NO Template`);
        }
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
