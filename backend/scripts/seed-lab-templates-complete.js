const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const labTemplates = [
  // 1. HEMATOLOGY
  {
    name: "Complete Blood Count (CBC)",
    category: "Hematology",
    description: "Complete blood count including hemoglobin, hematocrit, RBC, WBC, platelets and differential count",
    fields: {
      "Hb (Hemoglobin)": { type: "number", unit: "g/dl", required: true },
      "HCT / PCV": { type: "number", unit: "%", required: true },
      "RBC": { type: "number", unit: "×10⁶/µL", required: true },
      "WBC": { type: "number", unit: "×10³/µL", required: true },
      "Plt (Platelets)": { type: "number", unit: "×10³/µL", required: true },
      "MCV": { type: "number", unit: "fL", required: true },
      "MCH": { type: "number", unit: "pg", required: true },
      "MCHC": { type: "number", unit: "g/dl", required: true },
      "ESR": { type: "number", unit: "mm/hr", required: true },
      "N (Neutrophils)": { type: "number", unit: "%", required: true },
      "L (Lymphocytes)": { type: "number", unit: "%", required: true },
      "E (Eosinophils)": { type: "number", unit: "%", required: true },
      "M (Monocytes)": { type: "number", unit: "%", required: true },
      "B (Basophils)": { type: "number", unit: "%", required: true },
      "Blood Film Morphology": { type: "textarea", required: false },
      "Blood Group": { type: "select", options: ["A", "B", "AB", "O"], required: true },
      "Rh": { type: "select", options: ["+", "-"], required: true },
      "Retic (Reticulocyte)": { type: "number", unit: "%", required: false },
      "BT (Bleeding Time)": { type: "number", unit: "min", required: false },
      "CT (Clotting Time)": { type: "number", unit: "min", required: false }
    }
  },

  // 2. STOOL EXAMINATION
  {
    name: "Stool Examination",
    category: "Stool Examination",
    description: "Complete stool examination for parasites, consistency, color and occult blood",
    fields: {
      "Consistency": { type: "text", required: true },
      "Color": { type: "text", required: true },
      "Microscopy": { type: "textarea", required: true },
      "Occult Blood": { type: "select", options: ["Positive", "Negative"], required: true },
      "Concentration": { type: "textarea", required: false }
    }
  },

  // 3. URINALYSIS
  {
    name: "Urinalysis",
    category: "Urinalysis",
    description: "Complete urinalysis including physical, chemical and microscopic examination",
    fields: {
      "Color": { type: "text", required: true },
      "Consistency": { type: "text", required: true },
      "Microscopy": { type: "textarea", required: true },
      "WBC / HPF": { type: "number", required: true },
      "RBC / HPF": { type: "number", required: true },
      "Epithelial Cell / HPF": { type: "number", required: true },
      "Cast / LPF": { type: "text", required: false },
      "Crystals / LPF": { type: "text", required: false },
      "Glucose": { type: "select", options: ["Positive", "Negative"], required: true },
      "Protein": { type: "select", options: ["Positive", "Negative"], required: true },
      "Ketone": { type: "select", options: ["Positive", "Negative"], required: true },
      "Bile Pigment": { type: "select", options: ["Positive", "Negative"], required: true },
      "Bile Salt": { type: "select", options: ["Positive", "Negative"], required: true },
      "Urobilinogen": { type: "select", options: ["Normal", "Abnormal"], required: true },
      "pH": { type: "number", required: true },
      "S. Gravity (Specific Gravity)": { type: "number", required: true },
      "Nitrate": { type: "select", options: ["Positive", "Negative"], required: true },
      "HCG": { type: "select", options: ["Positive", "Negative"], required: false }
    }
  },

  // 4. SEROLOGY
  {
    name: "Serology Panel",
    category: "Serology",
    description: "Complete serology panel including infectious disease markers",
    fields: {
      "Widal": { type: "text", required: false },
      "RPR": { type: "select", options: ["Reactive", "Non-reactive"], required: false },
      "HBsAg": { type: "select", options: ["Positive", "Negative"], required: false },
      "HIV": { type: "select", options: ["Positive", "Negative"], required: false },
      "HCG": { type: "select", options: ["Positive", "Negative"], required: false },
      "RF (Rheumatoid Factor)": { type: "select", options: ["Positive", "Negative"], required: false },
      "ASO (Anti-Streptolysin O)": { type: "number", unit: "IU/ml", required: false },
      "HCV": { type: "select", options: ["Positive", "Negative"], required: false },
      "VDRL": { type: "select", options: ["Reactive", "Non-reactive"], required: false },
      "PICT": { type: "select", options: ["Positive", "Negative"], required: false },
      "Weil-Felix": { type: "text", required: false }
    }
  },

  // 5. BLOOD CHEMISTRY TESTS
  {
    name: "Blood Chemistry Panel",
    category: "Blood Chemistry",
    description: "Complete blood chemistry panel including liver function, kidney function and lipid profile",
    fields: {
      "Blood Sugar": { type: "number", unit: "mg/dl", required: true },
      "Creatinine": { type: "number", unit: "mg/dl", required: true },
      "Urea": { type: "number", unit: "mg/dl", required: true },
      "BUN": { type: "number", unit: "mg/dl", required: true },
      "Cholesterol": { type: "number", unit: "mg/dl", required: true },
      "SGPT (ALT)": { type: "number", unit: "U/L", required: true },
      "SGOT (AST)": { type: "number", unit: "U/L", required: true },
      "ALP": { type: "number", unit: "U/L", required: true },
      "Total Protein": { type: "number", unit: "g/dl", required: true },
      "Albumin": { type: "number", unit: "g/dl", required: true },
      "Bilirubin (Total)": { type: "number", unit: "mg/dl", required: true },
      "Bilirubin (Direct)": { type: "number", unit: "mg/dl", required: true },
      "Uric Acid": { type: "number", unit: "mg/dl", required: true }
    }
  },

  // 6. BACTERIOLOGY
  {
    name: "Bacteriology Culture & Sensitivity",
    category: "Bacteriology",
    description: "Bacterial culture and sensitivity testing including AFB",
    fields: {
      "Gram Stain": { type: "textarea", required: true },
      "Culture": { type: "textarea", required: true },
      "Sensitivity Test (C/S)": { type: "textarea", required: true },
      "Wet Mount": { type: "textarea", required: false },
      "AFB 1st": { type: "select", options: ["Positive", "Negative"], required: false },
      "AFB 2nd": { type: "select", options: ["Positive", "Negative"], required: false },
      "AFB 3rd": { type: "select", options: ["Positive", "Negative"], required: false }
    }
  },

  // 7. PARASITOLOGY
  {
    name: "Parasitology Examination",
    category: "Parasitology",
    description: "Parasitology examination including stool microscopy and blood film for malarial parasite",
    fields: {
      "Stool Microscopy": { type: "textarea", required: true },
      "Blood Film for Malarial Parasite": { type: "select", options: ["Positive", "Negative"], required: true },
      "Occult Blood": { type: "select", options: ["Positive", "Negative"], required: false },
      "Concentration Method": { type: "textarea", required: false }
    }
  }
];

async function seedLabTemplates() {
  try {
    console.log('🧪 Starting lab templates seeding...');

    // Clear existing templates and related records
    await prisma.detailedLabResult.deleteMany({});
    await prisma.labTestTemplate.deleteMany({});
    console.log('✅ Cleared existing lab templates and related records');

    // Create new templates
    for (const template of labTemplates) {
      await prisma.labTestTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          description: template.description,
          fields: template.fields,
          isActive: true
        }
      });
      console.log(`✅ Created template: ${template.name}`);
    }

    console.log('🎉 All lab templates seeded successfully!');
    console.log(`📊 Total templates created: ${labTemplates.length}`);

    // Display summary
    console.log('\n📋 Lab Templates Summary:');
    labTemplates.forEach((template, index) => {
      const fieldCount = Object.keys(template.fields).length;
      console.log(`${index + 1}. ${template.name} (${template.category}) - ${fieldCount} fields`);
    });

  } catch (error) {
    console.error('❌ Error seeding lab templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedLabTemplates()
  .then(() => {
    console.log('✅ Lab templates seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Lab templates seeding failed:', error);
    process.exit(1);
  });
