const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addAllSettlementColumns() {
  try {
    // Ensure the enum type exists
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "LoanSettlementMethod" AS ENUM ('INSTANT_PAID', 'FROM_PAYROLL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Add all missing columns
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settlementMethod" "LoanSettlementMethod" DEFAULT 'INSTANT_PAID';
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settledAt" TIMESTAMP;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settledById" TEXT;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settledAmount" DOUBLE PRECISION;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settlementAcceptedAt" TIMESTAMP;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settlementAcceptedById" TEXT;
    `;
    
    await prisma.$executeRaw`
      ALTER TABLE "Loan" 
      ADD COLUMN IF NOT EXISTS "settlementAcceptedAmount" DOUBLE PRECISION;
    `;
    
    console.log('All settlement columns added successfully');
    
    // Add foreign key constraints if they don't exist
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "Loan" 
        ADD CONSTRAINT "Loan_settledById_fkey" 
        FOREIGN KEY ("settledById") REFERENCES "User"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TABLE "Loan" 
        ADD CONSTRAINT "Loan_settlementAcceptedById_fkey" 
        FOREIGN KEY ("settlementAcceptedById") REFERENCES "User"("id") ON DELETE SET NULL;
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    console.log('Foreign key constraints added');
    
  } catch (error) {
    console.error('Error adding columns:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addAllSettlementColumns();
