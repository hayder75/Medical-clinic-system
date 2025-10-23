const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...');
  
  try {
    // Delete in order to respect foreign key constraints
    
    // 1. Delete patient-related data first
    console.log('📋 Deleting patient-related data...');
    
    await prisma.patientAttachedImage.deleteMany();
    console.log('✅ Deleted PatientAttachedImage records');
    
    await prisma.dentalPhoto.deleteMany();
    console.log('✅ Deleted DentalPhoto records');
    
    await prisma.dentalRecord.deleteMany();
    console.log('✅ Deleted DentalRecord records');
    
    await prisma.tooth.deleteMany();
    console.log('✅ Deleted Tooth records');
    
    await prisma.diagnosisNotes.deleteMany();
    console.log('✅ Deleted DiagnosisNotes records');
    
    await prisma.medicalCertificate.deleteMany();
    console.log('✅ Deleted MedicalCertificate records');
    
    await prisma.medicalHistory.deleteMany();
    console.log('✅ Deleted MedicalHistory records');
    
    await prisma.vitalSign.deleteMany();
    console.log('✅ Deleted VitalSign records');
    
    await prisma.nurseServiceAssignment.deleteMany();
    console.log('✅ Deleted NurseServiceAssignment records');
    
    await prisma.nurseAdministration.deleteMany();
    console.log('✅ Deleted NurseAdministration records');
    
    await prisma.continuousInfusion.deleteMany();
    console.log('✅ Deleted ContinuousInfusion records');
    
    // 2. Delete billing and financial data
    console.log('💰 Deleting billing and financial data...');
    
    await prisma.dispensedMedicine.deleteMany();
    console.log('✅ Deleted DispensedMedicine records');
    
    await prisma.pharmacyInvoiceItem.deleteMany();
    console.log('✅ Deleted PharmacyInvoiceItem records');
    
    await prisma.pharmacyInvoice.deleteMany();
    console.log('✅ Deleted PharmacyInvoice records');
    
    await prisma.medicationOrder.deleteMany();
    console.log('✅ Deleted MedicationOrder records');
    
    await prisma.dispenseLog.deleteMany();
    console.log('✅ Deleted DispenseLog records');
    
    await prisma.billingService.deleteMany();
    console.log('✅ Deleted BillingService records');
    
    await prisma.billPayment.deleteMany();
    console.log('✅ Deleted BillPayment records');
    
    await prisma.billing.deleteMany();
    console.log('✅ Deleted Billing records');
    
    // 3. Delete orders and results
    console.log('🔬 Deleting orders and results...');
    
    await prisma.detailedLabResult.deleteMany();
    console.log('✅ Deleted DetailedLabResult records');
    
    await prisma.labResultFile.deleteMany();
    console.log('✅ Deleted LabResultFile records');
    
    await prisma.labResult.deleteMany();
    console.log('✅ Deleted LabResult records');
    
    await prisma.radiologyResultFile.deleteMany();
    console.log('✅ Deleted RadiologyResultFile records');
    
    await prisma.radiologyResult.deleteMany();
    console.log('✅ Deleted RadiologyResult records');
    
    await prisma.batchOrderService.deleteMany();
    console.log('✅ Deleted BatchOrderService records');
    
    await prisma.batchOrder.deleteMany();
    console.log('✅ Deleted BatchOrder records');
    
    await prisma.labOrder.deleteMany();
    console.log('✅ Deleted LabOrder records');
    
    await prisma.radiologyOrder.deleteMany();
    console.log('✅ Deleted RadiologyOrder records');
    
    // 4. Delete appointments and queue
    console.log('📅 Deleting appointments and queue...');
    
    await prisma.appointment.deleteMany();
    console.log('✅ Deleted Appointment records');
    
    await prisma.virtualQueue.deleteMany();
    console.log('✅ Deleted VirtualQueue records');
    
    // 5. Delete visits and assignments
    console.log('🏥 Deleting visits and assignments...');
    
    await prisma.assignment.deleteMany();
    console.log('✅ Deleted Assignment records');
    
    await prisma.visit.deleteMany();
    console.log('✅ Deleted Visit records');
    
    // 6. Delete files that reference patients
    console.log('📁 Deleting patient-related files...');
    
    await prisma.file.deleteMany();
    console.log('✅ Deleted patient-related File records');
    
    // 7. Finally delete patients
    console.log('👥 Deleting patient records...');
    
    await prisma.patient.deleteMany();
    console.log('✅ Deleted Patient records');
    
    console.log('🎉 Database cleanup completed successfully!');
    console.log('');
    console.log('📊 Summary of what was kept:');
    console.log('✅ Users (doctors, nurses, admins)');
    console.log('✅ Services and pricing');
    console.log('✅ Insurance companies');
    console.log('✅ Investigation types');
    console.log('✅ Departments');
    console.log('✅ Medication catalog');
    console.log('✅ Inventory');
    console.log('✅ Audit logs');
    console.log('✅ Lab test templates');
    console.log('✅ System files');
    console.log('');
    console.log('🗑️ Summary of what was deleted:');
    console.log('❌ All patient records');
    console.log('❌ All visits and assignments');
    console.log('❌ All billing and payment records');
    console.log('❌ All lab/radiology orders and results');
    console.log('❌ All dental records');
    console.log('❌ All medication orders and dispensing');
    console.log('❌ All appointments and queue entries');
    console.log('❌ All nurse service assignments');
    console.log('❌ All medical history and certificates');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase()
  .then(() => {
    console.log('✅ Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  });
