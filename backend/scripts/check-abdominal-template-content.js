const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const abdomenTemplate = await prisma.radiologyTemplate.findFirst({
      where: {
        investigationType: {
          name: { contains: 'Abdomen', mode: 'insensitive' }
        }
      },
      include: {
        investigationType: {
          select: { id: true, name: true }
        }
      }
    });
    
    if (!abdomenTemplate) {
      console.log('❌ Template not found');
      process.exit(1);
    }
    
    console.log('=== Abdominal Ultrasound Template Content ===\n');
    console.log(`InvestigationType: ${abdomenTemplate.investigationType.name} (ID: ${abdomenTemplate.investigationType.id})`);
    console.log(`\nFindings Template Length: ${abdomenTemplate.findingsTemplate?.length || 0} chars`);
    console.log(`Conclusion Template Length: ${abdomenTemplate.conclusionTemplate?.length || 0} chars`);
    console.log(`\nFindings Preview (first 200 chars):`);
    console.log(abdomenTemplate.findingsTemplate?.substring(0, 200) || 'EMPTY');
    console.log(`\nConclusion:`);
    console.log(abdomenTemplate.conclusionTemplate || 'EMPTY');
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
