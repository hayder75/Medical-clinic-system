const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Update all dental services to have DENTAL category
 * This updates services that have "Dental:" in their name
 */
async function updateDentalServicesCategory() {
  try {
    console.log('🦷 Updating dental services to DENTAL category...\n');

    // Find all services with "Dental" in the name
    const dentalServices = await prisma.service.findMany({
      where: {
        name: {
          contains: 'Dental',
          mode: 'insensitive'
        }
      }
    });

    console.log(`📋 Found ${dentalServices.length} dental services to update\n`);

    let updated = 0;
    let failed = 0;

    for (const service of dentalServices) {
      try {
        await prisma.service.update({
          where: { id: service.id },
          data: {
            category: 'DENTAL'
          }
        });
        updated++;
        console.log(`✅ Updated: ${service.code} - ${service.name} (${service.category} → DENTAL)`);
      } catch (error) {
        failed++;
        console.error(`❌ Failed to update ${service.code}: ${error.message}`);
      }
    }

    console.log('\n📊 Update Summary:');
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total: ${dentalServices.length}`);

    console.log('\n✨ Dental services category update completed!');

  } catch (error) {
    console.error('\n❌ Error updating dental services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run update
if (require.main === module) {
  updateDentalServicesCategory()
    .then(() => {
      console.log('\n✅ Update process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateDentalServicesCategory };

