const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // Read the exported data
    const jsonData = JSON.parse(fs.readFileSync('complete-database-export-2025-10-28.json', 'utf8'));
    
    console.log('📦 Available data types:', Object.keys(jsonData).join(', '));

    // 1. Create Services if they exist
    if (jsonData.Service && Array.isArray(jsonData.Service)) {
      console.log('\n1. Creating services...');
      let serviceCount = 0;
      for (const service of jsonData.Service) {
        try {
          await prisma.service.upsert({
            where: { code: service.code },
            update: {},
            create: {
              code: service.code,
              name: service.name,
              category: service.category,
              price: service.price || 0,
              description: service.description || '',
              isActive: service.isActive !== false
            }
          });
          serviceCount++;
        } catch (error) {
          console.log(`⚠️  Failed to create service ${service.code}: ${error.message}`);
        }
      }
      console.log(`✅ Created/updated ${serviceCount} services`);
    }

    // 2. Create Investigation Types if they exist
    if (jsonData.InvestigationType && Array.isArray(jsonData.InvestigationType)) {
      console.log('\n2. Creating investigation types...');
      let investCount = 0;
      for (const inv of jsonData.InvestigationType) {
        try {
          await prisma.investigationType.upsert({
            where: { id: inv.id },
            update: {},
            create: {
              id: inv.id,
              name: inv.name,
              price: inv.price || 0,
              category: inv.category || 'LAB',
              serviceId: inv.serviceId || null
            }
          });
          investCount++;
        } catch (error) {
          console.log(`⚠️  Failed to create investigation ${inv.name}: ${error.message}`);
        }
      }
      console.log(`✅ Created/updated ${investCount} investigations`);
    }

    // 3. Create Teeth if they exist
    if (jsonData.Tooth && Array.isArray(jsonData.Tooth)) {
      console.log('\n3. Creating teeth...');
      let teethCount = 0;
      for (const tooth of jsonData.Tooth) {
        try {
          await prisma.tooth.upsert({
            where: { id: tooth.id },
            update: {},
            create: {
              id: tooth.id,
              number: tooth.number,
              eruptionStart: tooth.eruptionStart || null,
              eruptionEnd: tooth.eruptionEnd || null,
              rootCompletion: tooth.rootCompletion || null
            }
          });
          teethCount++;
        } catch (error) {
          console.log(`⚠️  Failed to create tooth ${tooth.number}: ${error.message}`);
        }
      }
      console.log(`✅ Created/updated ${teethCount} teeth`);
    }

    // 4. Create Labs/Templates if they exist
    if (jsonData.LabTestTemplate && Array.isArray(jsonData.LabTestTemplate)) {
      console.log('\n4. Creating lab test templates...');
      let templateCount = 0;
      for (const template of jsonData.LabTestTemplate) {
        try {
          await prisma.labTestTemplate.upsert({
            where: { id: template.id },
            update: {
              name: template.name,
              fields: template.fields || [],
              category: template.category || 'LAB',
              investigationTypeId: template.investigationTypeId || null
            },
            create: {
              id: template.id,
              name: template.name,
              fields: template.fields || [],
              category: template.category || 'LAB',
              investigationTypeId: template.investigationTypeId || null
            }
          });
          templateCount++;
        } catch (error) {
          console.log(`⚠️  Failed to create template ${template.name}: ${error.message}`);
        }
      }
      console.log(`✅ Created/updated ${templateCount} lab templates`);
    }

    console.log('\n🎉 Database seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
