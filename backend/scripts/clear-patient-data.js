const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearPatientData() {
  try {
    console.log('🧹 Clearing patient data...');

    // Clear patient-related data in order (respecting foreign key constraints)
    
    // 1. Clear dispensed medicines
    const dispensedMedicines = await prisma.dispensedMedicine.deleteMany({});
    console.log(`✅ Cleared ${dispensedMedicines.count} dispensed medicines`);

    // 2. Clear pharmacy invoice items
    const pharmacyInvoiceItems = await prisma.pharmacyInvoiceItem.deleteMany({});
    console.log(`✅ Cleared ${pharmacyInvoiceItems.count} pharmacy invoice items`);

    // 3. Clear pharmacy invoices
    const pharmacyInvoices = await prisma.pharmacyInvoice.deleteMany({});
    console.log(`✅ Cleared ${pharmacyInvoices.count} pharmacy invoices`);

    // 4. Clear dispense logs
    const dispenseLogs = await prisma.dispenseLog.deleteMany({});
    console.log(`✅ Cleared ${dispenseLogs.count} dispense logs`);

    // 5. Clear medication orders
    const medicationOrders = await prisma.medicationOrder.deleteMany({});
    console.log(`✅ Cleared ${medicationOrders.count} medication orders`);

    // 6. Clear lab results
    const labResults = await prisma.labResult.deleteMany({});
    console.log(`✅ Cleared ${labResults.count} lab results`);

    // 7. Clear lab result files
    const labResultFiles = await prisma.labResultFile.deleteMany({});
    console.log(`✅ Cleared ${labResultFiles.count} lab result files`);

    // 8. Clear radiology results
    const radiologyResults = await prisma.radiologyResult.deleteMany({});
    console.log(`✅ Cleared ${radiologyResults.count} radiology results`);

    // 9. Clear radiology result files
    const radiologyResultFiles = await prisma.radiologyResultFile.deleteMany({});
    console.log(`✅ Cleared ${radiologyResultFiles.count} radiology result files`);

    // 10. Clear lab orders
    const labOrders = await prisma.labOrder.deleteMany({});
    console.log(`✅ Cleared ${labOrders.count} lab orders`);

    // 11. Clear radiology orders
    const radiologyOrders = await prisma.radiologyOrder.deleteMany({});
    console.log(`✅ Cleared ${radiologyOrders.count} radiology orders`);

    // 12. Clear batch order services
    const batchOrderServices = await prisma.batchOrderService.deleteMany({});
    console.log(`✅ Cleared ${batchOrderServices.count} batch order services`);

    // 13. Clear batch orders
    const batchOrders = await prisma.batchOrder.deleteMany({});
    console.log(`✅ Cleared ${batchOrders.count} batch orders`);

    // 14. Clear bill payments
    const billPayments = await prisma.billPayment.deleteMany({});
    console.log(`✅ Cleared ${billPayments.count} bill payments`);

    // 15. Clear billing services
    const billingServices = await prisma.billingService.deleteMany({});
    console.log(`✅ Cleared ${billingServices.count} billing services`);

    // 16. Clear billings
    const billings = await prisma.billing.deleteMany({});
    console.log(`✅ Cleared ${billings.count} billings`);

    // 17. Clear medical history
    const medicalHistory = await prisma.medicalHistory.deleteMany({});
    console.log(`✅ Cleared ${medicalHistory.count} medical history records`);

    // 18. Clear files
    const files = await prisma.file.deleteMany({});
    console.log(`✅ Cleared ${files.count} files`);

    // 19. Clear dental records
    const dentalRecords = await prisma.dentalRecord.deleteMany({});
    console.log(`✅ Cleared ${dentalRecords.count} dental records`);

    // 20. Clear appointments
    const appointments = await prisma.appointment.deleteMany({});
    console.log(`✅ Cleared ${appointments.count} appointments`);

    // 21. Clear assignments
    const assignments = await prisma.assignment.deleteMany({});
    console.log(`✅ Cleared ${assignments.count} assignments`);

    // 22. Clear nurse administrations
    const nurseAdministrations = await prisma.nurseAdministration.deleteMany({});
    console.log(`✅ Cleared ${nurseAdministrations.count} nurse administrations`);

    // 23. Clear continuous infusions
    const continuousInfusions = await prisma.continuousInfusion.deleteMany({});
    console.log(`✅ Cleared ${continuousInfusions.count} continuous infusions`);

    // 24. Clear vitals
    const vitals = await prisma.vitalSign.deleteMany({});
    console.log(`✅ Cleared ${vitals.count} vital signs`);

    // 25. Clear visits
    const visits = await prisma.visit.deleteMany({});
    console.log(`✅ Cleared ${visits.count} visits`);

    // 26. Finally, clear patients
    const patients = await prisma.patient.deleteMany({});
    console.log(`✅ Cleared ${patients.count} patients`);

    console.log('\n🎉 Patient data cleared successfully!');
    console.log('📋 Preserved data:');
    console.log('  - Users (admin, nurses, doctors, etc.)');
    console.log('  - Services');
    console.log('  - Medications');
    console.log('  - Investigation types');
    console.log('  - Insurance companies');
    console.log('  - Audit logs');

  } catch (error) {
    console.error('❌ Error clearing patient data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearPatientData();
