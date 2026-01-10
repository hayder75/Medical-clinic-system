const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    console.log('=== Checking Abdominal Ultrasound Mismatch ===\n');
    
    // 1. Find all radiology investigation types
    const allTypes = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    console.log('1. All Radiology InvestigationTypes:');
    allTypes.forEach(t => {
      const isAbdominal = t.name.toLowerCase().includes('abdominal') || t.name.toLowerCase().includes('abdomen');
      console.log(`   ${isAbdominal ? '>>>' : '   '} ID: ${t.id}, Name: '${t.name}'`);
    });
    
    // 2. Find all templates
    const allTemplates = await prisma.radiologyTemplate.findMany({
      include: { investigationType: { select: { id: true, name: true } } },
      orderBy: { investigationType: { name: 'asc' } }
    });
    
    console.log(`\n2. All Radiology Templates (${allTemplates.length} total):`);
    allTemplates.forEach(t => {
      const hasConclusion = t.conclusionTemplate && t.conclusionTemplate.length > 0;
      const isAbdominal = t.investigationType.name.toLowerCase().includes('abdominal') || t.investigationType.name.toLowerCase().includes('abdomen');
      console.log(`   ${isAbdominal ? '>>>' : '   '} ID: ${t.investigationType.id}, Name: '${t.investigationType.name}', Has Template: ${hasConclusion}`);
    });
    
    // 3. Check if Ultrasound - Abdomen has a template
    const abdomenType = allTypes.find(t => t.name.toLowerCase().includes('abdomen'));
    if (abdomenType) {
      console.log(`\n3. Checking 'Ultrasound - Abdomen' (ID: ${abdomenType.id}):`);
      const abdomenTemplate = await prisma.radiologyTemplate.findUnique({
        where: { investigationTypeId: abdomenType.id }
      });
      
      if (abdomenTemplate) {
        console.log(`   ✅ Template EXISTS`);
        console.log(`   - Findings: ${abdomenTemplate.findingsTemplate ? abdomenTemplate.findingsTemplate.length + ' chars' : 'MISSING'}`);
        console.log(`   - Conclusion: ${abdomenTemplate.conclusionTemplate ? abdomenTemplate.conclusionTemplate.length + ' chars' : 'MISSING'}`);
      } else {
        console.log(`   ❌ Template MISSING for 'Ultrasound - Abdomen'`);
      }
    } else {
      console.log(`\n3. ❌ 'Ultrasound - Abdomen' investigation type NOT FOUND`);
    }
    
    // 4. Check what doctor side might be sending
    console.log(`\n4. Doctor side uses investigationTypeId to create orders`);
    console.log(`   When doctor selects 'Ultrasound - Abdomen', it sends ID: ${abdomenType ? abdomenType.id : 'NOT FOUND'}`);
    console.log(`   Radiology side fetches template using: /radiologies/templates/${investigationTypeId}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
