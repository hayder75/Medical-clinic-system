const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Templates extracted from the document
// Mapping: name can be used to search, but we'll also try alternative names if exact match fails
const templates = [
  {
    name: 'Abdominal Ultrasound',
    alternativeNames: ['Ultrasound - Abdomen', 'Abdomen Ultrasound'], // Add alternative names for matching
    findings: `Liver is normal in size, shape, and parenchymal echogenicity with smooth contour and sharp margins. No focal lesion. Portal and hepatic veins are normal.
Gallbladder is normal in size and wall thickness. No gallstones or mass lesion. Intrahepatic and extrahepatic bile ducts are normal.
Pancreas is normal in size and echotexture. No focal lesion or ductal dilatation.
Spleen is normal in size and echopattern. No focal lesion.
Both kidneys are normal in size, shape, position, and echotexture. Corticomedullary differentiation is preserved. No calculus or hydronephrosis.
Bowel loops and stomach show normal wall thickness and caliber.
No free intraperitoneal fluid or significant lymphadenopathy.
Abdominal aorta and IVC are normal in caliber.
Urinary bladder: ☐ Well distended ☐ Collapsed.`,
    conclusion: `Normal abdominal ultrasound study.`
  },
  {
    name: 'Ultrasound - Pelvis',
    code: 'US002',
    findings: `Urinary bladder is adequately filled with anechoic urine and has normal wall thickness.
Uterus is normal in size, shape, position, and echotexture.
No focal myometrial lesion.
Endometrium has normal thickness and echotexture with smooth endomyometrial interface.
Both adnexa are unremarkable.
No pelvic free fluid.`,
    conclusion: `Unremarkable pelvic ultrasound study.`
  },
  {
    name: 'Abdomino-Pelvic Ultrasound (Female)',
    code: 'US007',
    findings: `Abdominal organs are normal in appearance.
Urinary bladder is well distended with normal wall thickness.
Uterus is normal in size, shape, and echotexture.
Endometrium is normal in thickness; cavity is empty.
No focal myometrial lesion.
Adnexa are free bilaterally.
No free fluid or significant lymphadenopathy.`,
    conclusion: `Normal abdomino-pelvic ultrasound study.`
  },
  {
    name: 'Abdomino-Pelvic Ultrasound (Male)',
    code: 'US008',
    findings: `Abdominal organs are normal.
Urinary bladder is well distended with normal wall thickness.
Prostate gland is normal in size, contour, and echotexture.
No free fluid or lymphadenopathy.`,
    conclusion: `Normal abdomino-pelvic ultrasound study.`
  },
  {
    name: 'Obstetric Ultrasound',
    code: 'US003',
    findings: `Single live intrauterine pregnancy.
Fetal heart activity present.
Fetal movements seen.
Presentation: ☐ Cephalic ☐ Breech.
Placenta location: ☐ Anterior ☐ Posterior ☐ Fundal.
Amniotic fluid volume is adequate.
Fetal bladder is visualized.
No gross congenital anomaly detected.
Gestational Age:
BPD: ___ weeks ___ days
FL: ___ weeks ___ days`,
    conclusion: `Viable intrauterine pregnancy consistent with gestational age.`
  },
  {
    name: 'Breast Ultrasound',
    code: 'US005',
    findings: `Breast parenchyma shows normal echotexture.
No solid or cystic mass lesion identified.
No architectural distortion.
No ductal dilatation.
Axillary lymph nodes are not enlarged.
BI-RADS Category:
1 (Negative)`,
    conclusion: `Normal bilateral breast ultrasound study.`
  },
  {
    name: 'Thyroid Ultrasound',
    code: 'US004',
    findings: `Thyroid gland is normal in size and echotexture.
No focal nodule or cyst.
Isthmus thickness is normal.
No enlarged cervical lymph nodes.`,
    conclusion: `Normal thyroid ultrasound study.`
  },
  {
    name: 'Doppler Ultrasound',
    code: 'US006',
    findings: `Type: ☐ Arterial ☐ Venous ☐ Duplex
Region Examined: ___________________________

Examined vessels show normal caliber and course.
Normal color flow and spectral waveform.
Normal compressibility (for venous studies).
No intraluminal thrombus.
No abnormal turbulence.`,
    conclusion: `Normal Doppler ultrasound study.`
  },
  {
    name: 'Transvaginal Ultrasound (TVS)',
    code: 'US009',
    findings: `Uterus is normal in size and echotexture.`,
    conclusion: `Normal transvaginal ultrasound study.`
  }
];

async function populateTemplates() {
  try {
    console.log('🔍 Populating radiology templates from document...\n');

    for (const template of templates) {
      // Find the investigation type - try main name first, then alternatives
      let invType = await prisma.investigationType.findFirst({
        where: {
          name: {
            contains: template.name,
            mode: 'insensitive'
          },
          category: 'RADIOLOGY'
        },
        include: {
          service: {
            select: {
              code: true
            }
          }
        }
      });

      // If not found, try alternative names
      if (!invType && template.alternativeNames) {
        for (const altName of template.alternativeNames) {
          invType = await prisma.investigationType.findFirst({
            where: {
              name: {
                contains: altName,
                mode: 'insensitive'
              },
              category: 'RADIOLOGY'
            },
            include: {
              service: {
                select: {
                  code: true
                }
              }
            }
          });
          if (invType) {
            console.log(`   ℹ️  Found using alternative name: "${altName}"`);
            break;
          }
        }
      }

      if (!invType) {
        console.log(`⚠️  InvestigationType not found: ${template.name}`);
        if (template.alternativeNames) {
          console.log(`    Tried alternatives: ${template.alternativeNames.join(', ')}`);
        }
        continue;
      }

      console.log(`📝 Processing: ${invType.name} (ID: ${invType.id})`);

      // Check if template already exists
      const existingTemplate = await prisma.radiologyTemplate.findUnique({
        where: { investigationTypeId: invType.id }
      });

      if (existingTemplate) {
        // Update existing template
        await prisma.radiologyTemplate.update({
          where: { investigationTypeId: invType.id },
          data: {
            findingsTemplate: template.findings,
            conclusionTemplate: template.conclusion,
            isActive: true
          }
        });
        console.log(`   ✅ Updated template for ${invType.name}`);
      } else {
        // Create new template
        await prisma.radiologyTemplate.create({
          data: {
            investigationTypeId: invType.id,
            findingsTemplate: template.findings,
            conclusionTemplate: template.conclusion,
            isActive: true
          }
        });
        console.log(`   ✅ Created template for ${invType.name}`);
      }
    }

    console.log('\n✅ All templates populated successfully!');

    // Show final list
    const allTemplates = await prisma.radiologyTemplate.findMany({
      include: {
        investigationType: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        investigationType: {
          name: 'asc'
        }
      }
    });

    console.log(`\n📋 Final templates in database (${allTemplates.length} total):`);
    allTemplates.forEach((t, i) => {
      const findingsLen = t.findingsTemplate?.length || 0;
      const conclusionLen = t.conclusionTemplate?.length || 0;
      console.log(`   ${i + 1}. ${t.investigationType.name} - Findings: ${findingsLen} chars, Conclusion: ${conclusionLen} chars`);
    });

  } catch (error) {
    console.error('❌ Error populating templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateTemplates()
  .then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Failed:', error);
    process.exit(1);
  });

