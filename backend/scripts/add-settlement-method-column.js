const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSettlementMethodColumn() {
  try {
    // First, ensure the enum type exists
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "LoanSettlementMethod" AS ENUM ('INSTANT_PAID', 'FROM_PAYROLL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Add the column if it doesn't exist
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settlementMethod" "LoanSettlementMethod" DEFAULT 'INSTANT_PAID';
    `;
    
    console.log('Settlement method column added successfully');
    
    // Update all existing loans to have INSTANT_PAID
    const result = await prisma.$executeRaw`
      UPDATE "Loan" 
      SET "settlementMethod" = 'INSTANT_PAID'::"LoanSettlementMethod"
      WHERE "settlementMethod" IS NULL;
    `;
    
    console.log(`Updated ${result} loans to have INSTANT_PAID settlement method`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSettlementMethodColumn();
