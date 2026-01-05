const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function backupSystemData() {
  try {
    console.log('💾 Creating complete system backup...\n');

    // Export all system data (excluding patient data)
    const systemData = {
      meta: {
        generatedAt: new Date().toISOString(),
        note: 'Complete system backup - includes all configuration, users, services, templates, medications, etc.'
      },
      users: await prisma.user.findMany({
        select: {
          id: true,
          username: true,
          password: true, // Include password hashes
          fullname: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          availability: true,
          specialties: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      services: await prisma.service.findMany(),
      investigationTypes: await prisma.investigationType.findMany(),
      labTestTemplates: await prisma.labTestTemplate.findMany(),
      departments: await prisma.department.findMany(),
      insurances: await prisma.insurance.findMany(),
      medicationCatalog: await prisma.medicationCatalog.findMany(),
      inventory: await prisma.inventory.findMany(),
      systemSettings: await prisma.systemSettings.findMany().catch(() => []),
      teeth: await prisma.tooth.findMany().catch(() => [])
    };

    const backupFile = path.resolve(__dirname, '../system-backup.json');
    fs.writeFileSync(backupFile, JSON.stringify(systemData, null, 2));

    console.log('✅ System backup created successfully!');
    console.log(`📁 File: ${backupFile}`);
    console.log(`\n📊 Backup Summary:`);
    console.log(`   Users: ${systemData.users.length}`);
    console.log(`   Services: ${systemData.services.length}`);
    console.log(`   Lab Templates: ${systemData.labTestTemplates.length}`);
    console.log(`   Investigation Types: ${systemData.investigationTypes.length}`);
    console.log(`   Departments: ${systemData.departments.length}`);
    console.log(`   Insurances: ${systemData.insurances.length}`);
    console.log(`   Medications: ${systemData.medicationCatalog.length}`);
    console.log(`   Inventory Items: ${systemData.inventory.length}`);
    console.log(`   System Settings: ${systemData.systemSettings.length}`);
    console.log(`   Teeth Data: ${systemData.teeth.length}`);

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

backupSystemData();

