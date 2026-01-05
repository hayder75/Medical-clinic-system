const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPatientData() {
  try {
    console.log('🧹 Clearing ALL patient data...');
    console.log('⚠️  This will remove all patients, visits, history, certificates, and related data.');
    console.log('✅ Staff, services, templates, and system data will be preserved.\n');

    // Clear patient-related data in order (respecting foreign key constraints)
    
    // 1. Clear account-related transactions and deposits (must be before accounts)
    const accountTransactions = await prisma.accountTransaction.deleteMany({});
    console.log(`✅ Cleared ${accountTransactions.count} account transactions`);

    const accountDeposits = await prisma.accountDeposit.deleteMany({});
    console.log(`✅ Cleared ${accountDeposits.count} account deposits`);

    const accountRequests = await prisma.accountRequest.deleteMany({});
    console.log(`✅ Cleared ${accountRequests.count} account requests`);

    // 2. Clear patient accounts
    const patientAccounts = await prisma.patientAccount.deleteMany({});
    console.log(`✅ Cleared ${patientAccounts.count} patient accounts`);

    // 3. Clear insurance transactions
    const insuranceTransactions = await prisma.insuranceTransaction.deleteMany({});
    console.log(`✅ Cleared ${insuranceTransactions.count} insurance transactions`);

    // 4. Clear patient gallery images
    const patientGallery = await prisma.patientGallery.deleteMany({});
    console.log(`✅ Cleared ${patientGallery.count} patient gallery images`);

    // 5. Clear patient attached images
    const patientAttachedImages = await prisma.patientAttachedImage.deleteMany({});
    console.log(`✅ Cleared ${patientAttachedImages.count} patient attached images`);

    // 6. Clear card activations
    const cardActivations = await prisma.cardActivation.deleteMany({});
    console.log(`✅ Cleared ${cardActivations.count} card activations`);

    // 7. Clear medical certificates
    const medicalCertificates = await prisma.medicalCertificate.deleteMany({});
    console.log(`✅ Cleared ${medicalCertificates.count} medical certificates`);

    // 8. Clear diagnosis notes
    const diagnosisNotes = await prisma.diagnosisNotes.deleteMany({});
    console.log(`✅ Cleared ${diagnosisNotes.count} diagnosis notes`);

    // 9. Clear virtual queue
    const virtualQueues = await prisma.virtualQueue.deleteMany({});
    console.log(`✅ Cleared ${virtualQueues.count} virtual queue entries`);

    // 10. Clear detailed lab results
    const detailedLabResults = await prisma.detailedLabResult.deleteMany({});
    console.log(`✅ Cleared ${detailedLabResults.count} detailed lab results`);

    // 11. Clear nurse service assignments
    const nurseServiceAssignments = await prisma.nurseServiceAssignment.deleteMany({});
    console.log(`✅ Cleared ${nurseServiceAssignments.count} nurse service assignments`);

    // 12. Clear dispensed medicines first (must be before pharmacy invoices)
    const dispensedMedicines = await prisma.dispensedMedicine.deleteMany({});
    console.log(`✅ Cleared ${dispensedMedicines.count} dispensed medicines`);

    // 13. Clear pharmacy invoice items (must be before pharmacy invoices)
    const pharmacyInvoiceItems = await prisma.pharmacyInvoiceItem.deleteMany({});
    console.log(`✅ Cleared ${pharmacyInvoiceItems.count} pharmacy invoice items`);

    // 14. Clear all pharmacy invoices (including walk-in sales)
    const pharmacyInvoices = await prisma.pharmacyInvoice.deleteMany({});
    console.log(`✅ Cleared ${pharmacyInvoices.count} pharmacy invoices (including walk-in sales)`);

    // 15. Clear cash transactions (all patient-related and billing transactions)
    const cashTransactions = await prisma.cashTransaction.deleteMany({
      where: {
        OR: [
          { description: { contains: 'PAT-' } },
          { description: { contains: 'Billing' } },
          { description: { contains: 'Payment' } },
          { description: { contains: 'Invoice' } },
          { description: { contains: 'Walk-in' } }
        ]
      }
    });
    console.log(`✅ Cleared ${cashTransactions.count} patient-related cash transactions`);

    // 16. Clear dispense logs
    const dispenseLogs = await prisma.dispenseLog.deleteMany({});
    console.log(`✅ Cleared ${dispenseLogs.count} dispense logs`);

    // 17. Clear nurse administrations (must be before continuous infusions)
    const nurseAdministrations = await prisma.nurseAdministration.deleteMany({});
    console.log(`✅ Cleared ${nurseAdministrations.count} nurse administrations`);

    // 18. Clear continuous infusions (must be before medication orders)
    const continuousInfusions = await prisma.continuousInfusion.deleteMany({});
    console.log(`✅ Cleared ${continuousInfusions.count} continuous infusions`);

    // 19. Clear medication orders
    const medicationOrders = await prisma.medicationOrder.deleteMany({});
    console.log(`✅ Cleared ${medicationOrders.count} medication orders`);

    // 18. Clear lab results
    const labResults = await prisma.labResult.deleteMany({});
    console.log(`✅ Cleared ${labResults.count} lab results`);

    // 19. Clear lab result files
    const labResultFiles = await prisma.labResultFile.deleteMany({});
    console.log(`✅ Cleared ${labResultFiles.count} lab result files`);

    // 20. Clear radiology result files (must be before radiology results)
    const radiologyResultFiles = await prisma.radiologyResultFile.deleteMany({});
    console.log(`✅ Cleared ${radiologyResultFiles.count} radiology result files`);

    // 21. Clear radiology results
    const radiologyResults = await prisma.radiologyResult.deleteMany({});
    console.log(`✅ Cleared ${radiologyResults.count} radiology results`);

    // 22. Clear lab orders
    const labOrders = await prisma.labOrder.deleteMany({});
    console.log(`✅ Cleared ${labOrders.count} lab orders`);

    // 23. Clear radiology orders
    const radiologyOrders = await prisma.radiologyOrder.deleteMany({});
    console.log(`✅ Cleared ${radiologyOrders.count} radiology orders`);

    // 24. Clear dental procedure completions (must be before batch order services)
    const dentalProcedureCompletions = await prisma.dentalProcedureCompletion.deleteMany({});
    console.log(`✅ Cleared ${dentalProcedureCompletions.count} dental procedure completions`);

    // 25. Clear batch order services
    const batchOrderServices = await prisma.batchOrderService.deleteMany({});
    console.log(`✅ Cleared ${batchOrderServices.count} batch order services`);

    // 26. Clear batch orders
    const batchOrders = await prisma.batchOrder.deleteMany({});
    console.log(`✅ Cleared ${batchOrders.count} batch orders`);

    // 27. Clear bill payments
    const billPayments = await prisma.billPayment.deleteMany({});
    console.log(`✅ Cleared ${billPayments.count} bill payments`);

    // 28. Clear billing services
    const billingServices = await prisma.billingService.deleteMany({});
    console.log(`✅ Cleared ${billingServices.count} billing services`);

    // 29. Clear billings
    const billings = await prisma.billing.deleteMany({});
    console.log(`✅ Cleared ${billings.count} billings`);

    // 30. Clear medical history
    const medicalHistory = await prisma.medicalHistory.deleteMany({});
    console.log(`✅ Cleared ${medicalHistory.count} medical history records`);

    // 31. Clear files
    const files = await prisma.file.deleteMany({});
    console.log(`✅ Cleared ${files.count} files`);

    // 32. Clear dental photos
    const dentalPhotos = await prisma.dentalPhoto.deleteMany({});
    console.log(`✅ Cleared ${dentalPhotos.count} dental photos`);

    // 33. Clear dental records
    const dentalRecords = await prisma.dentalRecord.deleteMany({});
    console.log(`✅ Cleared ${dentalRecords.count} dental records`);

    // 34. Clear appointments
    const appointments = await prisma.appointment.deleteMany({});
    console.log(`✅ Cleared ${appointments.count} appointments`);

    // 35. Clear assignments
    const assignments = await prisma.assignment.deleteMany({});
    console.log(`✅ Cleared ${assignments.count} assignments`);

    // 36. Clear vitals
    const vitals = await prisma.vitalSign.deleteMany({});
    console.log(`✅ Cleared ${vitals.count} vital signs`);

    // 37. Clear visits
    const visits = await prisma.visit.deleteMany({});
    console.log(`✅ Cleared ${visits.count} visits`);

    // 38. Finally, clear patients
    const patients = await prisma.patient.deleteMany({});
    console.log(`✅ Cleared ${patients.count} patients`);

    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL Patient Data Cleared Successfully!');
    console.log('='.repeat(60));
    console.log('\n📋 Preserved Data:');
    console.log('  ✅ Users (admin, nurses, doctors, reception, billing, etc.)');
    console.log('  ✅ Services and pricing');
    console.log('  ✅ Lab test templates');
    console.log('  ✅ Medication catalog');
    console.log('  ✅ Investigation types');
    console.log('  ✅ Insurance companies');
    console.log('  ✅ Departments');
    console.log('  ✅ System settings');
    console.log('  ✅ Audit logs');
    console.log('  ✅ Inventory');
    console.log('\n🗑️  Removed Data:');
    console.log('  ❌ All patient records');
    console.log('  ❌ All visits and assignments');
    console.log('  ❌ All billing and payment records');
    console.log('  ❌ All lab/radiology orders and results');
    console.log('  ❌ All dental records and photos');
    console.log('  ❌ All medication orders and dispensing');
    console.log('  ❌ All appointments and queue entries');
    console.log('  ❌ All medical history and certificates');
    console.log('  ❌ All patient accounts and transactions');
    console.log('  ❌ All patient images and galleries');
    console.log('  ❌ All diagnosis notes');
    console.log('  ❌ All card activations');
    console.log('\n✨ System is now clean and ready for updates!');

  } catch (error) {
    console.error('\n❌ Error clearing patient data:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearPatientData();
