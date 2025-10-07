const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedLabTemplates() {
  try {
    console.log('🧪 Seeding lab test templates...');

    // Clear existing templates
    await prisma.labTestTemplate.deleteMany({});
    console.log('✅ Cleared existing lab templates');

    // 1. Hematology Templates
    const hematologyTemplates = [
      {
        name: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        description: 'Complete blood count with differential',
        fields: [
          {
            name: 'hgb',
            label: 'Hemoglobin (g/dL)',
            type: 'number',
            min: 8.0,
            max: 20.0,
            step: 0.1,
            unit: 'g/dL',
            normalRange: '12-16 (F), 14-18 (M)',
            required: true
          },
          {
            name: 'hct',
            label: 'Hematocrit (PCV %)',
            type: 'number',
            min: 20.0,
            max: 60.0,
            step: 0.1,
            unit: '%',
            normalRange: '36-46 (F), 42-52 (M)',
            required: true
          },
          {
            name: 'wbc',
            label: 'WBC × 10³/µl',
            type: 'number',
            min: 2.0,
            max: 20.0,
            step: 0.1,
            unit: '× 10³/µl',
            normalRange: '4.5-11.0',
            required: true
          },
          {
            name: 'neutrophils',
            label: 'Neutrophils (%)',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            unit: '%',
            normalRange: '40-70',
            required: true
          },
          {
            name: 'lymphocytes',
            label: 'Lymphocytes (%)',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            unit: '%',
            normalRange: '20-40',
            required: true
          },
          {
            name: 'monocytes',
            label: 'Monocytes (%)',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            unit: '%',
            normalRange: '2-8',
            required: true
          },
          {
            name: 'eosinophils',
            label: 'Eosinophils (%)',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            unit: '%',
            normalRange: '1-4',
            required: true
          },
          {
            name: 'basophils',
            label: 'Basophils (%)',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            unit: '%',
            normalRange: '0-1',
            required: true
          },
          {
            name: 'rbc',
            label: 'RBC × 10⁶/µl',
            type: 'number',
            min: 2.0,
            max: 8.0,
            step: 0.01,
            unit: '× 10⁶/µl',
            normalRange: '4.0-5.2 (F), 4.5-5.9 (M)',
            required: true
          },
          {
            name: 'platelets',
            label: 'Platelets × 10³/µl',
            type: 'number',
            min: 50,
            max: 800,
            step: 1,
            unit: '× 10³/µl',
            normalRange: '150-450',
            required: true
          },
          {
            name: 'mcv',
            label: 'MCV (fl)',
            type: 'number',
            min: 60,
            max: 120,
            step: 0.1,
            unit: 'fl',
            normalRange: '80-100',
            required: true
          },
          {
            name: 'mch',
            label: 'MCH (pg)',
            type: 'number',
            min: 20,
            max: 40,
            step: 0.1,
            unit: 'pg',
            normalRange: '27-33',
            required: true
          },
          {
            name: 'mchc',
            label: 'MCHC (g/dL)',
            type: 'number',
            min: 25,
            max: 40,
            step: 0.1,
            unit: 'g/dL',
            normalRange: '32-36',
            required: true
          },
          {
            name: 'bloodGroup',
            label: 'Blood Group',
            type: 'select',
            options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            required: true
          },
          {
            name: 'rh',
            label: 'Rh Factor',
            type: 'select',
            options: ['Positive', 'Negative'],
            required: true
          },
          {
            name: 'esr',
            label: 'ESR (mm/hr)',
            type: 'number',
            min: 0,
            max: 100,
            step: 1,
            unit: 'mm/hr',
            normalRange: '0-20 (M), 0-30 (F)',
            required: false
          },
          {
            name: 'pt',
            label: 'Prothrombin Time (PT)',
            type: 'number',
            min: 8,
            max: 20,
            step: 0.1,
            unit: 'seconds',
            normalRange: '11-13',
            required: false
          },
          {
            name: 'ptt',
            label: 'Partial Thromboplastin Time (PTT)',
            type: 'number',
            min: 20,
            max: 50,
            step: 0.1,
            unit: 'seconds',
            normalRange: '25-35',
            required: false
          },
          {
            name: 'monophasicTest',
            label: 'Monophasic Test',
            type: 'select',
            options: ['Normal', 'Abnormal', 'Not Done'],
            required: false
          },
          {
            name: 'bloodFilm',
            label: 'Blood Film',
            type: 'text',
            placeholder: 'Describe blood film findings',
            required: false
          }
        ]
      }
    ];

    // 2. Urinalysis Template
    const urinalysisTemplate = {
      name: 'Urinalysis',
      category: 'Urinalysis',
      description: 'Complete urinalysis examination',
      fields: [
        {
          name: 'color',
          label: 'Color',
          type: 'select',
          options: ['Yellow', 'Pale', 'Dark', 'Red', 'Brown', 'Orange', 'Green', 'Other'],
          required: true
        },
        {
          name: 'consistency',
          label: 'Consistency',
          type: 'select',
          options: ['Clear', 'Slightly Cloudy', 'Cloudy', 'Turbid'],
          required: true
        },
        {
          name: 'specificGravity',
          label: 'Specific Gravity',
          type: 'number',
          min: 1.000,
          max: 1.040,
          step: 0.001,
          unit: '',
          normalRange: '1.005-1.030',
          required: true
        },
        {
          name: 'ph',
          label: 'pH',
          type: 'number',
          min: 4.5,
          max: 8.5,
          step: 0.1,
          unit: '',
          normalRange: '4.5-8.0',
          required: true
        },
        {
          name: 'albumin',
          label: 'Albumin',
          type: 'select',
          options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
          required: true
        },
        {
          name: 'sugar',
          label: 'Sugar',
          type: 'select',
          options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
          required: true
        },
        {
          name: 'bileSalt',
          label: 'Bile Salt',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: true
        },
        {
          name: 'bilePigment',
          label: 'Bile Pigment',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: true
        },
        {
          name: 'urobilinogen',
          label: 'Urobilinogen',
          type: 'select',
          options: ['Normal', 'Increased', 'Decreased'],
          required: true
        },
        {
          name: 'ketoneBodies',
          label: 'Ketone Bodies',
          type: 'select',
          options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
          required: true
        },
        {
          name: 'protein',
          label: 'Protein',
          type: 'select',
          options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
          required: true
        },
        {
          name: 'blood',
          label: 'Blood',
          type: 'select',
          options: ['Negative', 'Trace', '1+', '2+', '3+', '4+'],
          required: true
        },
        {
          name: 'cast',
          label: 'Cast',
          type: 'text',
          placeholder: 'Describe cast findings',
          required: false
        },
        {
          name: 'crystals',
          label: 'Crystals',
          type: 'text',
          placeholder: 'Describe crystal findings',
          required: false
        },
        {
          name: 'epithelialCells',
          label: 'Epithelial Cells',
          type: 'select',
          options: ['None', 'Few', 'Moderate', 'Many'],
          required: true
        },
        {
          name: 'wbcHpf',
          label: 'WBC / HPF',
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
          unit: '/HPF',
          normalRange: '0-5',
          required: true
        },
        {
          name: 'rbcHpf',
          label: 'RBC / HPF',
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
          unit: '/HPF',
          normalRange: '0-3',
          required: true
        },
        {
          name: 'abf',
          label: 'ABF',
          type: 'text',
          placeholder: 'Additional findings',
          required: false
        },
        {
          name: 'parasiteLpf',
          label: 'Parasite / LPF',
          type: 'text',
          placeholder: 'Parasite findings',
          required: false
        }
      ]
    };

    // 3. Stool Examination Template
    const stoolTemplate = {
      name: 'Stool Examination',
      category: 'Stool',
      description: 'Stool examination for parasites and other findings',
      fields: [
        {
          name: 'consistency',
          label: 'Consistency',
          type: 'select',
          options: ['Formed', 'Semi-formed', 'Loose', 'Watery', 'Hard'],
          required: true
        },
        {
          name: 'color',
          label: 'Color',
          type: 'select',
          options: ['Brown', 'Yellow', 'Green', 'Black', 'Red', 'Pale'],
          required: true
        },
        {
          name: 'microscopy',
          label: 'Microscopy',
          type: 'text',
          placeholder: 'Microscopic findings',
          required: true
        },
        {
          name: 'parasites',
          label: 'Parasites',
          type: 'text',
          placeholder: 'Parasite findings',
          required: false
        },
        {
          name: 'occultBlood',
          label: 'Occult Blood',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: true
        }
      ]
    };

    // 4. Blood Chemistry Template
    const bloodChemistryTemplate = {
      name: 'Blood Chemistry Panel',
      category: 'Blood Chemistry',
      description: 'Comprehensive blood chemistry analysis',
      fields: [
        {
          name: 'bloodSugar',
          label: 'Blood Sugar (mg/dL)',
          type: 'number',
          min: 50,
          max: 500,
          step: 1,
          unit: 'mg/dL',
          normalRange: '70-100 (Fasting)',
          required: true
        },
        {
          name: 'totalBilirubin',
          label: 'Total Bilirubin (mg/dL)',
          type: 'number',
          min: 0,
          max: 10,
          step: 0.1,
          unit: 'mg/dL',
          normalRange: '0.3-1.2',
          required: true
        },
        {
          name: 'directBilirubin',
          label: 'Direct Bilirubin (mg/dL)',
          type: 'number',
          min: 0,
          max: 5,
          step: 0.1,
          unit: 'mg/dL',
          normalRange: '0.1-0.3',
          required: true
        },
        {
          name: 'sgot',
          label: 'SGOT/AST (U/L)',
          type: 'number',
          min: 5,
          max: 200,
          step: 1,
          unit: 'U/L',
          normalRange: '10-40',
          required: true
        },
        {
          name: 'sgpt',
          label: 'SGPT/ALT (U/L)',
          type: 'number',
          min: 5,
          max: 200,
          step: 1,
          unit: 'U/L',
          normalRange: '10-40',
          required: true
        },
        {
          name: 'alkalinePhosphatase',
          label: 'Alkaline Phosphatase (U/L)',
          type: 'number',
          min: 20,
          max: 300,
          step: 1,
          unit: 'U/L',
          normalRange: '44-147',
          required: true
        },
        {
          name: 'uricAcid',
          label: 'Uric Acid (mg/dL)',
          type: 'number',
          min: 2,
          max: 15,
          step: 0.1,
          unit: 'mg/dL',
          normalRange: '3.5-7.0 (M), 2.5-6.0 (F)',
          required: true
        },
        {
          name: 'creatinine',
          label: 'Creatinine (mg/dL)',
          type: 'number',
          min: 0.3,
          max: 5,
          step: 0.01,
          unit: 'mg/dL',
          normalRange: '0.7-1.3 (M), 0.6-1.1 (F)',
          required: true
        },
        {
          name: 'bun',
          label: 'BUN (mg/dL)',
          type: 'number',
          min: 5,
          max: 50,
          step: 1,
          unit: 'mg/dL',
          normalRange: '7-20',
          required: true
        },
        {
          name: 'cholesterol',
          label: 'Cholesterol (mg/dL)',
          type: 'number',
          min: 100,
          max: 400,
          step: 1,
          unit: 'mg/dL',
          normalRange: '<200',
          required: true
        }
      ]
    };

    // 5. Serology Template
    const serologyTemplate = {
      name: 'Serology Panel',
      category: 'Serology',
      description: 'Serological tests for infectious diseases',
      fields: [
        {
          name: 'vdrl',
          label: 'VDRL',
          type: 'select',
          options: ['Non-reactive', 'Reactive', 'Weakly Reactive'],
          required: true
        },
        {
          name: 'rpr',
          label: 'RPR',
          type: 'select',
          options: ['Non-reactive', 'Reactive', 'Weakly Reactive'],
          required: true
        },
        {
          name: 'hiv',
          label: 'HIV',
          type: 'select',
          options: ['Negative', 'Positive', 'Indeterminate'],
          required: true
        },
        {
          name: 'hbsag',
          label: 'HBsAg',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: true
        },
        {
          name: 'hcv',
          label: 'HCV',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: true
        },
        {
          name: 'hPylori',
          label: 'H. Pylori',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: true
        },
        {
          name: 'widal',
          label: 'Widal Test',
          type: 'text',
          placeholder: 'Widal test results',
          required: false
        },
        {
          name: 'aso',
          label: 'ASO Titre',
          type: 'number',
          min: 0,
          max: 2000,
          step: 1,
          unit: 'IU/mL',
          normalRange: '<200',
          required: false
        },
        {
          name: 'rf',
          label: 'Rheumatoid Factor (RF)',
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
          unit: 'IU/mL',
          normalRange: '<20',
          required: false
        },
        {
          name: 'pregnancyTest',
          label: 'Pregnancy Test (HCG)',
          type: 'select',
          options: ['Negative', 'Positive'],
          required: false
        },
        {
          name: 'fict',
          label: 'FICT',
          type: 'text',
          placeholder: 'FICT results',
          required: false
        }
      ]
    };

    // 6. Bacteriology Template
    const bacteriologyTemplate = {
      name: 'Bacteriology Examination',
      category: 'Bacteriology',
      description: 'Bacteriological examination and culture',
      fields: [
        {
          name: 'csfExam',
          label: 'CSF Examination',
          type: 'text',
          placeholder: 'CSF examination findings',
          required: false
        },
        {
          name: 'gramStain',
          label: 'Gram Stain',
          type: 'text',
          placeholder: 'Gram stain findings',
          required: false
        },
        {
          name: 'afb1',
          label: 'AFB (1st)',
          type: 'select',
          options: ['Negative', 'Positive', 'Scanty'],
          required: false
        },
        {
          name: 'afb2',
          label: 'AFB (2nd)',
          type: 'select',
          options: ['Negative', 'Positive', 'Scanty'],
          required: false
        },
        {
          name: 'afb3',
          label: 'AFB (3rd)',
          type: 'select',
          options: ['Negative', 'Positive', 'Scanty'],
          required: false
        },
        {
          name: 'wetMount',
          label: 'Wet Mount',
          type: 'text',
          placeholder: 'Wet mount findings',
          required: false
        },
        {
          name: 'cultureSensitivity',
          label: 'Culture and Sensitivity',
          type: 'text',
          placeholder: 'Culture and sensitivity results',
          required: false
        }
      ]
    };

    // Create all templates
    const allTemplates = [
      ...hematologyTemplates,
      urinalysisTemplate,
      stoolTemplate,
      bloodChemistryTemplate,
      serologyTemplate,
      bacteriologyTemplate
    ];

    for (const template of allTemplates) {
      await prisma.labTestTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          description: template.description,
          fields: template.fields
        }
      });
      console.log(`✅ Created template: ${template.name}`);
    }

    console.log(`\n🎉 Successfully seeded ${allTemplates.length} lab test templates!`);
    
  } catch (error) {
    console.error('❌ Error seeding lab templates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLabTemplates();
