const { PrismaClient } = require('@prisma/client');

// Use local database to read data
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.LOCAL_DB_URL || 'postgresql://postgres:1234@localhost:5432/medical_clinic'
    }
  }
});

// Use Render database to write data
const renderPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🌱 Seeding ALL data from local to Render...\n');

  try {
    // 1. Get all data from local database
    console.log('📥 Reading data from local database...');
    const investigations = await localPrisma.investigationType.findMany();
    const templates = await localPrisma.labTestTemplate.findMany();
    const teeth = await localPrisma.tooth.findMany();
    
    console.log(`Found: ${investigations.length} investigations, ${templates.length} templates, ${teeth.length} teeth\n`);

    // 2. Seed Investigation Types
    if (investigations.length > 0) {
      console.log('1. Seeding investigation types...');
      let count = 0;
      for (const inv of investigations) {
        try {
          await renderPrisma.investigationType.upsert({
            where: { id: inv.id },
            update: {
              name: inv.name,
              price: inv.price,
              category: inv.category,
              serviceId: inv.serviceId
            },
            create: {
              id: inv.id,
              name: inv.name,
              price: inv.price,
              category: inv.category,
              serviceId: inv.serviceId
            }
          });
          count++;
        } catch (error) {
          console.log(`⚠️  Failed: ${inv.name}`);
        }
      }
      console.log(`✅ Seeded ${count}/${investigations.length} investigations`);
    }

    // 3. Seed Lab Templates
    if (templates.length > 0) {
      console.log('\n2. Seeding lab templates...');
      let count = 0;
      for (const template of templates) {
        try {
          await renderPrisma.labTestTemplate.upsert({
            where: { id: template.id },
            update: {
              name: template.name,
              fields: template.fields,
              category: template.category,
              investigationTypeId: template.investigationTypeId
            },
            create: {
              id: template.id,
              name: template.name,
              fields: template.fields,
              category: template.category,
              investigationTypeId: template.investigationTypeId
            }
          });
          count++;
        } catch (error) {
          console.log(`⚠️  Failed: ${template.name}`);
        }
      }
      console.log(`✅ Seeded ${count}/${templates.length} templates`);
    }

    // 4. Seed Teeth
    if (teeth.length > 0) {
      console.log('\n3. Seeding teeth...');
      let count = 0;
      for (const tooth of teeth) {
        try {
          await renderPrisma.tooth.upsert({
            where: { id: tooth.id },
            update: {
              number: tooth.number,
              eruptionStart: tooth.eruptionStart,
              eruptionEnd: tooth.eruptionEnd,
              rootCompletion: tooth.rootCompletion
            },
            create: {
              id: tooth.id,
              number: tooth.number,
              eruptionStart: tooth.eruptionStart,
              eruptionEnd: tooth.eruptionEnd,
              rootCompletion: tooth.rootCompletion
            }
          });
          count++;
        } catch (error) {
          console.log(`⚠️  Failed: Tooth ${tooth.number}`);
        }
      }
      console.log(`✅ Seeded ${count}/${teeth.length} teeth`);
    }

    console.log('\n🎉 ALL DATA SEEDED SUCCESSFULLY!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await localPrisma.$disconnect();
    await renderPrisma.$disconnect();
  });

