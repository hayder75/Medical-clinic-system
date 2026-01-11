const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInvestigationTypes() {
  try {
    console.log('Seeding investigation types...');

    // First, create services for lab and radiology
    const labService = await prisma.service.upsert({
      where: { code: 'LAB001' },
      update: {},
      create: {
        code: 'LAB001',
        name: 'Laboratory Services',
        description: 'General laboratory testing services',
        category: 'LAB',
        price: 0 // Base price, individual tests have their own prices
      }
    });

    const radiologyService = await prisma.service.upsert({
      where: { code: 'RAD001' },
      update: {},
      create: {
        code: 'RAD001',
        name: 'Radiology Services',
        description: 'General radiology and imaging services',
        category: 'RADIOLOGY',
        price: 0 // Base price, individual procedures have their own prices
      }
    });

    console.log('Created services');

    // Lab Investigation Types
    const labTypes = [
      { name: 'CBC (Complete Blood Count)', price: 150, category: 'LAB', serviceId: labService.id },
      { name: 'Blood Sugar (Fasting)', price: 100, category: 'LAB', serviceId: labService.id },
      { name: 'Lipid Profile', price: 200, category: 'LAB', serviceId: labService.id },
      { name: 'Liver Function Test', price: 180, category: 'LAB', serviceId: labService.id },
      { name: 'Kidney Function Test', price: 160, category: 'LAB', serviceId: labService.id },
      { name: 'Thyroid Function Test', price: 250, category: 'LAB', serviceId: labService.id },
      { name: 'Urinalysis', price: 80, category: 'LAB', serviceId: labService.id },
      { name: 'Stool Analysis', price: 120, category: 'LAB', serviceId: labService.id }
    ];

    // Radiology Investigation Types
    const radiologyTypes = [
      { name: 'Chest X-Ray', price: 300, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'Abdominal X-Ray', price: 300, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'CT Scan - Head', price: 1500, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'CT Scan - Chest', price: 1800, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'CT Scan - Abdomen', price: 2000, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'MRI - Brain', price: 3000, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'MRI - Spine', price: 3500, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'Ultrasound - Abdomen', price: 500, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'Ultrasound - Pelvis', price: 600, category: 'RADIOLOGY', serviceId: radiologyService.id },
      { name: 'Mammography', price: 800, category: 'RADIOLOGY', serviceId: radiologyService.id }
    ];

    // Clear existing investigation types
    await prisma.investigationType.deleteMany({});
    console.log('Cleared existing investigation types');

    // Create lab types
    await prisma.investigationType.createMany({
      data: labTypes,
      skipDuplicates: true
    });
    console.log(`Created ${labTypes.length} lab types`);

    // Create radiology types
    await prisma.investigationType.createMany({
      data: radiologyTypes,
      skipDuplicates: true
    });
    console.log(`Created ${radiologyTypes.length} radiology types`);

    console.log('Investigation types seeded successfully!');
  } catch (error) {
    console.error('Error seeding investigation types:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedInvestigationTypes();
