const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkServiceCategories() {
  try {
    console.log('🔍 Checking Investigation Types and Service Categories...\n');

    // Check lab investigation types
    const labInvs = await prisma.investigationType.findMany({
      where: { category: 'LAB' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            code: true
          }
        }
      },
      take: 5
    });

    console.log('📋 Lab Investigation Types:');
    labInvs.forEach(inv => {
      const serviceMatch = inv.service?.category === 'LAB' ? '✅' : '❌';
      console.log(`   ${serviceMatch} ${inv.name} -> Service: ${inv.service?.name || 'NONE'} (Category: ${inv.service?.category || 'N/A'})`);
    });

    // Check radiology investigation types
    const radInvs = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            code: true
          }
        }
      },
      take: 5
    });

    console.log('\n📋 Radiology Investigation Types:');
    radInvs.forEach(inv => {
      const serviceMatch = inv.service?.category === 'RADIOLOGY' ? '✅' : '❌';
      console.log(`   ${serviceMatch} ${inv.name} -> Service: ${inv.service?.name || 'NONE'} (Category: ${inv.service?.category || 'N/A'})`);
    });

    // Check for mismatches
    const allInvs = await prisma.investigationType.findMany({
      include: {
        service: {
          select: {
            category: true
          }
        }
      }
    });

    const mismatches = allInvs.filter(inv => 
      inv.service && inv.service.category !== inv.category
    );

    if (mismatches.length > 0) {
      console.log('\n⚠️  Found Category Mismatches:');
      mismatches.forEach(inv => {
        console.log(`   ❌ ${inv.name}: Investigation Category = ${inv.category}, Service Category = ${inv.service.category}`);
      });
    } else {
      console.log('\n✅ All investigation types have matching service categories!');
    }

    // Check services without investigation types
    const servicesWithoutInv = await prisma.service.findMany({
      where: {
        category: { in: ['LAB', 'RADIOLOGY'] },
        investigationTypes: { none: {} }
      },
      take: 5
    });

    if (servicesWithoutInv.length > 0) {
      console.log('\n⚠️  Services without linked investigation types:');
      servicesWithoutInv.forEach(svc => {
        console.log(`   - ${svc.name} (${svc.category})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkServiceCategories();

