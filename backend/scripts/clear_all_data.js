const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllData() {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // Delete in reverse order of dependencies
    console.log('1. Deleting RadiologyResultFiles...');
    await prisma.radiologyResultFile.deleteMany({});
    console.log('✅ RadiologyResultFiles deleted');

    console.log('2. Deleting RadiologyResults...');
    await prisma.radiologyResult.deleteMany({});
    console.log('✅ RadiologyResults deleted');

    console.log('3. Deleting LabResultFiles...');
    await prisma.labResultFile.deleteMany({});
    console.log('✅ LabResultFiles deleted');

    console.log('4. Deleting LabResults...');
    await prisma.labResult.deleteMany({});
    console.log('✅ LabResults deleted');

    console.log('5. Deleting Files...');
    await prisma.file.deleteMany({});
    console.log('✅ Files deleted');

    console.log('6. Deleting DispensedMedicines...');
    await prisma.dispensedMedicine.deleteMany({});
    console.log('✅ DispensedMedicines deleted');

    console.log('7. Deleting PharmacyInvoices...');
    await prisma.pharmacyInvoice.deleteMany({});
    console.log('✅ PharmacyInvoices deleted');

    console.log('8. Deleting MedicationOrders...');
    await prisma.medicationOrder.deleteMany({});
    console.log('✅ MedicationOrders deleted');

    console.log('9. Deleting RadiologyOrders...');
    await prisma.radiologyOrder.deleteMany({});
    console.log('✅ RadiologyOrders deleted');

    console.log('10. Deleting LabOrders...');
    await prisma.labOrder.deleteMany({});
    console.log('✅ LabOrders deleted');

    console.log('11. Deleting BatchOrderServices...');
    await prisma.batchOrderService.deleteMany({});
    console.log('✅ BatchOrderServices deleted');

    console.log('12. Deleting BatchOrders...');
    await prisma.batchOrder.deleteMany({});
    console.log('✅ BatchOrders deleted');

    console.log('13. Deleting NurseAdministrations...');
    await prisma.nurseAdministration.deleteMany({});
    console.log('✅ NurseAdministrations deleted');

    console.log('14. Deleting AuditLogs...');
    await prisma.auditLog.deleteMany({});
    console.log('✅ AuditLogs deleted');

    console.log('15. Deleting BillPayments...');
    await prisma.billPayment.deleteMany({});
    console.log('✅ BillPayments deleted');

    console.log('16. Deleting BillingServices...');
    await prisma.billingService.deleteMany({});
    console.log('✅ BillingServices deleted');

    console.log('17. Deleting Billings...');
    await prisma.billing.deleteMany({});
    console.log('✅ Billings deleted');

    console.log('18. Deleting Visits...');
    await prisma.visit.deleteMany({});
    console.log('✅ Visits deleted');

    console.log('19. Deleting VitalSigns...');
    await prisma.vitalSign.deleteMany({});
    console.log('✅ VitalSigns deleted');

    console.log('20. Deleting Assignments...');
    await prisma.assignment.deleteMany({});
    console.log('✅ Assignments deleted');

    console.log('21. Deleting Patients...');
    await prisma.patient.deleteMany({});
    console.log('✅ Patients deleted');

    console.log('22. Deleting Appointments...');
    await prisma.appointment.deleteMany({});
    console.log('✅ Appointments deleted');

    console.log('23. Deleting ContinuousInfusions...');
    await prisma.continuousInfusion.deleteMany({});
    console.log('✅ ContinuousInfusions deleted');

    console.log('24. Deleting MedicalHistories...');
    await prisma.medicalHistory.deleteMany({});
    console.log('✅ MedicalHistories deleted');

    console.log('25. Deleting DentalRecords...');
    await prisma.dentalRecord.deleteMany({});
    console.log('✅ DentalRecords deleted');

    console.log('26. Deleting Teeth...');
    await prisma.tooth.deleteMany({});
    console.log('✅ Teeth deleted');

    console.log('27. Deleting Inventories...');
    await prisma.inventory.deleteMany({});
    console.log('✅ Inventories deleted');

    console.log('28. Deleting DispenseLogs...');
    await prisma.dispenseLog.deleteMany({});
    console.log('✅ DispenseLogs deleted');

    console.log('\n🎉 Database cleanup completed successfully!');
    console.log('All test data and patients have been removed.');
    console.log('You can now test the system with fresh data.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
clearAllData();
