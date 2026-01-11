const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Adding waive fields to database...\n');

  try {
    // Add waiveConsultationFee to User table
    console.log('1. Adding waiveConsultationFee to User table...');
    await prisma.$executeRaw`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "waiveConsultationFee" BOOLEAN DEFAULT false;
    `;
    console.log('✅ waiveConsultationFee added to User table\n');

    // Add isWaived, waivedBy, waivedAt to NurseServiceAssignment table
    console.log('2. Adding isWaived, waivedBy, waivedAt to NurseServiceAssignment table...');
    await prisma.$executeRaw`
      ALTER TABLE "NurseServiceAssignment" 
      ADD COLUMN IF NOT EXISTS "isWaived" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "waivedBy" TEXT,
      ADD COLUMN IF NOT EXISTS "waivedAt" TIMESTAMP;
    `;
    console.log('✅ Waive fields added to NurseServiceAssignment table\n');

    // Add isWaived, waivedBy, waivedAt to BatchOrderService table
    console.log('3. Adding isWaived, waivedBy, waivedAt to BatchOrderService table...');
    await prisma.$executeRaw`
      ALTER TABLE "BatchOrderService" 
      ADD COLUMN IF NOT EXISTS "isWaived" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "waivedBy" TEXT,
      ADD COLUMN IF NOT EXISTS "waivedAt" TIMESTAMP;
    `;
    console.log('✅ Waive fields added to BatchOrderService table\n');

    console.log('✨ All waive fields added successfully!\n');
  } catch (error) {
    console.error('❌ Error adding waive fields:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

