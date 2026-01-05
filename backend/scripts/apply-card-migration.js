const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Applying card management schema changes...');
    
    // Add card management columns to Patient table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Patient" 
      ADD COLUMN IF NOT EXISTS "cardStatus" TEXT NOT NULL DEFAULT 'INACTIVE',
      ADD COLUMN IF NOT EXISTS "cardActivatedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "cardExpiryDate" TIMESTAMP(3);
    `);
    
    console.log('✅ Added card management columns to Patient table');
    
    // Add suggestedDoctorId to Visit table
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Visit" 
      ADD COLUMN IF NOT EXISTS "suggestedDoctorId" TEXT;
    `);
    
    console.log('✅ Added suggestedDoctorId column to Visit table');
    
    // Create CardStatus enum
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    console.log('✅ Created CardStatus enum');
    
    // Update the cardStatus column type to use the enum (first drop default, then convert, then add default)
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Patient" 
      ALTER COLUMN "cardStatus" DROP DEFAULT;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Patient" 
      ALTER COLUMN "cardStatus" TYPE "CardStatus" USING "cardStatus"::"CardStatus";
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "Patient" 
      ALTER COLUMN "cardStatus" SET DEFAULT 'INACTIVE'::"CardStatus";
    `);
    
    console.log('✅ Updated cardStatus column to use enum');
    
    // Create CardActivation table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CardActivation" (
        "id" SERIAL PRIMARY KEY,
        "patientId" TEXT NOT NULL,
        "activatedById" TEXT NOT NULL,
        "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "billingId" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CardActivation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "CardActivation_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "CardActivation_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `);
    
    console.log('✅ Created CardActivation table');
    
    // Create indexes
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Patient_cardStatus_idx" ON "Patient"("cardStatus");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Visit_suggestedDoctorId_idx" ON "Visit"("suggestedDoctorId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CardActivation_patientId_idx" ON "CardActivation"("patientId");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CardActivation_activatedById_idx" ON "CardActivation"("activatedById");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "CardActivation_activatedAt_idx" ON "CardActivation"("activatedAt");`);
    
    console.log('✅ Created indexes');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

