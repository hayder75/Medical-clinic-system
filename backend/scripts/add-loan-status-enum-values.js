const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addLoanStatusEnumValues() {
  try {
    // Add missing enum values to LoanStatus
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TYPE "LoanStatus" ADD VALUE IF NOT EXISTS 'SETTLED';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    await prisma.$executeRaw`
      DO $$ BEGIN
        ALTER TYPE "LoanStatus" ADD VALUE IF NOT EXISTS 'SETTLEMENT_ACCEPTED';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    console.log('LoanStatus enum values added successfully');
    
    // Verify the enum values
    const result = await prisma.$queryRaw`
      SELECT unnest(enum_range(NULL::"LoanStatus")) AS status;
    `;
    
    console.log('\nCurrent LoanStatus enum values:');
    result.forEach(row => {
      console.log(`  - ${row.status}`);
    });
    
  } catch (error) {
    console.error('Error adding enum values:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addLoanStatusEnumValues();
