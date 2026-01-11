const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createLabTechnician() {
  try {
    console.log('🧪 Creating lab technician user...');

    // Check if lab technician already exists
    const existingTech = await prisma.user.findFirst({
      where: { role: 'LAB_TECHNICIAN' }
    });

    if (existingTech) {
      console.log('✅ Lab technician already exists:', existingTech.fullname);
      return existingTech;
    }

    // Create lab technician
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const labTech = await prisma.user.create({
      data: {
        username: 'labtech',
        password: hashedPassword,
        fullname: 'Lab Technician',
        email: 'labtech@tenalesew.com',
        phone: '+251911234567',
        role: 'LAB_TECHNICIAN',
        specialties: ['Laboratory'],
        availability: true
      }
    });

    console.log('✅ Lab technician created successfully:', labTech.fullname);
    console.log('📧 Username: labtech');
    console.log('🔑 Password: password123');
    
    return labTech;
  } catch (error) {
    console.error('❌ Error creating lab technician:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createLabTechnician()
  .then(() => {
    console.log('🎉 Lab technician setup completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lab technician setup failed:', error);
    process.exit(1);
  });




