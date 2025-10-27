const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function exportAllData() {
  try {
    console.log('🚀 Starting comprehensive data export...');

    // Export all tables
    const tables = [
      'User',
      'Service', 
      'Insurance',
      'InvestigationType',
      'LabTemplate',
      'Medication',
      'Patient',
      'Visit',
      'Billing',
      'Appointment',
      'Doctor',
      'Nurse',
      'Receptionist',
      'LabTechnician',
      'Radiologist',
      'Pharmacist',
      'DentalPhoto',
      'PatientAttachedImage',
      'PatientGallery',
      'MedicalCertificate',
      'ContinuousInfusion',
      'EmergencyBilling',
      'Emergency',
      'CashManagement',
      'AuditLog',
      'BatchOrder',
      'BatchOrderService',
      'NurseServiceAssignment',
      'Inventory',
      'MedicationOrder',
      'DispenseLog',
      'InsuranceTransaction'
    ];

    const exportData = {};

    for (const table of tables) {
      try {
        console.log(`📊 Exporting ${table}...`);
        const data = await prisma[table.toLowerCase()].findMany();
        exportData[table] = data;
        console.log(`✅ ${table}: ${data.length} records`);
      } catch (error) {
        console.log(`⚠️  ${table}: ${error.message}`);
        exportData[table] = [];
      }
    }

    // Save to file
    const filename = `complete-database-export-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
    
    console.log(`\n🎉 Export completed!`);
    console.log(`📁 File saved: ${filename}`);
    console.log(`📊 Total tables exported: ${Object.keys(exportData).length}`);
    
    // Show summary
    console.log('\n📋 Export Summary:');
    Object.entries(exportData).forEach(([table, data]) => {
      if (data.length > 0) {
        console.log(`  ${table}: ${data.length} records`);
      }
    });

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportAllData();

