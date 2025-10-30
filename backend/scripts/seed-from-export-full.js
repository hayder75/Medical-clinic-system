'use strict';

// Seed full database from a JSON produced by export-complete-db-full.js.
// WARNING: Assumes an empty or compatible DB. Preserves IDs to keep relations.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMany(table, data, map) {
  for (const row of data) {
    const payload = map ? map(row) : row;
    // Upsert by ID if present; falls back to createMany-like behavior
    const where = payload.id !== undefined ? { id: payload.id } : null;
    if (where) {
      await prisma[table].upsert({ where, update: payload, create: payload });
    } else {
      await prisma[table].create({ data: payload });
    }
  }
}

async function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error('Usage: node scripts/seed-from-export-full.js <export.json>');
    process.exit(1);
  }
  const inputPath = path.resolve(process.cwd(), argPath);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { catalogs = {}, users = [], patients = [], visits = [], vitals = [], assignments = [], appointments = [], billing = {}, orders = {}, medications = {}, insurances = [], insuranceTransactions = [] } = data;

  // Catalogs
  await createMany('service', catalogs.services || []);
  await createMany('investigationType', catalogs.investigationTypes || []);
  await createMany('labTestTemplate', catalogs.labTestTemplates || []);
  await createMany('department', catalogs.departments || []);
  await createMany('medicationCatalog', catalogs.medicationCatalog || []);
  await createMany('inventory', catalogs.inventoryItems || []);

  // Insurances (before payments referencing them)
  await createMany('insurance', insurances || []);

  // Users and patients
  await createMany('user', users);
  await createMany('patient', patients);

  // Visits and related
  await createMany('visit', visits);
  await createMany('vitalSign', vitals);
  await createMany('assignment', assignments);
  await createMany('appointment', appointments);

  // Billing
  await createMany('billing', billing.billings || []);
  await createMany('billingService', billing.billingServices || []);
  const insuranceIdSet = new Set((insurances || []).map(i => i.id));
  await createMany('billPayment', billing.billPayments || [], (row) => ({
    ...row,
    insuranceId: row.insuranceId && insuranceIdSet.has(row.insuranceId) ? row.insuranceId : null
  }));

  // Orders
  await createMany('batchOrder', orders.batchOrders || []);
  await createMany('batchOrderService', orders.batchOrderServices || []);
  await createMany('labOrder', orders.labOrders || []);
  await createMany('labResult', orders.labResults || []);
  await createMany('detailedLabResult', orders.detailedLabResults || []);
  await createMany('radiologyOrder', orders.radiologyOrders || []);
  await createMany('radiologyResult', orders.radiologyResults || []);

  // Medications
  await createMany('medicationOrder', medications.medicationOrders || []);
  await createMany('pharmacyInvoice', medications.pharmacyInvoices || []);
  await createMany('pharmacyInvoiceItem', medications.pharmacyInvoiceItems || []);
  await createMany('dispensedMedicine', medications.dispensed || []);

  // Insurance transactions (after billing/patients/visits/services exist)
  await createMany('insuranceTransaction', insuranceTransactions || []);

  // Reset PostgreSQL sequences to prevent ID conflicts for new records
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
    } catch (err) {
      console.warn(`⚠️  Could not reset sequence for ${table}.${column}:`, err.message);
    }
  }

  console.log('✅ Full seed completed successfully. Sequences reset.');
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


