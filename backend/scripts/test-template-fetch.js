const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== Testing Template Fetch ===\n');
    
    // 1. Get Ultrasound - Abdomen investigation type
    const abdomenType = await prisma.investigationType.findFirst({
      where: {
        name: { contains: 'Abdomen', mode: 'insensitive' },
        category: 'RADIOLOGY'
      }
    });
    
    if (!abdomenType) {
      console.log('❌ Ultrasound - Abdomen not found');
      process.exit(1);
    }
    
    console.log(`1. Found InvestigationType:`);
    console.log(`   ID: ${abdomenType.id}`);
    console.log(`   Name: '${abdomenType.name}'`);
    
    // 2. Check if template exists
    const template = await prisma.radiologyTemplate.findUnique({
      where: { investigationTypeId: abdomenType.id }
    });
    
    if (!template) {
      console.log(`\n❌ Template NOT FOUND for ID ${abdomenType.id}`);
      process.exit(1);
    }
    
    console.log(`\n2. Template Found:`);
    console.log(`   InvestigationTypeId: ${template.investigationTypeId}`);
    console.log(`   Has Findings: ${template.findingsTemplate ? 'YES (' + template.findingsTemplate.length + ' chars)' : 'NO'}`);
    console.log(`   Has Conclusion: ${template.conclusionTemplate ? 'YES (' + template.conclusionTemplate.length + ' chars)' : 'NO'}`);
    
    // 3. Test the API endpoint logic (simulate)
    const testTemplate = await prisma.radiologyTemplate.findUnique({
      where: { investigationTypeId: parseInt(abdomenType.id) },
      include: {
        investigationType: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });
    
    if (testTemplate) {
      console.log(`\n✅ Template fetch works correctly for ID ${abdomenType.id}`);
      console.log(`   Template InvestigationType ID: ${testTemplate.investigationType.id}`);
      console.log(`   Template InvestigationType Name: '${testTemplate.investigationType.name}'`);
    } else {
      console.log(`\n❌ Template fetch FAILED for ID ${abdomenType.id}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
