'use strict';

/*
  Cleanup script for demo environment
  - Deletes ALL patient-generated and financial records
  - Keeps master data (users, services, templates, catalog) intact

  SAFE TO RUN IN DEMO/STAGING ONLY. DO NOT RUN ON PRODUCTION WITH REAL DATA.
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⚠️  DEMO CLEANUP: Deleting patient-generated and financial records...');

  // Order matters due to foreign keys
  // Results/files and attachments first
  await prisma.radiologyResultFile.deleteMany({});
  await prisma.labResultFile.deleteMany({});
  await prisma.radiologyResult.deleteMany({});
  await prisma.labResult.deleteMany({});
  await prisma.detailedLabResult.deleteMany({});

  // Files and images
  await prisma.patientAttachedImage.deleteMany({});
  await prisma.patientGallery.deleteMany({});
  await prisma.dentalPhoto.deleteMany({});
  await prisma.file.deleteMany({});

  // Pharmacy and medication
  await prisma.dispensedMedicine.deleteMany({});
  await prisma.dispenseLog.deleteMany({});
  await prisma.pharmacyInvoiceItem.deleteMany({});
  await prisma.pharmacyInvoice.deleteMany({});
  await prisma.continuousInfusion.deleteMany({});
  await prisma.nurseAdministration.deleteMany({});

  // Orders
  await prisma.batchOrderService.deleteMany({});
  await prisma.batchOrder.deleteMany({});
  await prisma.labOrder.deleteMany({});
  await prisma.radiologyOrder.deleteMany({});
  await prisma.medicationOrder.deleteMany({});
  await prisma.nurseServiceAssignment.deleteMany({});

  // Visits and clinical notes
  await prisma.diagnosisNotes.deleteMany({});
  await prisma.medicalHistory.deleteMany({});
  await prisma.vitalSign.deleteMany({});
  await prisma.dentalRecord.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.virtualQueue.deleteMany({});
  await prisma.medicalCertificate.deleteMany({});

  // Financials and accounts
  await prisma.accountTransaction.deleteMany({});
  await prisma.accountDeposit.deleteMany({});
  await prisma.accountRequest.deleteMany({});
  await prisma.patientAccount.deleteMany({});
  await prisma.insuranceTransaction.deleteMany({});
  await prisma.cardActivation.deleteMany({});
  await prisma.billPayment.deleteMany({});
  await prisma.billingService.deleteMany({});
  await prisma.billing.deleteMany({});
  await prisma.bankDeposit.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  await prisma.cashExpense.deleteMany({});
  await prisma.dailyCashSession.deleteMany({});

  // Assignments and visits
  await prisma.assignment.deleteMany({});
  await prisma.visit.deleteMany({});

  // Patients last (kept empty for demo)
  await prisma.patient.deleteMany({});

  // Logs
  await prisma.auditLog.deleteMany({});

  console.log('✅ DEMO CLEANUP: Completed successfully.');
}

main()
  .catch((e) => {
    console.error('Cleanup failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
