const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addInvestigationTypes() {
  try {
    console.log('🚀 Adding investigation types for lab and radiology services...');

    // Get all LAB and RADIOLOGY services
    const labServices = await prisma.service.findMany({
      where: { category: 'LAB' }
    });

    const radiologyServices = await prisma.service.findMany({
      where: { category: 'RADIOLOGY' }
    });

    console.log(`📋 Found ${labServices.length} lab services and ${radiologyServices.length} radiology services`);

    // Add Lab Investigation Types
    console.log('\n🧪 Adding Lab Investigation Types...');
    for (const service of labServices) {
      try {
        // Check if investigation type already exists
        const existingType = await prisma.investigationType.findFirst({
          where: {
            name: service.name,
            category: 'LAB'
          }
        });

        if (!existingType) {
          await prisma.investigationType.create({
            data: {
              name: service.name,
              price: service.price,
              category: 'LAB',
              serviceId: service.id
            }
          });
        } else {
          // Update existing type
          await prisma.investigationType.update({
            where: { id: existingType.id },
            data: {
              price: service.price,
              serviceId: service.id
            }
          });
        }
        console.log(`✅ Added lab investigation type: ${service.name} - ETB ${service.price}`);
      } catch (error) {
        console.error(`❌ Error adding lab investigation type ${service.name}:`, error.message);
      }
    }

    // Add Radiology Investigation Types
    console.log('\n📡 Adding Radiology Investigation Types...');
    for (const service of radiologyServices) {
      try {
        // Check if investigation type already exists
        const existingType = await prisma.investigationType.findFirst({
          where: {
            name: service.name,
            category: 'RADIOLOGY'
          }
        });

        if (!existingType) {
          await prisma.investigationType.create({
            data: {
              name: service.name,
              price: service.price,
              category: 'RADIOLOGY',
              serviceId: service.id
            }
          });
        } else {
          // Update existing type
          await prisma.investigationType.update({
            where: { id: existingType.id },
            data: {
              price: service.price,
              serviceId: service.id
            }
          });
        }
        console.log(`✅ Added radiology investigation type: ${service.name} - ETB ${service.price}`);
      } catch (error) {
        console.error(`❌ Error adding radiology investigation type ${service.name}:`, error.message);
      }
    }

    // Display summary
    const totalLabTypes = await prisma.investigationType.count({
      where: { category: 'LAB' }
    });
    const totalRadiologyTypes = await prisma.investigationType.count({
      where: { category: 'RADIOLOGY' }
    });
    
    console.log('\n📊 Summary:');
    console.log(`✅ Total lab investigation types: ${totalLabTypes}`);
    console.log(`✅ Total radiology investigation types: ${totalRadiologyTypes}`);
    console.log('\n🎉 All investigation types added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addInvestigationTypes();
