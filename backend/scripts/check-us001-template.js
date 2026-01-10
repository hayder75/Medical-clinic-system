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
    
    console.log('=== US001 Service and Template Check ===\n');
    console.log(`Service Code: ${us001Service.code}`);
    console.log(`Service Name: ${us001Service.name}`);
    console.log(`Linked InvestigationTypes:`);
    
    for (const it of us001Service.investigationTypes) {
      console.log(`  - ID: ${it.id}, Name: '${it.name}'`);
      
      // Check template
      const template = await prisma.radiologyTemplate.findUnique({
        where: { investigationTypeId: it.id }
      });
      
      if (template) {
        console.log(`    ✅ Template EXISTS`);
        console.log(`      Findings: ${template.findingsTemplate ? template.findingsTemplate.length + ' chars' : 'MISSING'}`);
        console.log(`      Conclusion: ${template.conclusionTemplate ? template.conclusionTemplate.length + ' chars' : 'MISSING'}`);
      } else {
        console.log(`    ❌ Template MISSING for ID ${it.id}`);
        console.log(`    Need to create template for 'Ultrasound - Abdomen' (ID: ${it.id})`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
