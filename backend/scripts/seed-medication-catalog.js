const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sampleMedications = [
  // Common antibiotics
  {
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    dosageForm: 'Capsule',
    strength: '500mg',
    type: 'Prescription',
    unitPrice: 2.50,
    availableQuantity: 100,
    minimumStock: 20,
    category: 'ANTIBIOTIC',
    manufacturer: 'Generic Pharma',
    description: 'Broad-spectrum antibiotic for bacterial infections',
    sideEffects: 'Nausea, diarrhea, allergic reactions',
    contraindications: 'Penicillin allergy'
  },
  {
    name: 'Ciprofloxacin',
    genericName: 'Ciprofloxacin',
    dosageForm: 'Tablet',
    strength: '500mg',
    type: 'Prescription',
    unitPrice: 3.00,
    availableQuantity: 80,
    minimumStock: 15,
    category: 'ANTIBIOTIC',
    manufacturer: 'MedCorp',
    description: 'Fluoroquinolone antibiotic for urinary and respiratory infections',
    sideEffects: 'Nausea, dizziness, tendon rupture risk',
    contraindications: 'Pregnancy, children under 18'
  },
  
  // Pain management
  {
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    dosageForm: 'Tablet',
    strength: '400mg',
    type: 'OTC',
    unitPrice: 0.50,
    availableQuantity: 200,
    minimumStock: 50,
    category: 'ANALGESIC',
    manufacturer: 'PainRelief Inc',
    description: 'NSAID for pain and inflammation',
    sideEffects: 'Stomach upset, headache',
    contraindications: 'Stomach ulcers, severe heart failure'
  },
  {
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    dosageForm: 'Tablet',
    strength: '500mg',
    type: 'OTC',
    unitPrice: 0.30,
    availableQuantity: 300,
    minimumStock: 100,
    category: 'ANALGESIC',
    manufacturer: 'Generic Pharma',
    description: 'Pain reliever and fever reducer',
    sideEffects: 'Rare liver damage with overdose',
    contraindications: 'Severe liver disease'
  },
  
  // Cardiovascular
  {
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    dosageForm: 'Tablet',
    strength: '10mg',
    type: 'Prescription',
    unitPrice: 1.20,
    availableQuantity: 60,
    minimumStock: 10,
    category: 'CARDIOVASCULAR',
    manufacturer: 'HeartMed',
    description: 'ACE inhibitor for hypertension',
    sideEffects: 'Dry cough, dizziness, hyperkalemia',
    contraindications: 'Pregnancy, bilateral renal artery stenosis'
  },
  {
    name: 'Metoprolol',
    genericName: 'Metoprolol',
    dosageForm: 'Tablet',
    strength: '50mg',
    type: 'Prescription',
    unitPrice: 1.50,
    availableQuantity: 70,
    minimumStock: 15,
    category: 'CARDIOVASCULAR',
    manufacturer: 'CardioCorp',
    description: 'Beta-blocker for hypertension and heart conditions',
    sideEffects: 'Fatigue, bradycardia, cold hands/feet',
    contraindications: 'Severe heart failure, asthma'
  },
  
  // Diabetes management
  {
    name: 'Metformin',
    genericName: 'Metformin',
    dosageForm: 'Tablet',
    strength: '500mg',
    type: 'Prescription',
    unitPrice: 0.80,
    availableQuantity: 120,
    minimumStock: 30,
    category: 'ANTIDIABETIC',
    manufacturer: 'DiabCare',
    description: 'First-line treatment for type 2 diabetes',
    sideEffects: 'Nausea, diarrhea, metallic taste',
    contraindications: 'Severe kidney disease, liver disease'
  },
  {
    name: 'Insulin Glargine',
    genericName: 'Insulin Glargine',
    dosageForm: 'Injection',
    strength: '100 units/ml',
    type: 'Prescription',
    unitPrice: 25.00,
    availableQuantity: 20,
    minimumStock: 5,
    category: 'ANTIDIABETIC',
    manufacturer: 'InsulinPro',
    description: 'Long-acting insulin for diabetes management',
    sideEffects: 'Hypoglycemia, injection site reactions',
    contraindications: 'Hypoglycemia'
  },
  
  // Respiratory
  {
    name: 'Salbutamol',
    genericName: 'Albuterol',
    dosageForm: 'Inhaler',
    strength: '100mcg',
    type: 'Prescription',
    unitPrice: 8.00,
    availableQuantity: 25,
    minimumStock: 5,
    category: 'RESPIRATORY',
    manufacturer: 'BreathEasy',
    description: 'Bronchodilator for asthma and COPD',
    sideEffects: 'Tremor, nervousness, headache',
    contraindications: 'Hypersensitivity to beta-agonists'
  },
  {
    name: 'Prednisolone',
    genericName: 'Prednisolone',
    dosageForm: 'Tablet',
    strength: '5mg',
    type: 'Prescription',
    unitPrice: 1.80,
    availableQuantity: 90,
    minimumStock: 20,
    category: 'CORTICOSTEROID',
    manufacturer: 'SteroidMed',
    description: 'Corticosteroid for inflammation and immune suppression',
    sideEffects: 'Weight gain, mood changes, increased infection risk',
    contraindications: 'Systemic fungal infections'
  },
  
  // Gastrointestinal
  {
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    dosageForm: 'Capsule',
    strength: '20mg',
    type: 'Prescription',
    unitPrice: 2.20,
    availableQuantity: 100,
    minimumStock: 25,
    category: 'GASTROINTESTINAL',
    manufacturer: 'GutHealth',
    description: 'Proton pump inhibitor for acid reflux and ulcers',
    sideEffects: 'Headache, nausea, vitamin B12 deficiency',
    contraindications: 'Hypersensitivity to PPIs'
  },
  {
    name: 'Loperamide',
    genericName: 'Loperamide',
    dosageForm: 'Capsule',
    strength: '2mg',
    type: 'OTC',
    unitPrice: 0.40,
    availableQuantity: 150,
    minimumStock: 40,
    category: 'GASTROINTESTINAL',
    manufacturer: 'DigestCare',
    description: 'Antidiarrheal medication',
    sideEffects: 'Constipation, dizziness, drowsiness',
    contraindications: 'Bloody diarrhea, bacterial infection'
  },
  
  // Vitamins and supplements
  {
    name: 'Vitamin D3',
    genericName: 'Cholecalciferol',
    dosageForm: 'Capsule',
    strength: '1000 IU',
    type: 'OTC',
    unitPrice: 0.60,
    availableQuantity: 200,
    minimumStock: 50,
    category: 'VITAMIN',
    manufacturer: 'VitaLife',
    description: 'Vitamin D supplement for bone health',
    sideEffects: 'Nausea, constipation, kidney stones (overdose)',
    contraindications: 'Hypercalcemia, hypervitaminosis D'
  },
  {
    name: 'Multivitamin',
    genericName: 'Multivitamin',
    dosageForm: 'Tablet',
    strength: 'One-a-day',
    type: 'OTC',
    unitPrice: 0.25,
    availableQuantity: 500,
    minimumStock: 100,
    category: 'VITAMIN',
    manufacturer: 'VitaLife',
    description: 'Daily multivitamin supplement',
    sideEffects: 'Nausea, constipation, yellow urine',
    contraindications: 'Iron overload disorders'
  },
  
  // Controlled substances (low stock for testing)
  {
    name: 'Morphine',
    genericName: 'Morphine',
    dosageForm: 'Injection',
    strength: '10mg/ml',
    type: 'Controlled',
    unitPrice: 15.00,
    availableQuantity: 5,
    minimumStock: 2,
    category: 'OPIOID',
    manufacturer: 'PainControl',
    description: 'Strong opioid for severe pain management',
    sideEffects: 'Drowsiness, constipation, respiratory depression',
    contraindications: 'Respiratory depression, severe asthma'
  },
  {
    name: 'Diazepam',
    genericName: 'Diazepam',
    dosageForm: 'Tablet',
    strength: '5mg',
    type: 'Controlled',
    unitPrice: 3.50,
    availableQuantity: 8,
    minimumStock: 3,
    category: 'BENZODIAZEPINE',
    manufacturer: 'AnxietyCare',
    description: 'Benzodiazepine for anxiety and muscle spasms',
    sideEffects: 'Drowsiness, dizziness, dependence',
    contraindications: 'Severe respiratory insufficiency, sleep apnea'
  }
];

async function seedMedicationCatalog() {
  try {
    console.log('🌱 Seeding medication catalog...');
    
    // Clear existing data
    await prisma.medicationCatalog.deleteMany({});
    console.log('✅ Cleared existing medication catalog');
    
    // Insert sample medications
    const createdMedications = await prisma.medicationCatalog.createMany({
      data: sampleMedications
    });
    
    console.log(`✅ Created ${createdMedications.count} medications in catalog`);
    
    // Display summary
    const categories = await prisma.medicationCatalog.groupBy({
      by: ['category'],
      _count: { category: true }
    });
    
    console.log('\n📊 Medication Catalog Summary:');
    categories.forEach(cat => {
      console.log(`   ${cat.category || 'Uncategorized'}: ${cat._count.category} medications`);
    });
    
    const lowStock = await prisma.medicationCatalog.findMany({
      where: {
        availableQuantity: {
          lte: prisma.medicationCatalog.fields.minimumStock
        }
      },
      select: { name: true, availableQuantity: true, minimumStock: true }
    });
    
    if (lowStock.length > 0) {
      console.log('\n⚠️  Low Stock Medications:');
      lowStock.forEach(med => {
        console.log(`   ${med.name}: ${med.availableQuantity}/${med.minimumStock}`);
      });
    }
    
    console.log('\n🎉 Medication catalog seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding medication catalog:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedMedicationCatalog();
