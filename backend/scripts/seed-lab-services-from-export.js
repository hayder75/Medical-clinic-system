const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // Get export file path from command line or use default
  const exportFile = process.argv[2] || path.join(__dirname, '../lab-services-export.json');
  
  if (!fs.existsSync(exportFile)) {
    console.error(`❌ Export file not found: ${exportFile}`);
    console.error('Usage: node scripts/seed-lab-services-from-export.js [path-to-export.json]');
    process.exit(1);
  }

  console.log('📥 Loading lab services from:', exportFile);
  const data = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
  const services = data.labServices || [];

  if (services.length === 0) {
    console.error('❌ No lab services found in export file');
    process.exit(1);
  }

  console.log(`\n🧪 Found ${services.length} lab services to import:\n`);
  services.forEach(s => console.log(`  - ${s.code}: ${s.name} (${s.price} ETB)`));

  console.log('\n📤 Importing lab services...\n');

  let imported = 0;
  let updated = 0;
  let skipped = 0;

  for (const service of services) {
    try {
      // Try to find existing service by code (unique field)
      const existing = await prisma.service.findUnique({
        where: { code: service.code }
      });

      if (existing) {
        // Update existing service
        await prisma.service.update({
          where: { code: service.code },
          data: {
            name: service.name,
            category: service.category,
            price: service.price,
            description: service.description,
            isActive: service.isActive !== false
          }
        });
        updated++;
        console.log(`  ✅ Updated: ${service.code} - ${service.name}`);
      } else {
        // Create new service
        await prisma.service.create({
          data: {
            code: service.code,
            name: service.name,
            category: service.category,
            price: service.price,
            description: service.description,
            isActive: service.isActive !== false
          }
        });
        imported++;
        console.log(`  ✅ Created: ${service.code} - ${service.name}`);
      }
    } catch (error) {
      skipped++;
      console.log(`  ⚠️  Error with ${service.code}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Import Summary:');
  console.log(`   ✅ Created: ${imported}`);
  console.log(`   🔄 Updated: ${updated}`);
  console.log(`   ⚠️  Skipped: ${skipped}`);
  console.log(`   📦 Total: ${services.length}`);
  console.log('='.repeat(50));
  console.log('\n✅ Lab services import completed!\n');
}

main()
  .catch((error) => {
    console.error('❌ Error importing lab services:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

