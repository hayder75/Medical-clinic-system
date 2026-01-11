const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Function to parse medication name and extract dosageForm and strength
function parseMedicationName(name) {
  let dosageForm = 'Tablet'; // Default
  let strength = '';
  let category = 'TABLETS'; // Default
  
  const nameLower = name.toLowerCase();
  
  // Extract strength (numbers with mg, %, etc.)
  const strengthMatch = name.match(/(\d+(?:\.\d+)?)\s*(mg|%|ml|iu|units?)/i);
  if (strengthMatch) {
    strength = strengthMatch[0];
  }
  
  // Determine dosage form and category based on name
  if (nameLower.includes('injectable') || nameLower.includes('injection')) {
    dosageForm = 'Injection';
    category = 'INJECTIONS';
  } else if (nameLower.includes('mouthwash') || nameLower.includes('rinse')) {
    dosageForm = 'Liquid';
    category = 'SYRUPS';
  } else if (nameLower.includes('gel') || nameLower.includes('varnish')) {
    dosageForm = 'Gel';
    category = 'OINTMENTS';
  } else if (nameLower.includes('spray')) {
    dosageForm = 'Spray';
    category = 'DROPS';
  } else if (nameLower.includes('toothpaste')) {
    dosageForm = 'Paste';
    category = 'OINTMENTS';
  } else if (nameLower.includes('troches') || nameLower.includes('chewable')) {
    dosageForm = 'Chewable';
    category = 'TABLETS';
  } else if (nameLower.includes('tablet')) {
    dosageForm = 'Tablet';
    category = 'TABLETS';
  } else if (nameLower.includes('capsule')) {
    dosageForm = 'Capsule';
    category = 'CAPSULES';
  } else {
    // Default to tablet if no specific form found
    dosageForm = 'Tablet';
    category = 'TABLETS';
  }
  
  return { dosageForm, strength, category };
}

// Function to extract generic name from medication name
function extractGenericName(name) {
  // Common generic names mapping
  const genericMap = {
    'amoxicillin': 'Amoxicillin',
    'clindamycin': 'Clindamycin',
    'metronidazole': 'Metronidazole',
    'penicillin': 'Penicillin',
    'azithromycin': 'Azithromycin',
    'cefalexin': 'Cefalexin',
    'doxycycline': 'Doxycycline',
    'clarithromycin': 'Clarithromycin',
    'ibuprofen': 'Ibuprofen',
    'paracetamol': 'Paracetamol',
    'acetaminophen': 'Acetaminophen',
    'naproxen': 'Naproxen',
    'ketorolac': 'Ketorolac',
    'tramadol': 'Tramadol',
    'aspirin': 'Aspirin',
    'diclofenac': 'Diclofenac',
    'codeine': 'Codeine',
    'morphine': 'Morphine',
    'lidocaine': 'Lidocaine',
    'articaine': 'Articaine',
    'epinephrine': 'Epinephrine',
    'benzocaine': 'Benzocaine',
    'prilocaine': 'Prilocaine',
    'mepivacaine': 'Mepivacaine',
    'bupivacaine': 'Bupivacaine',
    'chlorhexidine': 'Chlorhexidine',
    'fluoride': 'Fluoride',
    'xylitol': 'Xylitol',
    'dexamethasone': 'Dexamethasone',
    'hydrocortisone': 'Hydrocortisone',
    'prednisolone': 'Prednisolone',
    'methylprednisolone': 'Methylprednisolone',
    'vitamin c': 'Ascorbic Acid',
    'calcium': 'Calcium',
    'vitamin d': 'Cholecalciferol',
    'vitamin b': 'B Complex',
    'zinc': 'Zinc',
    'iron': 'Iron',
    'folic acid': 'Folic Acid',
    'nystatin': 'Nystatin',
    'clotrimazole': 'Clotrimazole',
    'acyclovir': 'Acyclovir',
    'valacyclovir': 'Valacyclovir'
  };
  
  const nameLower = name.toLowerCase();
  for (const [key, value] of Object.entries(genericMap)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }
  
  return null;
}

async function importMedicationsFromCSV(csvFilePath) {
  try {
    console.log('📥 Starting medication import from CSV...');
    
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`CSV file not found: ${csvFilePath}`);
    }
    
    const medications = [];
    
    // Read and parse CSV manually
    const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handle quoted values)
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim()); // Add last column
      
      if (columns.length < 3) {
        console.warn(`⚠️  Skipping invalid row: ${line}`);
        continue;
      }
      
      const id = columns[0];
      const name = columns[1].replace(/^"|"$/g, '').trim(); // Remove quotes
      const pricePerUnit = parseFloat(columns[2]) || 0;
      const initialStock = parseInt(columns[3]) || 100;
      
      if (!name || pricePerUnit <= 0) {
        console.warn(`⚠️  Skipping invalid row: ${line}`);
        continue;
      }
      
      // Parse medication name to extract dosageForm, strength, and category
      const { dosageForm, strength, category } = parseMedicationName(name);
      const genericName = extractGenericName(name);
      
      medications.push({
        name,
        genericName,
        dosageForm,
        strength: strength || 'N/A',
        category,
        unitPrice: pricePerUnit,
        availableQuantity: 100, // Set to 100 for all as requested (ignore initial_stock)
        minimumStock: 20, // Set to 20 for alerts
        unit: 'unit', // Simple option: treat all as "1 unit = 1 item"
        packSize: null // Not specified in CSV
      });
    }
    
    console.log(`📊 Parsed ${medications.length} medications from CSV`);
    
    // Import medications
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const med of medications) {
      try {
        // Check if medication already exists (by unique constraint)
        const existing = await prisma.medicationCatalog.findFirst({
          where: {
            name: med.name,
            dosageForm: med.dosageForm,
            strength: med.strength
          }
        });
        
        if (existing) {
          console.log(`⏭️  Skipping duplicate: ${med.name} (${med.dosageForm} ${med.strength})`);
          skipped++;
          continue;
        }
        
        // Create medication
        await prisma.medicationCatalog.create({
          data: med
        });
        
        imported++;
        console.log(`✅ Imported: ${med.name} - ${med.category} - ETB ${med.unitPrice}`);
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          console.log(`⏭️  Skipping duplicate (unique constraint): ${med.name}`);
          skipped++;
        } else {
          console.error(`❌ Error importing ${med.name}:`, error.message);
          errors++;
        }
      }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${medications.length}`);
    
    // Verify import
    const totalCount = await prisma.medicationCatalog.count();
    console.log(`\n✅ Total medications in catalog: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Error importing medications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  const csvFilePath = process.argv[2] || path.join(__dirname, '../../Downloads/Qwen_csv_20251123_g2nxsm40g.txt');
  
  console.log(`📁 CSV File: ${csvFilePath}`);
  
  importMedicationsFromCSV(csvFilePath)
    .then(() => {
      console.log('✅ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = importMedicationsFromCSV;

