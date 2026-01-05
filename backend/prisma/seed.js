const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Seed Dental Treatments (Services)
  await prisma.service.createMany({
    data: [
      { name: 'Consultation', code: 'BAS-CON', description: 'Initial dental examination and consultation', price: 50.0, category: 'BASIC', turnaroundTime: '30 min' },
      { name: 'Filling - Small', code: 'RES-FIL-S', description: 'Composite filling for small cavities (1 surface)', price: 85.0, category: 'RESTORATIVE', turnaroundTime: '45 min' },
      { name: '3D CBCT Scan', code: 'DIA-CBCT', description: 'Cone beam CT scan for dental imaging', price: 400.0, category: 'DIAGNOSTIC', turnaroundTime: '1 hr' },
      { name: 'Root Canal', code: 'END-RCT', description: 'Root canal treatment', price: 400.0, category: 'ENDODONTIC', turnaroundTime: '2 hr' },
      { name: 'Night Guard', code: 'PRE-NGT', description: 'Custom-fitted night guard', price: 350.0, category: 'PREVENTIVE', turnaroundTime: '45 min' },
      { name: 'Subcutaneous Infusion', code: 'OTH-INF', description: 'Continuous subcutaneous infusion setup', price: 800.0, category: 'OTHER', turnaroundTime: '1 hr' },
    ],
  });

  // Seed Investigation Types (Lab/Radiology)
  await prisma.investigationType.createMany({
    data: [
      { name: 'CBC', price: 20.0, category: 'LAB' },
      { name: 'Blood Glucose', price: 15.0, category: 'LAB' },
      { name: 'X-Ray - Bitewing', price: 65.0, category: 'RADIOLOGY' },
      { name: 'CT Scan', price: 150.0, category: 'RADIOLOGY' },
      { name: 'Hemoglobin (Hb)', price: 25.0, category: 'LAB' },
    ],
  });

  // Seed Departments
  await prisma.department.createMany({
    data: [
      { name: 'Dentists', description: 'Handles dental diagnosis and treatment.' },
      { name: 'Doctors', description: 'General medical support for dental patients.' },
      { name: 'Nurses', description: 'Patient care and vitals.' },
      { name: 'Pharmacy', description: 'Medication dispensing.' },
      { name: 'Lab', description: 'Laboratory testing.' },
      { name: 'Radiology', description: 'Imaging services.' },
    ],
  });

  // Seed Medicine Categories
  await prisma.medicineCategory.createMany({
    data: [
      { name: 'Tablets', description: 'Oral solid dosage forms' },
      { name: 'Capsules', description: 'Encapsulated medications' },
      { name: 'Injections', description: 'Injectable medications' },
      { name: 'Infusions', description: 'Continuous infusion medications' },
    ],
  });

  // Seed Inventory
  await prisma.inventory.createMany({
    data: [
      { name: 'Morphine', quantity: 100, category: 'INFUSIONS', dosageForm: 'Infusion', strength: '10mg/mL', price: 100.0 },
      { name: 'Paracetamol', quantity: 500, category: 'TABLETS', dosageForm: 'Tablet', strength: '500mg', price: 10.0 },
    ],
  });

  console.log('Seeding completed');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());