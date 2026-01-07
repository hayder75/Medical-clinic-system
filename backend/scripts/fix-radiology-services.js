/**
 * Script to create InvestigationType records for RADIOLOGY Services
 * that don't have an associated InvestigationType
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRadiologyServices() {
  console.log('🔧 Creating InvestigationType records for RADIOLOGY Services...\n');

  try {
    // Find all RADIOLOGY services without InvestigationType
    const radiologyServices = await prisma.service.findMany({
      where: {
        category: 'RADIOLOGY',
        isActive: true
      },
      include: {
        investigationTypes: true
      }
    });

    let createdCount = 0;
    let skippedCount = 0;

    for (const service of radiologyServices) {
      // Check if service already has an InvestigationType
      if (service.investigationTypes && service.investigationTypes.length > 0) {
        console.log(`   ⏭️  Skipping ${service.name} - already has InvestigationType`);
        skippedCount++;
        continue;
      }

      // Create InvestigationType for this service
      try {
        const investigationType = await prisma.investigationType.create({
          data: {
            name: service.name,
            category: 'RADIOLOGY',
            price: service.price,
            service: {
              connect: { id: service.id }
            }
          }
        });

        console.log(`   ✅ Created InvestigationType for: ${service.name} (${service.code})`);
        createdCount++;
      } catch (error) {
        console.error(`   ❌ Error creating InvestigationType for ${service.name}:`, error.message);
      }
    }

    console.log(`\n✅ Summary:`);
    console.log(`   - Created: ${createdCount} InvestigationType records`);
    console.log(`   - Skipped: ${skippedCount} (already have InvestigationType)`);

  } catch (error) {
    console.error('❌ Error fixing radiology services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  fixRadiologyServices()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixRadiologyServices };

