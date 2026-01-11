const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedNewServiceCategories() {
  console.log('🌱 Seeding new service categories (NURSE_WALKIN, EMERGENCY_DRUG, MATERIAL_NEEDS)...\n');

  try {
    // NURSE_WALKIN Services
    console.log('1️⃣  Seeding NURSE_WALKIN services...');
    const nurseWalkInServices = [
      {
        name: 'Blood Pressure Check (Walk-in)',
        code: 'NWALK001',
        category: 'NURSE_WALKIN',
        price: 50.00,
        description: 'Blood pressure measurement for walk-in patients',
        isActive: true
      },
      {
        name: 'Temperature Check (Walk-in)',
        code: 'NWALK002',
        category: 'NURSE_WALKIN',
        price: 30.00,
        description: 'Temperature measurement for walk-in patients',
        isActive: true
      },
      {
        name: 'Bandage/Dressing (Walk-in)',
        code: 'NWALK003',
        category: 'NURSE_WALKIN',
        price: 100.00,
        description: 'Wound dressing and bandage application',
        isActive: true
      },
      {
        name: 'Injection Administration (Walk-in)',
        code: 'NWALK004',
        category: 'NURSE_WALKIN',
        price: 80.00,
        description: 'Injectable medication administration for walk-in patients',
        isActive: true
      }
    ];

    for (const service of nurseWalkInServices) {
      await prisma.service.upsert({
        where: { code: service.code },
        update: service,
        create: service
      });
    }
    console.log(`✅ Seeded ${nurseWalkInServices.length} NURSE_WALKIN services\n`);

    // EMERGENCY_DRUG Services
    console.log('2️⃣  Seeding EMERGENCY_DRUG services...');
    const emergencyDrugServices = [
      {
        name: 'Epinephrine (Adrenaline)',
        code: 'EMDRUG001',
        category: 'EMERGENCY_DRUG',
        price: 500.00,
        description: 'Emergency adrenaline injection for anaphylaxis',
        isActive: true
      },
      {
        name: 'Atropine Injection',
        code: 'EMDRUG002',
        category: 'EMERGENCY_DRUG',
        price: 300.00,
        description: 'Emergency atropine for bradycardia',
        isActive: true
      },
      {
        name: 'Morphine Injection',
        code: 'EMDRUG003',
        category: 'EMERGENCY_DRUG',
        price: 400.00,
        description: 'Emergency pain relief injection',
        isActive: true
      },
      {
        name: 'Diazepam Injection',
        code: 'EMDRUG004',
        category: 'EMERGENCY_DRUG',
        price: 350.00,
        description: 'Emergency sedative/anticonvulsant injection',
        isActive: true
      },
      {
        name: 'Salbutamol Nebulization',
        code: 'EMDRUG005',
        category: 'EMERGENCY_DRUG',
        price: 250.00,
        description: 'Emergency bronchodilator for asthma/COPD',
        isActive: true
      }
    ];

    for (const service of emergencyDrugServices) {
      await prisma.service.upsert({
        where: { code: service.code },
        update: service,
        create: service
      });
    }
    console.log(`✅ Seeded ${emergencyDrugServices.length} EMERGENCY_DRUG services\n`);

    // MATERIAL_NEEDS Services
    console.log('3️⃣  Seeding MATERIAL_NEEDS services...');
    const materialNeedsServices = [
      {
        name: 'Surgical Gloves (Box)',
        code: 'MAT001',
        category: 'MATERIAL_NEEDS',
        price: 150.00,
        description: 'Box of sterile surgical gloves',
        isActive: true,
        unit: 'box'
      },
      {
        name: 'Syringe 5ml (Pack)',
        code: 'MAT002',
        category: 'MATERIAL_NEEDS',
        price: 80.00,
        description: 'Pack of 5ml syringes',
        isActive: true,
        unit: 'pack'
      },
      {
        name: 'Gauze Pads (Pack)',
        code: 'MAT003',
        category: 'MATERIAL_NEEDS',
        price: 120.00,
        description: 'Sterile gauze pads pack',
        isActive: true,
        unit: 'pack'
      },
      {
        name: 'IV Cannula 18G',
        code: 'MAT004',
        category: 'MATERIAL_NEEDS',
        price: 200.00,
        description: '18G intravenous cannula',
        isActive: true,
        unit: 'piece'
      },
      {
        name: 'Medical Tape',
        code: 'MAT005',
        category: 'MATERIAL_NEEDS',
        price: 60.00,
        description: 'Medical adhesive tape',
        isActive: true,
        unit: 'roll'
      },
      {
        name: 'Antiseptic Solution',
        code: 'MAT006',
        category: 'MATERIAL_NEEDS',
        price: 180.00,
        description: 'Chlorhexidine or povidone-iodine solution',
        isActive: true,
        unit: 'bottle'
      }
    ];

    for (const service of materialNeedsServices) {
      await prisma.service.upsert({
        where: { code: service.code },
        update: service,
        create: service
      });
    }
    console.log(`✅ Seeded ${materialNeedsServices.length} MATERIAL_NEEDS services\n`);

    console.log('🎉 All new service categories seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   NURSE_WALKIN: ${nurseWalkInServices.length} services`);
    console.log(`   EMERGENCY_DRUG: ${emergencyDrugServices.length} services`);
    console.log(`   MATERIAL_NEEDS: ${materialNeedsServices.length} services`);

  } catch (error) {
    console.error('❌ Error seeding new service categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedNewServiceCategories();

