const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupDatabase() {
  console.log('💾 Creating database backup...');
  
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  try {
    // Get all data from all tables
    const backupData = {
      timestamp: new Date().toISOString(),
      users: await prisma.user.findMany(),
      services: await prisma.service.findMany(),
      insurances: await prisma.insurance.findMany(),
      investigationTypes: await prisma.investigationType.findMany(),
      departments: await prisma.department.findMany(),
      medicationCatalogs: await prisma.medicationCatalog.findMany(),
      inventories: await prisma.inventory.findMany(),
      auditLogs: await prisma.auditLog.findMany(),
      labTestTemplates: await prisma.labTestTemplate.findMany(),
      files: await prisma.file.findMany(),
      patients: await prisma.patient.findMany(),
      visits: await prisma.visit.findMany(),
      assignments: await prisma.assignment.findMany(),
      billings: await prisma.billing.findMany(),
      billPayments: await prisma.billPayment.findMany(),
      pharmacyInvoices: await prisma.pharmacyInvoice.findMany(),
      pharmacyInvoiceItems: await prisma.pharmacyInvoiceItem.findMany(),
      dispensedMedicines: await prisma.dispensedMedicine.findMany(),
      medicationOrders: await prisma.medicationOrder.findMany(),
      labOrders: await prisma.labOrder.findMany(),
      radiologyOrders: await prisma.radiologyOrder.findMany(),
      labResults: await prisma.labResult.findMany(),
      radiologyResults: await prisma.radiologyResult.findMany(),
      dentalRecords: await prisma.dentalRecord.findMany(),
      medicalHistories: await prisma.medicalHistory.findMany(),
      appointments: await prisma.appointment.findMany(),
      virtualQueues: await prisma.virtualQueue.findMany(),
      nurseServiceAssignments: await prisma.nurseServiceAssignment.findMany(),
      continuousInfusions: await prisma.continuousInfusion.findMany(),
      nurseAdministrations: await prisma.nurseAdministration.findMany(),
      vitalSigns: await prisma.vitalSign.findMany(),
      diagnosisNotes: await prisma.diagnosisNotes.findMany(),
      medicalCertificates: await prisma.medicalCertificate.findMany(),
      dentalPhotos: await prisma.dentalPhoto.findMany(),
      patientAttachedImages: await prisma.patientAttachedImage.findMany(),
      teeth: await prisma.tooth.findMany(),
      batchOrders: await prisma.batchOrder.findMany(),
      batchOrderServices: await prisma.batchOrderService.findMany(),
      labResultFiles: await prisma.labResultFile.findMany(),
      radiologyResultFiles: await prisma.radiologyResultFile.findMany(),
      detailedLabResults: await prisma.detailedLabResult.findMany(),
      dispenseLogs: await prisma.dispenseLog.findMany(),
      billingServices: await prisma.billingService.findMany()
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Backup created successfully: ${backupFile}`);
    console.log(`📊 Backup contains ${Object.keys(backupData).length} tables`);
    
    // Show counts
    Object.entries(backupData).forEach(([table, data]) => {
      if (Array.isArray(data)) {
        console.log(`   ${table}: ${data.length} records`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the backup
backupDatabase()
  .then(() => {
    console.log('✅ Backup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Backup script failed:', error);
    process.exit(1);
  });


