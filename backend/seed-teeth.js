const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTeeth() {
  console.log('🦷 Seeding teeth data for dental chart...');
  
  try {
    // Check if teeth already exist
    const existingTeeth = await prisma.tooth.count();
    if (existingTeeth > 0) {
      console.log(`✅ Teeth data already exists (${existingTeeth} teeth)`);
      return;
    }
    
    // Create all 32 teeth with their eruption data
    const teethData = [
      // Upper Right Quadrant (11-18)
      { number: 11, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // Central incisor
      { number: 12, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 }, // Lateral incisor
      { number: 13, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 12 }, // Canine
      { number: 14, eruptionStart: 10, eruptionEnd: 11, rootCompletion: 13 }, // First premolar
      { number: 15, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 14 }, // Second premolar
      { number: 16, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // First molar
      { number: 17, eruptionStart: 12, eruptionEnd: 13, rootCompletion: 16 }, // Second molar
      { number: 18, eruptionStart: 17, eruptionEnd: 25, rootCompletion: 25 }, // Third molar (wisdom)
      
      // Upper Left Quadrant (21-28)
      { number: 21, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // Central incisor
      { number: 22, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 }, // Lateral incisor
      { number: 23, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 12 }, // Canine
      { number: 24, eruptionStart: 10, eruptionEnd: 11, rootCompletion: 13 }, // First premolar
      { number: 25, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 14 }, // Second premolar
      { number: 26, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // First molar
      { number: 27, eruptionStart: 12, eruptionEnd: 13, rootCompletion: 16 }, // Second molar
      { number: 28, eruptionStart: 17, eruptionEnd: 25, rootCompletion: 25 }, // Third molar (wisdom)
      
      // Lower Left Quadrant (31-38)
      { number: 31, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // Central incisor
      { number: 32, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 }, // Lateral incisor
      { number: 33, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 12 }, // Canine
      { number: 34, eruptionStart: 10, eruptionEnd: 11, rootCompletion: 13 }, // First premolar
      { number: 35, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 14 }, // Second premolar
      { number: 36, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // First molar
      { number: 37, eruptionStart: 12, eruptionEnd: 13, rootCompletion: 16 }, // Second molar
      { number: 38, eruptionStart: 17, eruptionEnd: 25, rootCompletion: 25 }, // Third molar (wisdom)
      
      // Lower Right Quadrant (41-48)
      { number: 41, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // Central incisor
      { number: 42, eruptionStart: 7, eruptionEnd: 8, rootCompletion: 10 }, // Lateral incisor
      { number: 43, eruptionStart: 9, eruptionEnd: 10, rootCompletion: 12 }, // Canine
      { number: 44, eruptionStart: 10, eruptionEnd: 11, rootCompletion: 13 }, // First premolar
      { number: 45, eruptionStart: 10, eruptionEnd: 12, rootCompletion: 14 }, // Second premolar
      { number: 46, eruptionStart: 6, eruptionEnd: 7, rootCompletion: 9 }, // First molar
      { number: 47, eruptionStart: 12, eruptionEnd: 13, rootCompletion: 16 }, // Second molar
      { number: 48, eruptionStart: 17, eruptionEnd: 25, rootCompletion: 25 }, // Third molar (wisdom)
    ];
    
    await prisma.tooth.createMany({
      data: teethData
    });
    
    console.log('✅ Successfully created 32 teeth for dental chart');
    console.log('🦷 Teeth numbers: 11-18, 21-28, 31-38, 41-48');
    console.log('📊 Each tooth includes eruption timing and root completion data');
    
  } catch (error) {
    console.error('❌ Error seeding teeth:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed
seedTeeth()
  .then(() => {
    console.log('✅ Teeth seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Teeth seeding failed:', error);
    process.exit(1);
  });


