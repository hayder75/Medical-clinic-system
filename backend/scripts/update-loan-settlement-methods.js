const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateLoanSettlementMethods() {
  try {
    // Use raw SQL to update loans with null settlementMethod
    const result = await prisma.$executeRaw`
      UPDATE "Loan" 
      SET "settlementMethod" = 'INSTANT_PAID'::"LoanSettlementMethod"
      WHERE "settlementMethod" IS NULL
    `;
    
    console.log(`Updated ${result} loans with null settlementMethod to INSTANT_PAID`);
    
    // Check all loans
    const allLoans = await prisma.loan.findMany({
      select: {
        id: true,
        settlementMethod: true,
        status: true,
        requestedAmount: true
      }
    });
    
    console.log('\nLoan settlement method summary:');
    const summary = {};
    allLoans.forEach(loan => {
      const method = loan.settlementMethod || 'NULL';
      summary[method] = (summary[method] || 0) + 1;
    });
    console.log(summary);
    console.log(`\nTotal loans: ${allLoans.length}`);
    
  } catch (error) {
    console.error('Error updating loans:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateLoanSettlementMethods();
