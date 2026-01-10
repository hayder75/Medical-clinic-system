const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== Checking Abdominal Ultrasound Issue ===\n');
    
    // 1. Check all radiology investigation types with codes
    const allTypes = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      select: { id: true, name: true },
      include: { service: { select: { code: true } } },
      orderBy: { name: 'asc' }
    });
    
    console.log('1. All Radiology InvestigationTypes:');
    allTypes.forEach(t => {
      const serviceCode = t.service?.code || 'NO CODE';
      const isAbdominal = t.name.toLowerCase().includes('abdominal') || t.name.toLowerCase().includes('abdomen');
      console.log(`   ${isAbdominal ? '>>>' : '   '} ID: ${t.id}, Name: '${t.name}', Code: '${serviceCode}'`);
    });
    
    // 2. Find US001 code
    const us001Type = await prisma.investigationType.findFirst({
      where: {
        service: { code: 'US001' },
        category: 'RADIOLOGY'
      },
      include: { service: { select: { code: true, id: true } } }
    });
    
    if (us001Type) {
      console.log(`\n2. Found US001 InvestigationType:`);
      console.log(`   ID: ${us001Type.id}`);
      console.log(`   Name: '${us001Type.name}'`);
      console.log(`   Service Code: '${us001Type.service.code}'`);
      
      // Check if template exists for this ID
      const template = await prisma.radiologyTemplate.findUnique({
        where: { investigationTypeId: us001Type.id }
      });
      
      if (template) {
        console.log(`\n✅ Template EXISTS for US001 (ID: ${us001Type.id})`);
        console.log(`   Findings: ${template.findingsTemplate ? template.findingsTemplate.length + ' chars' : 'MISSING'}`);
        console.log(`   Conclusion: ${template.conclusionTemplate ? template.conclusionTemplate.length + ' chars' : 'MISSING'}`);
      } else {
        console.log(`\n❌ Template MISSING for US001 (ID: ${us001Type.id})`);
        console.log(`   Need to create template for this investigation type`);
      }
    } else {
      console.log(`\n❌ US001 InvestigationType NOT FOUND`);
    }
    
    // 3. Check Ultrasound - Abdomen (ID 28) template
    const abdomenType = await prisma.investigationType.findFirst({
      where: {
        name: { contains: 'Abdomen', mode: 'insensitive' },
        category: 'RADIOLOGY'
      }
    });
    
    if (abdomenType) {
      console.log(`\n3. Found Ultrasound - Abdomen:`);
      console.log(`   ID: ${abdomenType.id}`);
      console.log(`   Name: '${abdomenType.name}'`);
      
      const abdomenTemplate = await prisma.radiologyTemplate.findUnique({
        where: { investigationTypeId: abdomenType.id }
      });
      
      if (abdomenTemplate) {
        console.log(`   ✅ Has Template`);
      } else {
        console.log(`   ❌ No Template`);
      }
      
      // Check service code
      const abdomenService = await prisma.service.findFirst({
        where: { investigationTypes: { some: { id: abdomenType.id } } },
        select: { code: true }
      });
      
      if (abdomenService) {
        console.log(`   Service Code: '${abdomenService.code}'`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
