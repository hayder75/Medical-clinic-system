const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');

  try {
    // Read the exported data
    const jsonData = JSON.parse(fs.readFileSync('complete-database-export-2025-10-28.json', 'utf8'));
    const { services, investigations, teeth } = jsonData;

    // 1. Create Services
    console.log('1. Creating services...');
    let serviceCount = 0;
    for (const service of services) {
      try {
        await prisma.service.upsert({
          where: { code: service.code },
          update: {},
          create: {
            code: service.code,
            name: service.name,
            category: service.category,
            price: service.price,
            description: service.description,
            isActive: service.isActive
          }
        });
        serviceCount++;
      } catch (error) {
        console.log(`⚠️  Failed to create service ${service.code}: ${error.message}`);
      }
    }
    console.log(`✅ Created/updated ${serviceCount} services`);

    // 2. Create Investigation Types
    console.log('\n2. Creating investigation types...');
    let investCount = 0;
    for (const inv of investigations) {
      try {
        // First, find the corresponding service by name
        const matchingService = await prisma.service.findFirst({
          where: { name: inv.name }
        });
        
        if (matchingService) {
          await prisma.investigationType.upsert({
            where: { id: inv.id },
            update: {
              name: inv.name,
              price: inv.price,
              category: inv.category,
              serviceId: matchingService.id
            },
            create: {
              id: inv.id,
              name: inv.name,
              price: inv.price,
              category: inv.category,
              serviceId: matchingService.id
            }
          });
          investCount++;
        } else {
          console.log(`⚠️  No service found for investigation: ${inv.name}`);
        }
      } catch (error) {
        console.log(`⚠️  Failed to create investigation ${inv.name}: ${error.message}`);
      }
    }
    console.log(`✅ Created/updated ${investCount} investigations`);

    // 3. Create Teeth
    console.log('\n3. Creating teeth...');
    let teethCount = 0;
    for (const tooth of teeth) {
      try {
        await prisma.tooth.upsert({
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
        teethCount++;
      } catch (error) {
        console.log(`⚠️  Failed to create tooth ${tooth.number}: ${error.message}`);
      }
    }
    console.log(`✅ Created/updated ${teethCount} teeth`);

    // 4. Create Departments (basic ones)
    console.log('\n4. Creating departments...');
    const depts = await prisma.department.createMany({
      data: [
        { name: 'Dentists', description: 'Dental diagnosis and treatment' },
        { name: 'Lab', description: 'Laboratory testing' },
        { name: 'Radiology', description: 'Imaging services' },
        { name: 'Pharmacy', description: 'Medication dispensing' },
      ],
      skipDuplicates: true,
    });
    console.log(`✅ Created ${depts.count} departments`);

    // 5. Create Insurance (basic one)
    console.log('\n5. Creating insurance...');
    try {
      await prisma.insurance.upsert({
        where: { code: 'INS-001' },
        update: {},
        create: {
          name: 'Standard Insurance',
          code: 'INS-001',
          isActive: true,
        },
      });
      console.log('✅ Insurance created/updated');
    } catch (error) {
      console.log('⚠️  Insurance already exists or error:', error.message);
    }

    console.log('\n🎉 Seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Services: ${serviceCount}`);
    console.log(`   - Investigations: ${investCount}`);
    console.log(`   - Teeth: ${teethCount}`);
    console.log(`   - Departments: ${depts.count}`);
    console.log('');

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

