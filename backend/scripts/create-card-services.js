const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCardServices() {
  try {
    console.log('🔄 Creating card services...');
    
    // Card Registration Service (First time - 300 Birr)
    const cardRegistrationService = await prisma.service.upsert({
      where: { code: 'CARD-REG' },
      update: {
        name: 'Patient Card Registration',
        price: 300,
        description: 'Initial patient card registration fee (first time only)',
        isActive: true
      },
      create: {
        code: 'CARD-REG',
        name: 'Patient Card Registration',
        category: 'CONSULTATION', // Using existing category
        price: 300,
        description: 'Initial patient card registration fee (first time only)',
        isActive: true
      }
    });
    
    console.log('✅ Created Card Registration Service:', cardRegistrationService);
    
    // Card Activation/Renewal Service (Every 30 days - 200 Birr)
    const cardActivationService = await prisma.service.upsert({
      where: { code: 'CARD-ACT' },
      update: {
        name: 'Patient Card Activation',
        price: 200,
        description: 'Patient card activation/renewal fee (valid for 30 days)',
        isActive: true
      },
      create: {
        code: 'CARD-ACT',
        name: 'Patient Card Activation',
        category: 'CONSULTATION', // Using existing category
        price: 200,
        description: 'Patient card activation/renewal fee (valid for 30 days)',
        isActive: true
      }
    });
    
    console.log('✅ Created Card Activation Service:', cardActivationService);
    
    console.log('🎉 Card services created successfully!');
    
  } catch (error) {
    console.error('❌ Failed to create card services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createCardServices()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

