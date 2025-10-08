const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDentistWithEntryPrice() {
  try {
    console.log('🦷 Creating dentist with entry price...');

    // Create dentist user
    let dentist = await prisma.user.findUnique({
      where: { username: 'dentist_entry' }
    });

    if (!dentist) {
      dentist = await prisma.user.create({
        data: {
          fullname: 'Dr. Dental Specialist',
          username: 'dentist_entry',
          password: await bcrypt.hash('dentist123', 10),
          email: 'dental.specialist@clinic.com',
          phone: '+251911234570',
          role: 'DOCTOR',
          specialties: ['Dentist'],
          licenseNumber: 'DENT-ENTRY-001',
          consultationFee: 500, // Entry price for dental consultation
          availability: true
        }
      });
      console.log(`✅ Created dentist: ${dentist.fullname} with entry price: ${dentist.consultationFee} ETB`);
    } else {
      // Update existing dentist with entry price
      dentist = await prisma.user.update({
        where: { id: dentist.id },
        data: { consultationFee: 500 }
      });
      console.log(`✅ Updated dentist: ${dentist.fullname} with entry price: ${dentist.consultationFee} ETB`);
    }

    // Create dental-specific services
    console.log('🦷 Creating dental-specific services...');

    const dentalServices = [
      {
        code: 'DENTAL_CONSULTATION',
        name: 'Dental Consultation',
        category: 'CONSULTATION',
        price: 500,
        description: 'Initial dental consultation and examination'
      },
      {
        code: 'DENTAL_XRAY_PANORAMIC',
        name: 'Panoramic X-Ray',
        category: 'RADIOLOGY',
        price: 300,
        description: 'Full mouth panoramic X-ray for dental assessment'
      },
      {
        code: 'DENTAL_XRAY_BITEWING',
        name: 'Bitewing X-Ray',
        category: 'RADIOLOGY',
        price: 150,
        description: 'Bitewing X-ray for posterior teeth examination'
      },
      {
        code: 'DENTAL_XRAY_PERIAPICAL',
        name: 'Periapical X-Ray',
        category: 'RADIOLOGY',
        price: 100,
        description: 'Periapical X-ray for individual tooth assessment'
      },
      {
        code: 'DENTAL_XRAY_CBCT',
        name: 'CBCT Scan',
        category: 'RADIOLOGY',
        price: 800,
        description: 'Cone Beam CT scan for detailed dental imaging'
      },
      {
        code: 'DENTAL_LAB_CULTURE',
        name: 'Dental Culture & Sensitivity',
        category: 'LAB',
        price: 200,
        description: 'Bacterial culture and sensitivity test for dental infections'
      },
      {
        code: 'DENTAL_LAB_BIOMARKER',
        name: 'Dental Biomarker Test',
        category: 'LAB',
        price: 350,
        description: 'Biomarker test for periodontal disease assessment'
      },
      {
        code: 'DENTAL_LAB_SALIVA',
        name: 'Saliva Analysis',
        category: 'LAB',
        price: 150,
        description: 'Comprehensive saliva analysis for oral health'
      }
    ];

    for (const service of dentalServices) {
      // Check if service already exists
      const existingService = await prisma.service.findUnique({
        where: { code: service.code }
      });

      if (existingService) {
        console.log(`✅ Service ${service.code} already exists`);
        continue;
      }

      const createdService = await prisma.service.create({
        data: service
      });

      console.log(`✅ Created service: ${createdService.name} - ${createdService.price} ETB`);
    }

    // Create dental-specific investigation types
    console.log('🦷 Creating dental investigation types...');

    const dentalInvestigations = [
      {
        name: 'Panoramic X-Ray',
        price: 300,
        category: 'RADIOLOGY',
        serviceCode: 'DENTAL_XRAY_PANORAMIC'
      },
      {
        name: 'Bitewing X-Ray',
        price: 150,
        category: 'RADIOLOGY',
        serviceCode: 'DENTAL_XRAY_BITEWING'
      },
      {
        name: 'Periapical X-Ray',
        price: 100,
        category: 'RADIOLOGY',
        serviceCode: 'DENTAL_XRAY_PERIAPICAL'
      },
      {
        name: 'CBCT Scan',
        price: 800,
        category: 'RADIOLOGY',
        serviceCode: 'DENTAL_XRAY_CBCT'
      },
      {
        name: 'Dental Culture & Sensitivity',
        price: 200,
        category: 'LAB',
        serviceCode: 'DENTAL_LAB_CULTURE'
      },
      {
        name: 'Dental Biomarker Test',
        price: 350,
        category: 'LAB',
        serviceCode: 'DENTAL_LAB_BIOMARKER'
      },
      {
        name: 'Saliva Analysis',
        price: 150,
        category: 'LAB',
        serviceCode: 'DENTAL_LAB_SALIVA'
      }
    ];

    for (const investigation of dentalInvestigations) {
      // Find the corresponding service
      const service = await prisma.service.findUnique({
        where: { code: investigation.serviceCode }
      });

      if (!service) {
        console.log(`❌ Service ${investigation.serviceCode} not found for investigation ${investigation.name}`);
        continue;
      }

      // Check if investigation already exists
      const existingInvestigation = await prisma.investigationType.findFirst({
        where: { 
          name: investigation.name,
          category: investigation.category
        }
      });

      if (existingInvestigation) {
        console.log(`✅ Investigation ${investigation.name} already exists`);
        continue;
      }

      const createdInvestigation = await prisma.investigationType.create({
        data: {
          name: investigation.name,
          price: investigation.price,
          category: investigation.category,
          serviceId: service.id
        }
      });

      console.log(`✅ Created investigation: ${createdInvestigation.name} - ${createdInvestigation.price} ETB`);
    }

    console.log('🎉 Dental services and investigations created successfully!');
    console.log('\n📋 Login credentials for dentist:');
    console.log('Username: dentist_entry, Password: dentist123');
    console.log('Entry Price: 500 ETB');

  } catch (error) {
    console.error('❌ Error creating dental services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDentistWithEntryPrice();
