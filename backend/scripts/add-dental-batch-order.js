const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDentalBatchOrder() {
  console.log('🦷 Adding DENTAL to BatchOrderType enum and creating DentalProcedureCompletion table...\n');

  try {
    // Add DENTAL to BatchOrderType enum
    try {
      await prisma.$executeRaw`ALTER TYPE "BatchOrderType" ADD VALUE 'DENTAL'`;
      console.log('✅ DENTAL added to BatchOrderType enum');
    } catch (error) {
      // Check if error is because value already exists
      if (error.message.includes('already exists') || error.code === '42710' || error.meta?.code === '42710') {
        console.log('✅ DENTAL already exists in BatchOrderType enum');
      } else {
        console.log('⚠️  Could not add DENTAL to enum. Error:', error.message);
        console.log('⚠️  This may be handled by Prisma migration instead.');
      }
    }

    // Check if DentalProcedureCompletion table exists
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_name = 'DentalProcedureCompletion'
      );
    `;

    if (!tableExists[0].exists) {
      console.log('📝 Creating DentalProcedureCompletion table...');
      await prisma.$executeRaw`
        CREATE TABLE "DentalProcedureCompletion" (
          "id" SERIAL PRIMARY KEY,
          "batchOrderId" INTEGER NOT NULL,
          "batchOrderServiceId" INTEGER NOT NULL,
          "visitId" INTEGER NOT NULL,
          "patientId" TEXT NOT NULL,
          "doctorId" TEXT NOT NULL,
          "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "DentalProcedureCompletion_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "DentalProcedureCompletion_batchOrderServiceId_fkey" FOREIGN KEY ("batchOrderServiceId") REFERENCES "BatchOrderService"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "DentalProcedureCompletion_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "DentalProcedureCompletion_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "DentalProcedureCompletion_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
          CONSTRAINT "DentalProcedureCompletion_batchOrderServiceId_key" UNIQUE ("batchOrderServiceId")
        );
      `;
      
      // Create indexes
      await prisma.$executeRaw`
        CREATE INDEX "DentalProcedureCompletion_batchOrderId_idx" ON "DentalProcedureCompletion"("batchOrderId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX "DentalProcedureCompletion_visitId_idx" ON "DentalProcedureCompletion"("visitId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX "DentalProcedureCompletion_patientId_idx" ON "DentalProcedureCompletion"("patientId");
      `;
      await prisma.$executeRaw`
        CREATE INDEX "DentalProcedureCompletion_doctorId_idx" ON "DentalProcedureCompletion"("doctorId");
      `;
      
      console.log('✅ DentalProcedureCompletion table created');
    } else {
      console.log('✅ DentalProcedureCompletion table already exists');
    }

    console.log('\n✨ Migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addDentalBatchOrder()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  });

