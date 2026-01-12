const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedMedicationCatalog() {
  try {
    console.log('🚀 Seeding medication catalog...');

    const medications = [
      // Pain Relief & Anti-inflammatory
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
        name: 'Diclofenac',
        genericName: 'Diclofenac Sodium',
        dosageForm: 'Tablet',
        strength: '50mg',
        category: 'TABLETS',
        unitPrice: 4.00,
        availableQuantity: 600,
        minimumStock: 60,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Aspirin',
        genericName: 'Acetylsalicylic Acid',
        dosageForm: 'Tablet',
        strength: '100mg',
        category: 'TABLETS',
        unitPrice: 1.50,
        availableQuantity: 1200,
        minimumStock: 120,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Tramadol',
        genericName: 'Tramadol HCl',
        dosageForm: 'Capsule',
        strength: '50mg',
        category: 'CAPSULES',
        unitPrice: 8.00,
        availableQuantity: 200,
        minimumStock: 20,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      
      // Antibiotics
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
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        dosageForm: 'Capsule',
        strength: '250mg',
        category: 'CAPSULES',
        unitPrice: 3.50,
        availableQuantity: 400,
        minimumStock: 40,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      {
        name: 'Ciprofloxacin',
        genericName: 'Ciprofloxacin HCl',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'TABLETS',
        unitPrice: 7.00,
        availableQuantity: 300,
        minimumStock: 30,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Azithromycin',
        genericName: 'Azithromycin',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'TABLETS',
        unitPrice: 15.00,
        availableQuantity: 150,
        minimumStock: 15,
        manufacturer: 'Cadila Pharmaceuticals'
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
      },
      {
        name: 'Metronidazole',
        genericName: 'Metronidazole',
        dosageForm: 'Tablet',
        strength: '400mg',
        category: 'TABLETS',
        unitPrice: 4.50,
        availableQuantity: 350,
        minimumStock: 35,
        manufacturer: 'Ethio Pharma'
      },
      
      // Cardiovascular
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
        name: 'Amlodipine',
        genericName: 'Amlodipine Besylate',
        dosageForm: 'Tablet',
        strength: '5mg',
        category: 'TABLETS',
        unitPrice: 5.50,
        availableQuantity: 250,
        minimumStock: 25,
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
        name: 'Atenolol',
        genericName: 'Atenolol',
        dosageForm: 'Tablet',
        strength: '50mg',
        category: 'TABLETS',
        unitPrice: 4.00,
        availableQuantity: 180,
        minimumStock: 18,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      
      // Diabetes
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
        name: 'Glibenclamide',
        genericName: 'Glibenclamide',
        dosageForm: 'Tablet',
        strength: '5mg',
        category: 'TABLETS',
        unitPrice: 3.00,
        availableQuantity: 250,
        minimumStock: 25,
        manufacturer: 'Ethio Pharma'
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
      
      // Gastrointestinal
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
        name: 'Ranitidine',
        genericName: 'Ranitidine HCl',
        dosageForm: 'Tablet',
        strength: '150mg',
        category: 'TABLETS',
        unitPrice: 3.50,
        availableQuantity: 200,
        minimumStock: 20,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Domperidone',
        genericName: 'Domperidone',
        dosageForm: 'Tablet',
        strength: '10mg',
        category: 'TABLETS',
        unitPrice: 2.00,
        availableQuantity: 300,
        minimumStock: 30,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      
      // Respiratory
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
        name: 'Beclomethasone',
        genericName: 'Beclomethasone Dipropionate',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        category: 'INHALERS',
        unitPrice: 30.00,
        availableQuantity: 40,
        minimumStock: 4,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Ambroxol',
        genericName: 'Ambroxol HCl',
        dosageForm: 'Syrup',
        strength: '15mg/5ml',
        category: 'SYRUPS',
        unitPrice: 12.00,
        availableQuantity: 80,
        minimumStock: 8,
        manufacturer: 'Ethio Pharma'
      },
      
      // Antihistamines & Allergy
      {
        name: 'Cetirizine',
        genericName: 'Cetirizine HCl',
        dosageForm: 'Tablet',
        strength: '10mg',
        category: 'TABLETS',
        unitPrice: 3.00,
        availableQuantity: 400,
        minimumStock: 40,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      {
        name: 'Loratadine',
        genericName: 'Loratadine',
        dosageForm: 'Tablet',
        strength: '10mg',
        category: 'TABLETS',
        unitPrice: 4.00,
        availableQuantity: 350,
        minimumStock: 35,
        manufacturer: 'Sun Pharma'
      },
      
      // Antifungal
      {
        name: 'Fluconazole',
        genericName: 'Fluconazole',
        dosageForm: 'Capsule',
        strength: '150mg',
        category: 'CAPSULES',
        unitPrice: 20.00,
        availableQuantity: 60,
        minimumStock: 6,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      {
        name: 'Clotrimazole',
        genericName: 'Clotrimazole',
        dosageForm: 'Cream',
        strength: '1%',
        category: 'OINTMENTS',
        unitPrice: 8.00,
        availableQuantity: 100,
        minimumStock: 10,
        manufacturer: 'Ethio Pharma'
      },
      
      // Vitamins & Supplements
      {
        name: 'Multivitamin',
        genericName: 'Multivitamin Complex',
        dosageForm: 'Tablet',
        strength: '1 tablet',
        category: 'TABLETS',
        unitPrice: 5.00,
        availableQuantity: 500,
        minimumStock: 50,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Vitamin C',
        genericName: 'Ascorbic Acid',
        dosageForm: 'Tablet',
        strength: '1000mg',
        category: 'TABLETS',
        unitPrice: 3.00,
        availableQuantity: 600,
        minimumStock: 60,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Calcium',
        genericName: 'Calcium Carbonate',
        dosageForm: 'Tablet',
        strength: '500mg',
        category: 'TABLETS',
        unitPrice: 2.50,
        availableQuantity: 400,
        minimumStock: 40,
        manufacturer: 'Ethio Pharma'
      },
      {
        name: 'Iron',
        genericName: 'Ferrous Sulfate',
        dosageForm: 'Tablet',
        strength: '200mg',
        category: 'TABLETS',
        unitPrice: 3.50,
        availableQuantity: 300,
        minimumStock: 30,
        manufacturer: 'Cadila Pharmaceuticals'
      },
      
      // Antimalarial
      {
        name: 'Artemether-Lumefantrine',
        genericName: 'Artemether-Lumefantrine',
        dosageForm: 'Tablet',
        strength: '20/120mg',
        category: 'TABLETS',
        unitPrice: 25.00,
        availableQuantity: 100,
        minimumStock: 10,
        manufacturer: 'Sun Pharma'
      },
      {
        name: 'Chloroquine',
        genericName: 'Chloroquine Phosphate',
        dosageForm: 'Tablet',
        strength: '250mg',
        category: 'TABLETS',
        unitPrice: 4.00,
        availableQuantity: 200,
        minimumStock: 20,
        manufacturer: 'Ethio Pharma'
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