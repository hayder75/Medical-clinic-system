const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

/**
 * Import dental services from CSV file
 * CSV format: code,name,category,price_etb,description
 */
async function importDentalServices() {
  try {
    console.log('🦷 Starting dental services import...\n');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../dental-services.csv');
    
    // Check if file exists, if not, try the Downloads folder
    let csvContent;
    if (fs.existsSync(csvPath)) {
      csvContent = fs.readFileSync(csvPath, 'utf-8');
    } else {
      // Try Downloads folder
      const downloadsPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Downloads', 'Qwen_csv_20251123_oo0q3dvo8.txt');
      if (fs.existsSync(downloadsPath)) {
        csvContent = fs.readFileSync(downloadsPath, 'utf-8');
        console.log(`📄 Found CSV file in Downloads folder\n`);
      } else {
        throw new Error(`CSV file not found. Please place the CSV file at: ${csvPath} or ${downloadsPath}`);
      }
    }

    // Parse CSV
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`📋 Found ${lines.length - 1} services in CSV\n`);

    // Validate headers
    const expectedHeaders = ['code', 'name', 'category', 'price_etb', 'description'];
    const hasAllHeaders = expectedHeaders.every(h => headers.includes(h));
    
    if (!hasAllHeaders) {
      console.warn('⚠️  Warning: CSV headers may not match expected format');
      console.log('Expected:', expectedHeaders.join(', '));
      console.log('Found:', headers.join(', '));
    }

    // Parse services
    const services = [];
    let skipped = 0;
    let errors = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handling quoted fields)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        // Map values to headers
        const service = {};
        headers.forEach((header, index) => {
          let value = values[index] || '';
          // Remove quotes if present
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          service[header] = value;
        });

        // Validate required fields
        if (!service.code || !service.name || !service.category || !service.price_etb) {
          skipped++;
          errors.push(`Line ${i + 1}: Missing required fields`);
          continue;
        }

        // Parse price
        const price = parseFloat(service.price_etb);
        if (isNaN(price) || price < 0) {
          skipped++;
          errors.push(`Line ${i + 1}: Invalid price: ${service.price_etb}`);
          continue;
        }

        // Map category - keep original category from CSV, but validate it
        let category = service.category.toUpperCase().trim();
        
        // Map CSV categories to valid enum values
        const categoryMap = {
          'PROCEDURE': 'PROCEDURE',
          'NURSE': 'NURSE',
          'RADIOLOGY': 'RADIOLOGY',
          'CONSULTATION': 'CONSULTATION',
          'DENTAL': 'DENTAL'
        };

        if (!categoryMap[category]) {
          // If category not in map, use DENTAL as default for dental services
          category = 'DENTAL';
          console.log(`⚠️  Line ${i + 1}: Category "${service.category}" not recognized, using DENTAL`);
        } else {
          category = categoryMap[category];
        }

        // Clean description
        const description = service.description && service.description.trim() !== '' 
          ? service.description.trim() 
          : null;

        services.push({
          code: service.code.trim(),
          name: service.name.trim(),
          category: category,
          price: price,
          description: description,
          isActive: true
        });

      } catch (error) {
        skipped++;
        errors.push(`Line ${i + 1}: ${error.message}`);
      }
    }

    console.log(`✅ Parsed ${services.length} valid services`);
    if (skipped > 0) {
      console.log(`⚠️  Skipped ${skipped} invalid services`);
      if (errors.length > 0) {
        console.log('\nErrors:');
        errors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
        if (errors.length > 10) {
          console.log(`  ... and ${errors.length - 10} more errors`);
        }
      }
    }

    // Import services
    console.log('\n📥 Importing services to database...\n');
    
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const service of services) {
      try {
        // Check if service with same code exists
        const existing = await prisma.service.findUnique({
          where: { code: service.code }
        });

        if (existing) {
          // Update existing service
          await prisma.service.update({
            where: { code: service.code },
            data: {
              name: service.name,
              category: service.category,
              price: service.price,
              description: service.description,
              isActive: true
            }
          });
          updated++;
          console.log(`🔄 Updated: ${service.code} - ${service.name}`);
        } else {
          // Create new service
          await prisma.service.create({
            data: service
          });
          created++;
          console.log(`✅ Created: ${service.code} - ${service.name}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Failed to import ${service.code}: ${error.message}`);
      }
    }

    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   🔄 Updated: ${updated}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   📦 Total: ${services.length}`);

    // Show category breakdown
    const categoryBreakdown = {};
    services.forEach(s => {
      categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + 1;
    });

    console.log('\n📋 Category Breakdown:');
    Object.entries(categoryBreakdown).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    console.log('\n✨ Dental services import completed successfully!');

  } catch (error) {
    console.error('\n❌ Error importing dental services:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run import
if (require.main === module) {
  importDentalServices()
    .then(() => {
      console.log('\n✅ Import process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importDentalServices };

