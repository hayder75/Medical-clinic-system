'use strict';

// Reset PostgreSQL auto-increment sequences to prevent ID conflicts
// Run this after importing data with explicit IDs

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const sequences = [
    { table: 'LabOrder', column: 'id' },
    { table: 'RadiologyOrder', column: 'id' },
    { table: 'Visit', column: 'id' },
    { table: 'BatchOrder', column: 'id' },
    { table: 'MedicationOrder', column: 'id' },
    { table: 'Assignment', column: 'id' },
    { table: 'Appointment', column: 'id' },
    { table: 'VitalSign', column: 'id' }
  ];

  for (const { table, column } of sequences) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', '${column}'), COALESCE((SELECT MAX("${column}") FROM "${table}"), 1), true);`
      );
      console.log(`✅ Reset sequence for ${table}.${column}`);
    } catch (err) {
      console.warn(`⚠️  Could not reset sequence for ${table}.${column}:`, err.message);
    }
  }

  console.log('✅ All sequences reset successfully.');
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
