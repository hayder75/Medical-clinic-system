const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function seedCompleteSystem() {
  try {
    console.log('🌱 Starting complete system seeding...\n');

    const backupFile = path.resolve(__dirname, '../system-backup.json');
    
    if (!fs.existsSync(backupFile)) {
      console.error(`❌ Backup file not found: ${backupFile}`);
      console.error('   Please make sure system-backup.json exists in the backend folder.');
      process.exit(1);
    }

    const systemData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));

    // Filter out DOCTOR users - client will create doctors themselves
    const nonDoctorUsers = (systemData.users || []).filter(user => user.role !== 'DOCTOR');

    console.log('📊 Seeding Summary:');
    console.log(`   Users (excluding doctors): ${nonDoctorUsers.length}`);
    console.log(`   Services: ${systemData.services?.length || 0}`);
    console.log(`   Lab Templates: ${systemData.labTestTemplates?.length || 0}`);
    console.log(`   Investigation Types: ${systemData.investigationTypes?.length || 0}`);
    console.log(`   Departments: ${systemData.departments?.length || 0}`);
    console.log(`   Insurances: ${systemData.insurances?.length || 0}`);
    console.log(`   Medications: ${systemData.medicationCatalog?.length || 0}`);
    console.log(`   Inventory Items: ${systemData.inventory?.length || 0}`);
    console.log(`   System Settings: ${systemData.systemSettings?.length || 0}`);
    console.log(`   Teeth Data: ${systemData.teeth?.length || 0}\n`);

    // 1. Restore Users (excluding doctors)
    console.log('1️⃣  Seeding users (excluding doctors)...');
    let userCount = 0;
    for (const user of nonDoctorUsers) {
      try {
        await prisma.user.upsert({
          where: { username: user.username },
          update: {
            password: user.password,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive !== false,
            availability: user.availability !== false,
            specialties: user.specialties || []
          },
          create: {
            id: user.id,
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive !== false,
            availability: user.availability !== false,
            specialties: user.specialties || []
          }
        });
        userCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed user ${user.username}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${userCount} users\n`);

    // 2. Restore Services
    console.log('2️⃣  Seeding services...');
    let serviceCount = 0;
    for (const service of systemData.services || []) {
      try {
        await prisma.service.upsert({
          where: { code: service.code },
          update: {
            name: service.name,
            category: service.category,
            price: service.price || 0,
            description: service.description || '',
            isActive: service.isActive !== false,
            unit: service.unit || null
          },
          create: {
            code: service.code,
            name: service.name,
            category: service.category,
            price: service.price || 0,
            description: service.description || '',
            isActive: service.isActive !== false,
            unit: service.unit || null
          }
        });
        serviceCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed service ${service.code}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${serviceCount} services\n`);

    // 3. Restore Investigation Types
    console.log('3️⃣  Seeding investigation types...');
    let invCount = 0;
    for (const inv of systemData.investigationTypes || []) {
      try {
        const matchingService = await prisma.service.findFirst({
          where: { name: inv.name }
        });
        
        if (matchingService) {
          await prisma.investigationType.upsert({
            where: { id: inv.id },
            update: {
              name: inv.name,
              price: inv.price,
              category: inv.category,
              serviceId: matchingService.id
            },
            create: {
              id: inv.id,
              name: inv.name,
              price: inv.price,
              category: inv.category,
              serviceId: matchingService.id
            }
          });
          invCount++;
        }
      } catch (error) {
        console.log(`⚠️  Failed to seed investigation ${inv.name}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${invCount} investigation types\n`);

    // 4. Restore Lab Templates
    console.log('4️⃣  Seeding lab templates...');
    let templateCount = 0;
    for (const template of systemData.labTestTemplates || []) {
      try {
        await prisma.labTestTemplate.upsert({
          where: { id: template.id },
          update: {
            name: template.name,
            category: template.category,
            description: template.description || '',
            fields: template.fields || {},
            isActive: template.isActive !== false
          },
          create: {
            id: template.id,
            name: template.name,
            category: template.category,
            description: template.description || '',
            fields: template.fields || {},
            isActive: template.isActive !== false
          }
        });
        templateCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed template ${template.name}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${templateCount} lab templates\n`);

    // 5. Restore Departments
    console.log('5️⃣  Seeding departments...');
    let deptCount = 0;
    for (const dept of systemData.departments || []) {
      try {
        await prisma.department.upsert({
          where: { id: dept.id },
          update: {
            name: dept.name,
            description: dept.description || ''
          },
          create: {
            id: dept.id,
            name: dept.name,
            description: dept.description || ''
          }
        });
        deptCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed department ${dept.name}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${deptCount} departments\n`);

    // 6. Restore Insurances
    console.log('6️⃣  Seeding insurances...');
    let insuranceCount = 0;
    for (const insurance of systemData.insurances || []) {
      try {
        await prisma.insurance.upsert({
          where: { id: insurance.id },
          update: {
            name: insurance.name,
            code: insurance.code,
            isActive: insurance.isActive !== false
          },
          create: {
            id: insurance.id,
            name: insurance.name,
            code: insurance.code,
            isActive: insurance.isActive !== false
          }
        });
        insuranceCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed insurance ${insurance.name}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${insuranceCount} insurances\n`);

    // 7. Restore Medication Catalog
    console.log('7️⃣  Seeding medication catalog...');
    let medCount = 0;
    for (const med of systemData.medicationCatalog || []) {
      try {
        await prisma.medicationCatalog.upsert({
          where: { id: med.id },
          update: {
            name: med.name,
            genericName: med.genericName,
            dosageForm: med.dosageForm,
            strength: med.strength,
            category: med.category,
            unitPrice: med.unitPrice,
            availableQuantity: med.availableQuantity || 0,
            minimumStock: med.minimumStock || 0,
            unit: med.unit || null,
            packSize: med.packSize || null,
            manufacturer: med.manufacturer || null
          },
          create: {
            id: med.id,
            name: med.name,
            genericName: med.genericName,
            dosageForm: med.dosageForm,
            strength: med.strength,
            category: med.category,
            unitPrice: med.unitPrice,
            availableQuantity: med.availableQuantity || 0,
            minimumStock: med.minimumStock || 0,
            unit: med.unit || null,
            packSize: med.packSize || null,
            manufacturer: med.manufacturer || null
          }
        });
        medCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed medication ${med.name}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${medCount} medications\n`);

    // 8. Restore Inventory
    console.log('8️⃣  Seeding inventory...');
    let invItemCount = 0;
    for (const item of systemData.inventory || []) {
      try {
        await prisma.inventory.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            category: item.category,
            quantity: item.quantity || 0,
            unit: item.unit || '',
            price: item.price || 0,
            supplier: item.supplier || null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            lowStockThreshold: item.lowStockThreshold || 0
          },
          create: {
            id: item.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity || 0,
            unit: item.unit || '',
            price: item.price || 0,
            supplier: item.supplier || null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            lowStockThreshold: item.lowStockThreshold || 0
          }
        });
        invItemCount++;
      } catch (error) {
        console.log(`⚠️  Failed to seed inventory item ${item.name}: ${error.message}`);
      }
    }
    console.log(`✅ Seeded ${invItemCount} inventory items\n`);

    // 9. Restore System Settings
    if (systemData.systemSettings && systemData.systemSettings.length > 0) {
      console.log('9️⃣  Seeding system settings...');
      let settingsCount = 0;
      for (const setting of systemData.systemSettings) {
        try {
          await prisma.systemSettings.upsert({
            where: { key: setting.key },
            update: {
              value: setting.value,
              description: setting.description || null
            },
            create: {
              key: setting.key,
              value: setting.value,
              description: setting.description || null
            }
          });
          settingsCount++;
        } catch (error) {
          console.log(`⚠️  Failed to seed setting ${setting.key}: ${error.message}`);
        }
      }
      console.log(`✅ Seeded ${settingsCount} system settings\n`);
    }

    // 10. Restore Teeth Data
    if (systemData.teeth && systemData.teeth.length > 0) {
      console.log('🔟 Seeding teeth data...');
      let teethCount = 0;
      for (const tooth of systemData.teeth) {
        try {
          await prisma.tooth.upsert({
            where: { id: tooth.id },
            update: {
              number: tooth.number,
              eruptionStart: tooth.eruptionStart,
              eruptionEnd: tooth.eruptionEnd,
              rootCompletion: tooth.rootCompletion
            },
            create: {
              id: tooth.id,
              number: tooth.number,
              eruptionStart: tooth.eruptionStart,
              eruptionEnd: tooth.eruptionEnd,
              rootCompletion: tooth.rootCompletion
            }
          });
          teethCount++;
        } catch (error) {
          console.log(`⚠️  Failed to seed tooth ${tooth.number}: ${error.message}`);
        }
      }
      console.log(`✅ Seeded ${teethCount} teeth records\n`);
    }

    console.log('='.repeat(60));
    console.log('🎉 Complete System Seeding Finished!');
    console.log('='.repeat(60));
    console.log('\n📊 Final Summary:');
    console.log(`   ✅ Users (excluding doctors): ${userCount}`);
    console.log(`   ✅ Services: ${serviceCount}`);
    console.log(`   ✅ Lab Templates: ${templateCount}`);
    console.log(`   ✅ Investigation Types: ${invCount}`);
    console.log(`   ✅ Departments: ${deptCount}`);
    console.log(`   ✅ Insurances: ${insuranceCount}`);
    console.log(`   ✅ Medications: ${medCount}`);
    console.log(`   ✅ Inventory Items: ${invItemCount}`);
    console.log(`   ✅ System Settings: ${systemData.systemSettings?.length || 0}`);
    console.log(`   ✅ Teeth Data: ${systemData.teeth?.length || 0}`);
    console.log('\n📝 Note: Doctors are NOT seeded. Create them through the admin panel.');

  } catch (error) {
    console.error('❌ Error seeding system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedCompleteSystem();

