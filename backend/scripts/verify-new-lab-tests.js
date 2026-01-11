const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyTests() {
  try {
    console.log('🔍 Verifying new lab tests...\n');
    
    // Check Thyroid Function Tests Group
    const thyroidGroup = await prisma.labTestGroup.findFirst({
      where: { name: 'Thyroid Function Tests' },
      include: {
        tests: {
          select: { name: true, code: true, displayOrder: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    });
    
    if (thyroidGroup) {
      console.log('✅ Thyroid Function Tests Group Found:');
      console.log(`   Category: ${thyroidGroup.category}`);
      console.log(`   Display Order: ${thyroidGroup.displayOrder}`);
      console.log(`   Tests (${thyroidGroup.tests.length}):`);
      thyroidGroup.tests.forEach(t => {
        console.log(`     - ${t.displayOrder}. ${t.name} (${t.code})`);
      });
    } else {
      console.log('❌ Thyroid Function Tests Group NOT found');
    }
    
    console.log('');
    
    // Check HCG Quantitative
    const hcgQuant = await prisma.labTest.findFirst({
      where: { code: 'HCG002' },
      include: { resultFields: true }
    });
    
    if (hcgQuant) {
      console.log('✅ HCG Quantitative Found:');
      console.log(`   Name: ${hcgQuant.name}`);
      console.log(`   Code: ${hcgQuant.code}`);
      console.log(`   Price: ${hcgQuant.price}`);
      console.log(`   Category: ${hcgQuant.category}`);
      console.log(`   Result Fields: ${hcgQuant.resultFields.length}`);
    } else {
      console.log('❌ HCG Quantitative NOT found');
    }
    
    console.log('');
    
    // Check RTD
    const rtd = await prisma.labTest.findFirst({
      where: { code: 'RTD001' },
      include: { resultFields: true }
    });
    
    if (rtd) {
      console.log('✅ RTD Found:');
      console.log(`   Name: ${rtd.name}`);
      console.log(`   Code: ${rtd.code}`);
      console.log(`   Price: ${rtd.price}`);
      console.log(`   Category: ${rtd.category}`);
      console.log(`   Result Fields: ${rtd.resultFields.length}`);
    } else {
      console.log('❌ RTD NOT found');
    }
    
    console.log('\n✅ Verification complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTests();


