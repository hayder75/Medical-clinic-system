const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const labServices = [
  {
    name: "Complete Blood Count (CBC)",
    code: "CBC001",
    category: "LAB",
    price: 150.00,
    description: "Complete blood count including hemoglobin, hematocrit, RBC, WBC, platelets and differential count",
    isActive: true
  },
  {
    name: "Stool Examination",
    code: "STOOL001",
    category: "LAB",
    price: 80.00,
    description: "Complete stool examination for parasites, consistency, color and occult blood",
    isActive: true
  },
  {
    name: "Urinalysis",
    code: "URINE001",
    category: "LAB",
    price: 100.00,
    description: "Complete urinalysis including physical, chemical and microscopic examination",
    isActive: true
  },
  {
    name: "Serology Panel",
    code: "SERO001",
    category: "LAB",
    price: 200.00,
    description: "Complete serology panel including infectious disease markers",
    isActive: true
  },
  {
    name: "Blood Chemistry Panel",
    code: "CHEM001",
    category: "LAB",
    price: 180.00,
    description: "Complete blood chemistry panel including liver function, kidney function and lipid profile",
    isActive: true
  },
  {
    name: "Bacteriology Culture & Sensitivity",
    code: "BACT001",
    category: "LAB",
    price: 120.00,
    description: "Bacterial culture and sensitivity testing including AFB",
    isActive: true
  },
  {
    name: "Parasitology Examination",
    code: "PARA001",
    category: "LAB",
    price: 90.00,
    description: "Parasitology examination including stool microscopy and blood film for malarial parasite",
    isActive: true
  }
];

async function seedLabServices() {
  try {
    console.log('🧪 Starting lab services seeding...');

    // Check if lab services already exist
    const existingServices = await prisma.service.findMany({
      where: { category: 'LAB' }
    });

    if (existingServices.length > 0) {
      console.log(`⚠️  Found ${existingServices.length} existing lab services. Updating...`);
      
      // Update existing services
      for (const service of existingServices) {
        const newService = labServices.find(s => s.code === service.code);
        if (newService) {
          await prisma.service.update({
            where: { id: service.id },
            data: {
              name: newService.name,
              price: newService.price,
              description: newService.description,
              isActive: newService.isActive
            }
          });
          console.log(`✅ Updated service: ${newService.name}`);
        }
      }
    } else {
      console.log('📝 Creating new lab services...');
      
      // Create new services
      for (const service of labServices) {
        await prisma.service.create({
          data: service
        });
        console.log(`✅ Created service: ${service.name}`);
      }
    }

    console.log('🎉 Lab services seeding completed successfully!');
    console.log(`📊 Total lab services: ${labServices.length}`);

    // Display summary
    console.log('\n📋 Lab Services Summary:');
    labServices.forEach((service, index) => {
      console.log(`${index + 1}. ${service.name} (${service.code}) - ${service.price} ETB`);
    });

  } catch (error) {
    console.error('❌ Error seeding lab services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedLabServices()
  .then(() => {
    console.log('✅ Lab services seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lab services seeding failed:', error);
    process.exit(1);
  });


