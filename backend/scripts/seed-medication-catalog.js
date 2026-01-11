const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMedicationCatalog() {
  try {
    console.log('🚀 Seeding medication catalog...');

    const medications = [
      // Common medications
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'TABLETS',
        unitPrice: 2.50,
        availableQuantity: 1000,
        minimumStock: 100,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        dosageForm: 'Capsule',
        strength: '500mg',
        category: 'CAPSULES',
        unitPrice: 5.00,
        availableQuantity: 500,
        minimumStock: 50,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosageForm: 'Tablet',
        strength: '400mg',
        category: 'TABLETS',
        unitPrice: 3.00,
        availableQuantity: 800,
        minimumStock: 80,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Metformin',
        genericName: 'Metformin HCl',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'TABLETS',
        unitPrice: 4.50,
        availableQuantity: 300,
        minimumStock: 30,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        dosageForm: 'Tablet',
        strength: '10mg',
        category: 'TABLETS',
        unitPrice: 6.00,
        availableQuantity: 200,
        minimumStock: 20,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        dosageForm: 'Capsule',
        strength: '20mg',
        category: 'CAPSULES',
        unitPrice: 8.00,
        availableQuantity: 150,
        minimumStock: 15,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Atorvastatin',
        genericName: 'Atorvastatin Calcium',
        dosageForm: 'Tablet',
        strength: '20mg',
        category: 'TABLETS',
        unitPrice: 12.00,
        availableQuantity: 100,
        minimumStock: 10,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Salbutamol',
        genericName: 'Salbutamol Sulfate',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        category: 'INHALERS',
        unitPrice: 25.00,
        availableQuantity: 50,
        minimumStock: 5,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      {
        name: 'Insulin',
        genericName: 'Human Insulin',
        dosageForm: 'Injection',
        strength: '100 units/ml',
        category: 'INJECTIONS',
        unitPrice: 45.00,
        availableQuantity: 25,
        minimumStock: 3,
        manufacturer: 'Novo Nordisk'
      },
      {
        name: 'Ceftriaxone',
        genericName: 'Ceftriaxone Sodium',
        dosageForm: 'Injection',
        strength: '1g',
        category: 'INJECTIONS',
        unitPrice: 35.00,
        availableQuantity: 40,
        minimumStock: 4,
        manufacturer: 'Sun Pharma'
      }
    ];

    for (const medication of medications) {
      try {
        await prisma.medicationCatalog.upsert({
          where: { 
            name_dosageForm_strength: {
              name: medication.name,
              dosageForm: medication.dosageForm,
              strength: medication.strength
            }
          },
          update: {
            unitPrice: medication.unitPrice,
            availableQuantity: medication.availableQuantity,
            minimumStock: medication.minimumStock,
            manufacturer: medication.manufacturer
          },
          create: medication
        });
        console.log(`✅ Added: ${medication.name} ${medication.strength} - ETB ${medication.unitPrice}`);
      } catch (error) {
        console.error(`❌ Error adding ${medication.name}:`, error.message);
      }
    }

    const totalMedications = await prisma.medicationCatalog.count();
    console.log(`\n📊 Total medications in catalog: ${totalMedications}`);
    console.log('🎉 Medication catalog seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding medication catalog:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedMedicationCatalog();