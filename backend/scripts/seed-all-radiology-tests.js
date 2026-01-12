/**
 * Script to seed ALL radiology tests
 * Includes: All Ultrasound tests, X-Rays, CT scans, MRI, Mammography
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAllRadiologyTests() {
  console.log('📷 Seeding all radiology tests...\n');

  try {
    // Define all radiology tests
    const radiologyTests = [
      // ==========================================
      // ULTRASOUND TESTS
      // ==========================================
      {
        code: 'US001',
        name: 'Abdominal Ultrasound',
        description: 'Abdominal ultrasound examination',
        price: 400.00,
        isActive: true
      },
      {
        code: 'US002',
        name: 'Pelvic Ultrasound',
        description: 'Pelvic ultrasound examination',
        price: 380.00,
        isActive: true
      },
      {
        code: 'US003',
        name: 'Obstetric Ultrasound',
        description: 'Obstetric ultrasound examination',
        price: 420.00,
        isActive: true
      },
      {
        code: 'US004',
        name: 'Thyroid Ultrasound',
        description: 'Thyroid ultrasound examination',
        price: 350.00,
        isActive: true
      },
      {
        code: 'US005',
        name: 'Breast Ultrasound',
        description: 'Breast ultrasound examination',
        price: 380.00,
        isActive: true
      },
      {
        code: 'US006',
        name: 'Doppler Ultrasound',
        description: 'Doppler ultrasound examination',
        price: 450.00,
        isActive: true
      },
      // US007, US008, US009 are already created by create-missing-ultrasound-tests.js
      // ==========================================
      // X-RAY TESTS
      // ==========================================
      {
        code: 'XR001',
        name: 'X-Ray Chest PA View',
        description: 'Chest X-ray PA view',
        price: 150.00,
        isActive: false // Inactive as per user's list
      },
      {
        code: 'XR004',
        name: 'X-Ray Abdomen',
        description: 'Abdominal X-ray',
        price: 160.00,
        isActive: false // Inactive as per user's list
      },
      // ==========================================
      // CT SCANS
      // ==========================================
      {
        code: 'CT001',
        name: 'CT Head without Contrast',
        description: 'CT scan of head without contrast',
        price: 800.00,
        isActive: false // Inactive as per user's list
      },
      {
        code: 'CT003',
        name: 'CT Chest',
        description: 'CT scan of chest',
        price: 1200.00,
        isActive: false // Inactive as per user's list
      },
      // ==========================================
      // MRI
      // ==========================================
      {
        code: 'MRI001',
        name: 'MRI - Brain',
        description: 'MRI scan of brain',
        price: 2000.00,
        isActive: false // Inactive as per user's list
      },
      // ==========================================
      // MAMMOGRAPHY
      // ==========================================
      {
        code: 'MAM001',
        name: 'Mammography',
        description: 'Mammography examination',
        price: 500.00,
        isActive: false // Inactive as per user's list
      }
    ];

    let createdCount = 0;
    let updatedCount = 0;

    for (const testData of radiologyTests) {
      // Check if InvestigationType already exists
      let existingInvestigation = await prisma.investigationType.findFirst({
        where: { name: testData.name }
      });

      // Create or update Service
      const service = await prisma.service.upsert({
        where: { code: testData.code },
        update: {
          name: testData.name,
          price: testData.price,
          description: testData.description,
          isActive: testData.isActive
        },
        create: {
          code: testData.code,
          name: testData.name,
          category: 'RADIOLOGY',
          price: testData.price,
          description: testData.description,
          isActive: testData.isActive
        }
      });

      if (!existingInvestigation) {
        // Create new InvestigationType
        await prisma.investigationType.create({
          data: {
            name: testData.name,
            category: 'RADIOLOGY',
            price: testData.price,
            serviceId: service.id
          }
        });

        createdCount++;
        console.log(`   ✅ Created: ${testData.name} (${testData.code}) - ${testData.isActive ? 'Active' : 'Inactive'}`);
      } else {
        // Update existing InvestigationType
        await prisma.investigationType.update({
          where: { id: existingInvestigation.id },
          data: {
            name: testData.name,
            price: testData.price,
            serviceId: service.id
          }
        });

        updatedCount++;
        console.log(`   ✅ Updated: ${testData.name} (${testData.code}) - ${testData.isActive ? 'Active' : 'Inactive'}`);
      }
    }

    console.log(`\n✅ All radiology tests seeding completed!`);
    console.log(`   Created: ${createdCount} tests`);
    console.log(`   Updated: ${updatedCount} tests`);
    console.log(`   Total processed: ${radiologyTests.length} tests`);

  } catch (error) {
    console.error('❌ Error seeding radiology tests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
seedAllRadiologyTests()
  .then(() => {
    console.log('\n🎉 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
