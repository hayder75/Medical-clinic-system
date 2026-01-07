/**
 * Script to add "Strongly Reactive" option to all lab tests
 * that have "Reactive" and "Non-Reactive" in their dropdown options
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addStronglyReactiveOption() {
  console.log('🔬 Adding "Strongly Reactive" option to relevant lab tests...\n');

  try {
    // Get all result fields with select type
    const resultFields = await prisma.labTestResultField.findMany({
      where: {
        fieldType: 'select'
      },
      include: {
        test: {
          select: {
            code: true,
            name: true
          }
        }
      }
    });

    let updatedCount = 0;

    for (const field of resultFields) {
      if (!field.options) continue;

      // Parse options - could be JSON string or already an array
      let optionsList = [];
      if (typeof field.options === 'string') {
        try {
          optionsList = JSON.parse(field.options);
        } catch (e) {
          continue; // Skip invalid JSON
        }
      } else if (Array.isArray(field.options)) {
        optionsList = [...field.options];
      } else {
        continue;
      }

      // Check if options contain "Reactive" or "Non-Reactive" (case-insensitive)
      const hasReactive = optionsList.some(opt => 
        typeof opt === 'string' && opt.toLowerCase().includes('reactive')
      );
      
      // Check if "Strongly Reactive" already exists
      const hasStronglyReactive = optionsList.some(opt => 
        typeof opt === 'string' && opt.toLowerCase() === 'strongly reactive'
      );

      if (hasReactive && !hasStronglyReactive) {
        // Add "Strongly Reactive" to the options
        // Try to maintain logical order: Non-Reactive, Reactive, Strongly Reactive
        let newOptions = [...optionsList];
        
        // Find indices
        const reactiveIndex = newOptions.findIndex(opt => 
          typeof opt === 'string' && opt.toLowerCase().includes('reactive') && opt.toLowerCase() !== 'strongly reactive'
        );
        
        if (reactiveIndex !== -1) {
          // Insert "Strongly Reactive" after "Reactive"
          newOptions.splice(reactiveIndex + 1, 0, 'Strongly Reactive');
        } else {
          // If we can't find Reactive, just append
          newOptions.push('Strongly Reactive');
        }

        // Update the field
        await prisma.labTestResultField.update({
          where: { id: field.id },
          data: {
            options: newOptions
          }
        });

        console.log(`   ✅ Updated: ${field.test.name} - ${field.label}`);
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} result fields with "Strongly Reactive" option`);

  } catch (error) {
    console.error('❌ Error adding "Strongly Reactive" option:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  addStronglyReactiveOption()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addStronglyReactiveOption };

