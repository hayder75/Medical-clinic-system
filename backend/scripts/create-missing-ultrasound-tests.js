const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// The 3 missing ultrasound tests from the document
const testsToCreate = [
  {
    name: 'Abdomino-Pelvic Ultrasound (Female)',
    code: 'US007',
    price: 1500, // Adjust price as needed
    description: 'Combined abdominal and pelvic ultrasound for female patients'
  },
  {
    name: 'Abdomino-Pelvic Ultrasound (Male)',
    code: 'US008',
    price: 1500, // Adjust price as needed
    description: 'Combined abdominal and pelvic ultrasound for male patients'
  },
  {
    name: 'Transvaginal Ultrasound (TVS)',
    code: 'US009',
    price: 1200, // Adjust price as needed
    description: 'Transvaginal ultrasound examination'
  }
];

async function createMissingTests() {
  try {
    console.log('🔍 Creating missing ultrasound tests...\n');

    for (const testData of testsToCreate) {
      // Check if service already exists
      const existingService = await prisma.service.findFirst({
        where: {
          OR: [
            { code: testData.code },
            { name: { contains: testData.name, mode: 'insensitive' } }
          ],
          category: 'RADIOLOGY'
        }
      });

      if (existingService) {
        console.log(`⚠️  Service already exists: ${testData.name} (${testData.code})`);
        
        // Check if InvestigationType exists
        const existingType = await prisma.investigationType.findFirst({
          where: { serviceId: existingService.id }
        });

        if (!existingType) {
          // Create InvestigationType if service exists but no type
          const invType = await prisma.investigationType.create({
            data: {
              name: testData.name,
              price: testData.price,
              category: 'RADIOLOGY',
              serviceId: existingService.id
            }
          });
          console.log(`   ✅ Created InvestigationType: ${invType.name} (ID: ${invType.id})`);
        }
        continue;
      }

      // Create Service
      const service = await prisma.service.create({
        data: {
          code: testData.code,
          name: testData.name,
          category: 'RADIOLOGY',
          price: testData.price,
          unit: 'UNIT',
          description: testData.description,
          isActive: true
        }
      });

      console.log(`✅ Created Service: ${service.name} (${service.code}) - ID: ${service.id}`);

      // Create InvestigationType
      const invType = await prisma.investigationType.create({
        data: {
          name: testData.name,
          price: testData.price,
          category: 'RADIOLOGY',
          serviceId: service.id
        }
      });

      console.log(`✅ Created InvestigationType: ${invType.name} (ID: ${invType.id})`);
      console.log('');
    }

    console.log('✨ All missing tests created successfully!');

    // Show final list
    const allRadiology = await prisma.investigationType.findMany({
      where: { category: 'RADIOLOGY' },
      include: {
        service: {
          select: { code: true, name: true, isActive: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`\n📋 Final list of radiology tests (${allRadiology.length} total):`);
    allRadiology.forEach((r, i) => {
      const status = r.service?.isActive === false ? ' (INACTIVE)' : '';
      console.log(`   ${i + 1}. ${r.name} - ${r.service?.code || 'N/A'}${status}`);
    });

  } catch (error) {
    console.error('❌ Error creating tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createMissingTests()
  .then(() => {
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

