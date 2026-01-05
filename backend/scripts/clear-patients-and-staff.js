const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearPatientsAndStaff() {
  try {
    console.log('🗑️  Starting cleanup: Patients, Staff, Audits, and Billing Data...\n');
    
    // 1. Delete Audit Logs
    console.log('1. Deleting audit logs...');
    await prisma.auditLog.deleteMany();
    console.log('   ✓ Audit logs deleted\n');
    
    // 2. Delete Cash Management Data
    console.log('2. Deleting cash management data...');
    await prisma.cashExpense.deleteMany();
    await prisma.bankDeposit.deleteMany();
    await prisma.cashTransaction.deleteMany();
    await prisma.dailyCashSession.deleteMany();
    console.log('   ✓ Cash management data deleted\n');
    
    // 3. Delete Account Transactions
    console.log('3. Deleting account transactions...');
    await prisma.accountTransaction.deleteMany();
    await prisma.accountDeposit.deleteMany();
    await prisma.accountRequest.deleteMany();
    await prisma.patientAccount.deleteMany();
    console.log('   ✓ Account transactions deleted\n');
    
    // 4. Delete Billing Data
    console.log('4. Deleting billing data...');
    await prisma.billPayment.deleteMany();
    await prisma.billingService.deleteMany();
    await prisma.billing.deleteMany();
    console.log('   ✓ Billing data deleted\n');
    
    // 5. Delete Pharmacy Invoices
    console.log('5. Deleting pharmacy invoices...');
    await prisma.pharmacyInvoice.deleteMany();
    console.log('   ✓ Pharmacy invoices deleted\n');
    
    // 6. Delete Insurance Transactions
    console.log('6. Deleting insurance transactions...');
    await prisma.insuranceTransaction.deleteMany();
    console.log('   ✓ Insurance transactions deleted\n');
    
    // 7. Delete Patient-Related Data (in correct order)
    console.log('7. Deleting patient-related data...');
    await prisma.dentalProcedureCompletion.deleteMany();
    await prisma.patientGallery.deleteMany();
    await prisma.patientAttachedImage.deleteMany();
    await prisma.dentalPhoto.deleteMany();
    await prisma.dentalRecord.deleteMany();
    await prisma.medicalCertificate.deleteMany();
    await prisma.diagnosisNotes.deleteMany();
    await prisma.medicalHistory.deleteMany();
    await prisma.cardActivation.deleteMany();
    await prisma.virtualQueue.deleteMany();
    await prisma.file.deleteMany();
    await prisma.nurseServiceAssignment.deleteMany();
    await prisma.nurseAdministration.deleteMany();
    await prisma.dispenseLog.deleteMany();
    await prisma.medicationOrder.deleteMany();
    await prisma.labResult.deleteMany();
    await prisma.radiologyResult.deleteMany();
    await prisma.detailedLabResult.deleteMany();
    await prisma.batchOrderService.deleteMany();
    await prisma.batchOrder.deleteMany();
    await prisma.labOrder.deleteMany();
    await prisma.radiologyOrder.deleteMany();
    await prisma.vitalSign.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.visit.deleteMany();
    console.log('   ✓ Patient-related data deleted\n');
    
    // 8. Delete Patients
    console.log('8. Deleting patients...');
    await prisma.patient.deleteMany();
    console.log('   ✓ Patients deleted\n');
    
    // 9. Delete Staff (Doctors, Reception, Nurses, etc. - includes Admin)
    console.log('9. Deleting staff (doctors, reception, nurses, admin, etc.)...');
    await prisma.user.deleteMany();
    console.log('   ✓ Staff deleted\n');
    
    console.log('========================================');
    console.log('✅ Cleanup completed successfully!');
    console.log('========================================');
    console.log('\nDeleted:');
    console.log('  - All patients');
    console.log('  - All staff (doctors, reception, nurses, admin)');
    console.log('  - All audit logs');
    console.log('  - All billing data and transactions');
    console.log('  - All cash management data');
    console.log('\n⚠️  NOTE: System data (services, insurance, etc.) is preserved.');
    console.log('⚠️  NOTE: You will need to create a new admin user.');
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Confirmation prompt
console.log('⚠️  WARNING: This will delete ALL:');
console.log('   - Patients');
console.log('   - Staff (doctors, reception, nurses, admin)');
console.log('   - Audit logs');
console.log('   - Billing data and transactions');
console.log('   - Cash management data');
console.log('\n⚠️  This action CANNOT be undone!');
console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n');

setTimeout(() => {
  clearPatientsAndStaff()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}, 3000);

