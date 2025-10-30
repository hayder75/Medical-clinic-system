'use strict';

// Full export of system data (excluding binary files). Use for moving a working
// environment to another (e.g., VPS). Includes: users, patients, services,
// investigation types, templates, visits, vitals, assignments, appointments,
// billing + payments, lab/radiology orders and results, batch orders, meds.

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const outFile = path.resolve(__dirname, `../full-database-export-${ts}.json`);

  // Catalogs and users
  const services = await prisma.service.findMany();
  const investigationTypes = await prisma.investigationType.findMany();
  const labTestTemplates = await prisma.labTestTemplate.findMany();
  const users = await prisma.user.findMany();
  const departments = await prisma.department.findMany().catch(() => []);
  const insurances = await prisma.insurance.findMany().catch(() => []);

  // Core entities
  const patients = await prisma.patient.findMany();
  const visits = await prisma.visit.findMany();
  const vitals = await prisma.vitalSign.findMany();
  const assignments = await prisma.assignment.findMany();
  const appointments = await prisma.appointment.findMany();

  // Billing
  const billings = await prisma.billing.findMany();
  const billingServices = await prisma.billingService.findMany();
  const billPayments = await prisma.billPayment.findMany();

  // Orders
  const labOrders = await prisma.labOrder.findMany();
  const labResults = await prisma.labResult.findMany();
  const radiologyOrders = await prisma.radiologyOrder.findMany();
  const radiologyResults = await prisma.radiologyResult.findMany();
  const batchOrders = await prisma.batchOrder.findMany();
  const batchOrderServices = await prisma.batchOrderService.findMany();
  const detailedLabResults = await prisma.detailedLabResult.findMany();

  // Medications
  const medicationOrders = await prisma.medicationOrder.findMany();
  const pharmacyInvoices = await prisma.pharmacyInvoice.findMany();
  const pharmacyInvoiceItems = await prisma.pharmacyInvoiceItem.findMany();
  const dispensed = await prisma.dispensedMedicine.findMany();
  const inventoryItems = await prisma.inventory.findMany();
  const medicationCatalog = await prisma.medicationCatalog.findMany();
  const insuranceTransactions = await prisma.insuranceTransaction.findMany().catch(() => []);

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      note: 'Full export excluding binary file blobs. Paths to files retained if present.'
    },
    catalogs: {
      services,
      investigationTypes,
      labTestTemplates,
      departments,
      medicationCatalog,
      inventoryItems
    },
    insurances,
    users,
    patients,
    visits,
    vitals,
    assignments,
    appointments,
    billing: { billings, billingServices, billPayments },
    orders: {
      labOrders,
      labResults,
      radiologyOrders,
      radiologyResults,
      batchOrders,
      batchOrderServices,
      detailedLabResults
    },
    medications: { medicationOrders, pharmacyInvoices, pharmacyInvoiceItems, dispensed },
    insuranceTransactions
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`✅ Full export written to ${outFile}`);
}

main().catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });


