const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateLabServices() {
  try {
    console.log('🧪 Updating lab services with detailed test templates...');

    // First, get all current lab services
    const currentLabServices = await prisma.service.findMany({
      where: { category: 'LAB' }
    });

    console.log(`📋 Found ${currentLabServices.length} current lab services`);

    // Update existing lab services instead of deleting to avoid foreign key constraints
    console.log('🔄 Updating existing lab services...');
    
    // First, deactivate all current lab services
    await prisma.service.updateMany({
      where: { category: 'LAB' },
      data: { isActive: false }
    });
    console.log('✅ Deactivated all current lab services');

    // Get the lab test templates to create services from them
    const labTemplates = await prisma.labTestTemplate.findMany({
      where: { isActive: true }
    });

    console.log(`📋 Found ${labTemplates.length} lab test templates`);

    // Create new services based on lab templates
    const newLabServices = labTemplates.map(template => {
      // Generate service code based on template name and category
      const code = generateServiceCode(template.name, template.category);
      
      // Set appropriate pricing based on complexity
      const price = getServicePrice(template.category, template.fields.length);
      
      return {
        code: code,
        name: template.name,
        category: 'LAB',
        price: price,
        description: template.description || `Detailed ${template.category.toLowerCase()} test with ${template.fields.length} parameters`,
        isActive: true
      };
    });

    console.log('\n💰 Service pricing:');
    newLabServices.forEach(service => {
      console.log(`   ${service.code}: ${service.name} - ETB ${service.price}`);
    });

    // Add new services to database
    console.log('\n📝 Adding new lab services...');
    for (const service of newLabServices) {
      try {
        await prisma.service.create({
          data: service
        });
        console.log(`✅ Added: ${service.name} (${service.code}) - ETB ${service.price}`);
      } catch (error) {
        console.error(`❌ Error adding ${service.name}:`, error.message);
      }
    }

    // Update investigation types to link with new services
    console.log('\n🔗 Updating investigation types...');
    for (const template of labTemplates) {
      const service = await prisma.service.findUnique({
        where: { code: generateServiceCode(template.name, template.category) }
      });

      if (service) {
        // Check if investigation type already exists
        const existingType = await prisma.investigationType.findFirst({
          where: {
            name: template.name,
            category: 'LAB'
          }
        });

        if (existingType) {
          // Update existing investigation type
          await prisma.investigationType.update({
            where: { id: existingType.id },
            data: {
              price: service.price,
              serviceId: service.id
            }
          });
          console.log(`✅ Updated investigation type: ${template.name}`);
        } else {
          // Create new investigation type
          await prisma.investigationType.create({
            data: {
              name: template.name,
              price: service.price,
              category: 'LAB',
              serviceId: service.id
            }
          });
          console.log(`✅ Created investigation type: ${template.name}`);
        }
      }
    }

    console.log('\n🎉 Lab services update completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   • Removed ${currentLabServices.length} old lab services`);
    console.log(`   • Added ${newLabServices.length} new detailed lab services`);
    console.log(`   • Updated investigation types with service links`);
    
  } catch (error) {
    console.error('❌ Error updating lab services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateServiceCode(name, category) {
  // Generate service codes based on category and name
  const categoryPrefix = {
    'Hematology': 'HEM',
    'Urinalysis': 'URI',
    'Blood Chemistry': 'CHEM',
    'Serology': 'SERO',
    'Bacteriology': 'BACT',
    'Stool': 'STOOL'
  };

  const prefix = categoryPrefix[category] || 'LAB';
  
  // Extract key words from name for code
  const words = name.split(' ');
  let code = prefix;
  
  if (words.includes('Complete') && words.includes('Blood')) {
    code += '001'; // CBC
  } else if (words.includes('Urinalysis')) {
    code += '002';
  } else if (words.includes('Blood') && words.includes('Chemistry')) {
    code += '003';
  } else if (words.includes('Serology')) {
    code += '004';
  } else if (words.includes('Bacteriology')) {
    code += '005';
  } else if (words.includes('Stool')) {
    code += '006';
  } else {
    code += '000';
  }
  
  return code;
}

function getServicePrice(category, fieldCount) {
  // Base pricing based on category and complexity
  const basePrices = {
    'Hematology': 200,      // CBC is complex
    'Urinalysis': 80,       // Standard urinalysis
    'Blood Chemistry': 150, // Blood chemistry panel
    'Serology': 120,        // Serology tests
    'Bacteriology': 100,    // Bacteriology tests
    'Stool': 60            // Stool examination
  };

  const basePrice = basePrices[category] || 100;
  
  // Add complexity factor based on number of fields
  const complexityFactor = Math.min(fieldCount * 2, 50); // Max 50 ETB for complexity
  
  return basePrice + complexityFactor;
}

updateLabServices();
