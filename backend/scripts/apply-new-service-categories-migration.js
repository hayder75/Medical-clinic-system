/**
 * Script to apply the new service categories migration
 * This adds NURSE_WALKIN, EMERGENCY_DRUG, and MATERIAL_NEEDS to the ServiceCategory enum
 * 
 * Run this script if the migration doesn't apply automatically:
 * node scripts/apply-new-service-categories-migration.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying new service categories migration...');
    
    // Check current enum values
    const result = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')
      ORDER BY enumlabel;
    `;
    
    console.log('Current ServiceCategory enum values:', result.map(r => r.enumlabel));
    
    // Add new enum values if they don't exist
    const newValues = ['NURSE_WALKIN', 'EMERGENCY_DRUG', 'MATERIAL_NEEDS'];
    
    for (const value of newValues) {
      const exists = result.some(r => r.enumlabel === value);
      
      if (!exists) {
        console.log(`Adding ${value} to ServiceCategory enum...`);
        await prisma.$executeRawUnsafe(`ALTER TYPE "ServiceCategory" ADD VALUE '${value}';`);
        console.log(`✅ Added ${value}`);
      } else {
        console.log(`⏭️  ${value} already exists, skipping...`);
      }
    }
    
    // Verify the values were added
    const finalResult = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ServiceCategory')
      ORDER BY enumlabel;
    `;
    
    console.log('\n✅ Migration completed!');
    console.log('Final ServiceCategory enum values:', finalResult.map(r => r.enumlabel));
    
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

