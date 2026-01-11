const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Map CSV categories to MedicineCategory enum
const categoryMap = {
  'Tablets': 'TABLETS',
  'Capsules': 'CAPSULES',
  'Injections': 'INJECTIONS',
  'Syrups': 'SYRUPS',
  'Ointments': 'OINTMENTS',
  'Drops': 'DROPS',
  'Inhalers': 'INHALERS',
  'Patches': 'PATCHES',
  'Infusions': 'INFUSIONS'
};

// Parse CSV line
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function importMedications() {
  console.log('🌱 Starting medication import from CSV...\n');

  try {
    // Read CSV file - try multiple possible locations
    const possiblePaths = [
      path.join(__dirname, '../../Qwen_csv_20251227_q478g1ytg.txt'),
      path.join(__dirname, '../Qwen_csv_20251227_q478g1ytg.txt'),
      path.join(__dirname, 'Qwen_csv_20251227_q478g1ytg.txt'),
      '/home/hayder/Downloads/Qwen_csv_20251227_q478g1ytg.txt'
    ];
    
    let csvPath = null;
    for (const possiblePath of possiblePaths) {
      if (fs.existsSync(possiblePath)) {
        csvPath = possiblePath;
        break;
      }
    }
    
    if (!csvPath) {
      console.error(`❌ CSV file not found. Tried:`);
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      process.exit(1);
    }
    
    console.log(`📄 Using CSV file: ${csvPath}`);

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      console.error('❌ CSV file is empty or has no data rows');
      process.exit(1);
    }

    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log('📋 CSV Header:', header.join(', '));
    console.log('');

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line);
        
        if (values.length < 6) {
          console.warn(`⚠️  Skipping line ${i + 1}: Not enough columns`);
          skipped++;
          continue;
        }

        const name = values[0].replace(/^"|"$/g, '');
        const categoryStr = values[1].replace(/^"|"$/g, '');
        const unitPrice = parseFloat(values[2]);
        const initialStock = parseInt(values[3]) || 100;
        const isRetailOnly = values[4].toLowerCase() === 'true';
        const description = values[5] ? values[5].replace(/^"|"$/g, '') : '';

        // Map category
        const category = categoryMap[categoryStr] || 'OINTMENTS'; // Default to OINTMENTS for retail items

        // Extract dosage form and strength from name if not provided
        let dosageForm = 'Unit';
        let strength = 'N/A';
        
        // Try to extract strength from name (e.g., "Amoxicillin 500mg" -> strength: "500mg")
        const strengthMatch = name.match(/(\d+(?:\.\d+)?(?:mg|g|ml|%|units?))/i);
        if (strengthMatch) {
          strength = strengthMatch[1];
        }

        // Determine dosage form from category
        if (categoryStr === 'Tablets') {
          dosageForm = 'Tablet';
        } else if (categoryStr === 'Capsules') {
          dosageForm = 'Capsule';
        } else if (categoryStr === 'Injections') {
          dosageForm = 'Injection';
        } else if (categoryStr === 'Syrups') {
          dosageForm = 'Syrup';
        } else if (categoryStr === 'Ointments') {
          dosageForm = 'Ointment';
        } else if (categoryStr === 'Drops') {
          dosageForm = 'Drops';
        } else {
          dosageForm = 'Unit';
        }

        // Try to find existing medication
        const existing = await prisma.medicationCatalog.findUnique({
          where: {
            name_dosageForm_strength: {
              name: name,
              dosageForm: dosageForm,
              strength: strength
            }
          }
        });

        const medicationData = {
          name: name,
          genericName: null,
          dosageForm: dosageForm,
          strength: strength,
          category: category,
          unitPrice: unitPrice,
          availableQuantity: initialStock,
          minimumStock: Math.max(10, Math.floor(initialStock * 0.1)), // 10% of stock or minimum 10
          manufacturer: null,
          isRetailOnly: isRetailOnly,
          description: description || null
        };

        if (existing) {
          // Update existing
          await prisma.medicationCatalog.update({
            where: { id: existing.id },
            data: medicationData
          });
          updated++;
          console.log(`✅ Updated: ${name} (${category}) - Retail Only: ${isRetailOnly}`);
        } else {
          // Create new
          await prisma.medicationCatalog.create({
            data: medicationData
          });
          imported++;
          console.log(`✅ Imported: ${name} (${category}) - Retail Only: ${isRetailOnly}`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error processing line ${i + 1}:`, error.message);
        console.error(`   Line: ${line.substring(0, 100)}...`);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Imported: ${imported}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ⚠️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total processed: ${imported + updated + skipped + errors}`);
    console.log('\n🎉 Medication import completed!');

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
importMedications();

