const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// This script seeds the system with:
// - Lab services
// - Lab templates
// - Medications (pharmacy)
// - Radiology services
// - Investigation types (lab + radiology)
// - Consultation services
// - Insurance companies
//
// DOES NOT seed:
// - Patients
// - Staff/Users
// - Dental services/teeth

async function seedSystemData() {
  console.log('🌱 Starting system data seeding...\n');
  
  try {
    // 1. SEED LAB SERVICES - REMOVED: We now use the new LabTest system (see seed-system/03-seed-lab-tests.js)
    // Old lab services are no longer seeded here to avoid conflicts with the new hierarchical system
    console.log('1️⃣  Lab Services - SKIPPED (using new LabTest system instead - see seed-system/03-seed-lab-tests.js)\n');

    // 2. SEED RADIOLOGY SERVICES
    console.log('2️⃣  Seeding Radiology Services...');
    const radiologyServices = [
      { code: 'XR001', name: 'X-Ray Chest PA View', category: 'RADIOLOGY', price: 150.00, description: 'Chest X-ray PA view', isActive: true },
      { code: 'XR002', name: 'X-Ray Extremity', category: 'RADIOLOGY', price: 120.00, description: 'X-ray of extremities', isActive: true },
      { code: 'XR003', name: 'X-Ray Spine', category: 'RADIOLOGY', price: 180.00, description: 'Spinal X-ray', isActive: true },
      { code: 'XR004', name: 'X-Ray Abdomen', category: 'RADIOLOGY', price: 160.00, description: 'Abdominal X-ray', isActive: true },
      { code: 'XR005', name: 'X-Ray Skull', category: 'RADIOLOGY', price: 200.00, description: 'Skull X-ray', isActive: true },
      { code: 'US001', name: 'Abdominal Ultrasound', category: 'RADIOLOGY', price: 400.00, description: 'Abdominal ultrasound examination', isActive: true },
      { code: 'US002', name: 'Pelvic Ultrasound', category: 'RADIOLOGY', price: 380.00, description: 'Pelvic ultrasound examination', isActive: true },
      { code: 'US003', name: 'Obstetric Ultrasound', category: 'RADIOLOGY', price: 420.00, description: 'Obstetric ultrasound examination', isActive: true },
      { code: 'US004', name: 'Thyroid Ultrasound', category: 'RADIOLOGY', price: 350.00, description: 'Thyroid ultrasound examination', isActive: true },
      { code: 'US005', name: 'Breast Ultrasound', category: 'RADIOLOGY', price: 380.00, description: 'Breast ultrasound examination', isActive: true },
      { code: 'US006', name: 'Doppler Ultrasound', category: 'RADIOLOGY', price: 450.00, description: 'Doppler ultrasound examination', isActive: true },
      { code: 'CT001', name: 'CT Head without Contrast', category: 'RADIOLOGY', price: 800.00, description: 'CT scan of head without contrast', isActive: true },
      { code: 'CT002', name: 'CT Head with Contrast', category: 'RADIOLOGY', price: 1000.00, description: 'CT scan of head with contrast', isActive: true },
      { code: 'CT003', name: 'CT Chest', category: 'RADIOLOGY', price: 1200.00, description: 'CT scan of chest', isActive: true },
      { code: 'CT004', name: 'CT Abdomen', category: 'RADIOLOGY', price: 1300.00, description: 'CT scan of abdomen', isActive: true },
      { code: 'MRI001', name: 'MRI - Brain', category: 'RADIOLOGY', price: 2000.00, description: 'MRI scan of brain', isActive: true },
      { code: 'MRI002', name: 'MRI - Spine', category: 'RADIOLOGY', price: 2200.00, description: 'MRI scan of spine', isActive: true },
      { code: 'MAM001', name: 'Mammography', category: 'RADIOLOGY', price: 500.00, description: 'Mammography examination', isActive: true },
    ];

    for (const service of radiologyServices) {
      await prisma.service.upsert({
        where: { code: service.code },
        update: service,
        create: service
      });
    }
    console.log(`✅ Seeded ${radiologyServices.length} radiology services\n`);

    // 3. SEED CONSULTATION SERVICES
    console.log('3️⃣  Seeding Consultation Services...');
    const consultationServices = [
      { code: 'CONS001', name: 'General Doctor Consultation', category: 'CONSULTATION', price: 200.00, description: 'General doctor consultation fee', isActive: true },
      { code: 'CONS002', name: 'Specialist Consultation', category: 'CONSULTATION', price: 300.00, description: 'Specialist doctor consultation fee', isActive: true },
    ];

    for (const service of consultationServices) {
      await prisma.service.upsert({
        where: { code: service.code },
        update: service,
        create: service
      });
    }
    console.log(`✅ Seeded ${consultationServices.length} consultation services\n`);

    // 4. SEED INVESTIGATION TYPES (Radiology only - Lab uses new LabTest system)
    console.log('4️⃣  Seeding Investigation Types (Radiology only - Lab uses new LabTest system)...');
    const radiologyServicesInDb = await prisma.service.findMany({ where: { category: 'RADIOLOGY' } });

    // Lab Investigation Types - REMOVED: We now use the new LabTest system
    const labTypes = [];

    // Radiology Investigation Types
    const radiologyTypes = [
      { name: 'Chest X-Ray', price: 150, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'XR001')?.id || null },
      { name: 'Abdominal X-Ray', price: 160, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'XR004')?.id || null },
      { name: 'CT Scan - Head', price: 800, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'CT001')?.id || null },
      { name: 'CT Scan - Chest', price: 1200, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'CT003')?.id || null },
      { name: 'CT Scan - Abdomen', price: 1300, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'CT004')?.id || null },
      { name: 'MRI - Brain', price: 2000, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'MRI001')?.id || null },
      { name: 'MRI - Spine', price: 2200, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'MRI002')?.id || null },
      { name: 'Ultrasound - Abdomen', price: 400, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'US001')?.id || null },
      { name: 'Ultrasound - Pelvis', price: 380, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'US002')?.id || null },
      { name: 'Mammography', price: 500, category: 'RADIOLOGY', serviceId: radiologyServicesInDb.find(s => s.code === 'MAM001')?.id || null },
    ].filter(t => t.serviceId !== null);

    // Clear and create investigation types
    await prisma.investigationType.deleteMany({});
    
    for (const type of [...labTypes, ...radiologyTypes]) {
      if (type.serviceId) {
        await prisma.investigationType.create({
          data: {
            name: type.name,
            price: type.price,
            category: type.category,
            serviceId: type.serviceId
          }
        });
      }
    }
    console.log(`✅ Seeded ${labTypes.length + radiologyTypes.length} investigation types\n`);

    // 5. SEED MEDICATIONS
    console.log('5️⃣  Seeding Medication Catalog...');
    const medications = [
      { name: 'Paracetamol', genericName: 'Acetaminophen', dosageForm: 'Tablet', strength: '500mg', category: 'TABLETS', unitPrice: 2.50, availableQuantity: 1000, minimumStock: 100, manufacturer: 'Ethio Pharma', unit: 'tablet' },
      { name: 'Amoxicillin', genericName: 'Amoxicillin', dosageForm: 'Capsule', strength: '500mg', category: 'CAPSULES', unitPrice: 5.00, availableQuantity: 500, minimumStock: 50, manufacturer: 'Cadila Pharmaceuticals', unit: 'capsule' },
      { name: 'Ibuprofen', genericName: 'Ibuprofen', dosageForm: 'Tablet', strength: '400mg', category: 'TABLETS', unitPrice: 3.00, availableQuantity: 800, minimumStock: 80, manufacturer: 'Ethio Pharma', unit: 'tablet' },
      { name: 'Metformin', genericName: 'Metformin HCl', dosageForm: 'Tablet', strength: '500mg', category: 'TABLETS', unitPrice: 4.50, availableQuantity: 300, minimumStock: 30, manufacturer: 'Sun Pharma', unit: 'tablet' },
      { name: 'Lisinopril', genericName: 'Lisinopril', dosageForm: 'Tablet', strength: '10mg', category: 'TABLETS', unitPrice: 6.00, availableQuantity: 200, minimumStock: 20, manufacturer: 'Cadila Pharmaceuticals', unit: 'tablet' },
      { name: 'Omeprazole', genericName: 'Omeprazole', dosageForm: 'Capsule', strength: '20mg', category: 'CAPSULES', unitPrice: 8.00, availableQuantity: 150, minimumStock: 15, manufacturer: 'Sun Pharma', unit: 'capsule' },
      { name: 'Atorvastatin', genericName: 'Atorvastatin Calcium', dosageForm: 'Tablet', strength: '20mg', category: 'TABLETS', unitPrice: 12.00, availableQuantity: 100, minimumStock: 10, manufacturer: 'Ethio Pharma', unit: 'tablet' },
      { name: 'Salbutamol', genericName: 'Salbutamol Sulfate', dosageForm: 'Inhaler', strength: '100mcg', category: 'INHALERS', unitPrice: 25.00, availableQuantity: 50, minimumStock: 5, manufacturer: 'Cadila Pharmaceuticals', unit: 'unit' },
      { name: 'Insulin', genericName: 'Human Insulin', dosageForm: 'Injection', strength: '100 units/ml', category: 'INJECTIONS', unitPrice: 45.00, availableQuantity: 25, minimumStock: 3, manufacturer: 'Novo Nordisk', unit: 'vial' },
      { name: 'Ceftriaxone', genericName: 'Ceftriaxone Sodium', dosageForm: 'Injection', strength: '1g', category: 'INJECTIONS', unitPrice: 35.00, availableQuantity: 40, minimumStock: 4, manufacturer: 'Sun Pharma', unit: 'vial' },
      { name: 'Amoxicillin/Clavulanate', genericName: 'Amoxicillin/Clavulanic Acid', dosageForm: 'Tablet', strength: '625mg', category: 'TABLETS', unitPrice: 8.00, availableQuantity: 300, minimumStock: 30, manufacturer: 'Cadila Pharmaceuticals', unit: 'tablet' },
      { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', dosageForm: 'Tablet', strength: '500mg', category: 'TABLETS', unitPrice: 6.00, availableQuantity: 250, minimumStock: 25, manufacturer: 'Sun Pharma', unit: 'tablet' },
      { name: 'Doxycycline', genericName: 'Doxycycline', dosageForm: 'Capsule', strength: '100mg', category: 'CAPSULES', unitPrice: 5.50, availableQuantity: 200, minimumStock: 20, manufacturer: 'Ethio Pharma', unit: 'capsule' },
      { name: 'Azithromycin', genericName: 'Azithromycin', dosageForm: 'Tablet', strength: '500mg', category: 'TABLETS', unitPrice: 12.00, availableQuantity: 150, minimumStock: 15, manufacturer: 'Cadila Pharmaceuticals', unit: 'tablet' },
      { name: 'Amlodipine', genericName: 'Amlodipine Besylate', dosageForm: 'Tablet', strength: '5mg', category: 'TABLETS', unitPrice: 7.00, availableQuantity: 180, minimumStock: 18, manufacturer: 'Sun Pharma', unit: 'tablet' },
    ];

    for (const medication of medications) {
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
    }
    console.log(`✅ Seeded ${medications.length} medications\n`);

    // 6. SEED LAB TEMPLATES (simplified - will use the full template script)
    console.log('6️⃣  Seeding Lab Templates...');
    console.log('   (Skipping - run seed-lab-templates-complete.js separately for full templates)\n');

    // 7. SEED INSURANCE COMPANIES
    console.log('7️⃣  Seeding Insurance Companies...');
    const insuranceCompanies = [
      { name: 'Ethiopian Insurance Corporation', code: 'EIC001', contactInfo: 'Insurance Manager - +251-11-123-4567 - insurance@ethioinsurance.com - Addis Ababa, Ethiopia', isActive: true },
      { name: 'Test Insurance', code: 'TEST001', contactInfo: 'Test Manager - +251-11-987-6543 - test@testinsurance.et - Addis Ababa, Ethiopia', isActive: true },
    ];

    for (const insurance of insuranceCompanies) {
      await prisma.insurance.upsert({
        where: { code: insurance.code },
        update: insurance,
        create: insurance
      });
    }
    console.log(`✅ Seeded ${insuranceCompanies.length} insurance companies\n`);

    // Summary
    const totalServices = await prisma.service.count();
    const totalMedications = await prisma.medicationCatalog.count();
    const totalInvestigationTypes = await prisma.investigationType.count();
    const totalInsurance = await prisma.insurance.count();

    console.log('📊 SEEDING SUMMARY:');
    console.log(`   Services: ${totalServices}`);
    console.log(`   Medications: ${totalMedications}`);
    console.log(`   Investigation Types: ${totalInvestigationTypes}`);
    console.log(`   Insurance Companies: ${totalInsurance}`);
    console.log('\n🎉 System data seeding completed successfully!');
    console.log('\n⚠️  Note: Lab templates not included. Run seed-lab-templates-complete.js for full template support.');

  } catch (error) {
    console.error('❌ Error seeding system data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedSystemData()
  .then(() => {
    console.log('\n✅ All seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });

