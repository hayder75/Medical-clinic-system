const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addSystemSettingsTable() {
  try {
    // Create SystemSettings table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SystemSettings" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        "updatedById" TEXT,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("updatedById") REFERENCES "User"(id) ON DELETE SET NULL
      );
    `;
    
    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "SystemSettings_key_idx" ON "SystemSettings"(key);
    `;
    
    // Insert default card expiry period (1 month = 30 days)
    await prisma.$executeRaw`
      INSERT INTO "SystemSettings" (id, key, value, description, "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, 'cardExpiryPeriodDays', '30', 'Number of days before a card expires after activation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (key) DO NOTHING;
    `;
    
    console.log('SystemSettings table created and default values inserted');
    
  } catch (error) {
    console.error('Error creating SystemSettings table:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSystemSettingsTable();
