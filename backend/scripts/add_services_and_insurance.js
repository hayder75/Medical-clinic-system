const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addServicesAndInsurance() {
  try {
    console.log('🚀 Adding services and insurance companies...');

    // Add Lab Services
    const labServices = [
      // Hematology
      { code: 'CBC001', name: 'Complete Blood Count (CBC)', category: 'LAB', price: 15.00, description: 'Complete blood count with differential' },
      { code: 'ESR001', name: 'Erythrocyte Sedimentation Rate (ESR)', category: 'LAB', price: 12.50, description: 'ESR test for inflammation markers' },
      { code: 'PT001', name: 'Prothrombin Time (PT)', category: 'LAB', price: 18.00, description: 'Prothrombin time test' },
      { code: 'PTT001', name: 'Partial Thromboplastin Time (PTT)', category: 'LAB', price: 19.50, description: 'Partial thromboplastin time test' },
      { code: 'IRON001', name: 'Iron Studies', category: 'LAB', price: 35.00, description: 'Complete iron studies panel' },
      
      // Biochemistry
      { code: 'BMP001', name: 'Basic Metabolic Panel', category: 'LAB', price: 25.00, description: 'Basic metabolic panel' },
      { code: 'CMP001', name: 'Comprehensive Metabolic Panel', category: 'LAB', price: 45.00, description: 'Comprehensive metabolic panel' },
      { code: 'CRP001', name: 'C-Reactive Protein', category: 'LAB', price: 20.00, description: 'C-Reactive Protein test' },
      
      // Immunology & Serology
      { code: 'HIV001', name: 'HIV Antibody Test', category: 'LAB', price: 35.00, description: 'HIV antibody screening test' },
      { code: 'HBS001', name: 'Hepatitis B Surface Antigen', category: 'LAB', price: 28.00, description: 'Hepatitis B surface antigen test' }
    ];

    // Add Radiology Services
    const radiologyServices = [
      // General X-Ray
      { code: 'XR001', name: 'X-Ray Chest PA View', category: 'RADIOLOGY', price: 45.00, description: 'Chest X-ray PA view' },
      { code: 'XR002', name: 'X-Ray Extremity', category: 'RADIOLOGY', price: 35.00, description: 'X-ray of extremities' },
      { code: 'XR003', name: 'X-Ray Spine', category: 'RADIOLOGY', price: 55.00, description: 'Spinal X-ray' },
      { code: 'XR004', name: 'X-Ray Abdomen', category: 'RADIOLOGY', price: 50.00, description: 'Abdominal X-ray' },
      { code: 'XR005', name: 'X-Ray Skull', category: 'RADIOLOGY', price: 60.00, description: 'Skull X-ray' },
      
      // Ultrasound
      { code: 'US001', name: 'Abdominal Ultrasound', category: 'RADIOLOGY', price: 120.00, description: 'Abdominal ultrasound examination' },
      { code: 'US002', name: 'Pelvic Ultrasound', category: 'RADIOLOGY', price: 110.00, description: 'Pelvic ultrasound examination' },
      { code: 'US003', name: 'Obstetric Ultrasound', category: 'RADIOLOGY', price: 130.00, description: 'Obstetric ultrasound examination' },
      { code: 'US004', name: 'Thyroid Ultrasound', category: 'RADIOLOGY', price: 100.00, description: 'Thyroid ultrasound examination' },
      { code: 'US005', name: 'Breast Ultrasound', category: 'RADIOLOGY', price: 115.00, description: 'Breast ultrasound examination' },
      { code: 'US006', name: 'Doppler Ultrasound', category: 'RADIOLOGY', price: 140.00, description: 'Doppler ultrasound examination' },
      
      // CT Scan
      { code: 'CT001', name: 'CT Head without Contrast', category: 'RADIOLOGY', price: 250.00, description: 'CT scan of head without contrast' },
      { code: 'CT002', name: 'CT Head with Contrast', category: 'RADIOLOGY', price: 300.00, description: 'CT scan of head with contrast' }
    ];

    // Add Doctor Consultation Services
    const doctorServices = [
      { code: 'CONS001', name: 'General Doctor Consultation', category: 'CONSULTATION', price: 100.00, description: 'General doctor consultation fee' },
      { code: 'CONS002', name: 'Specialist Consultation', category: 'CONSULTATION', price: 150.00, description: 'Specialist doctor consultation fee' }
    ];

    // Combine all services
    const allServices = [...labServices, ...radiologyServices, ...doctorServices];

    // Add services to database
    console.log('📋 Adding services to database...');
    for (const service of allServices) {
      try {
        await prisma.service.upsert({
          where: { code: service.code },
          update: {
            name: service.name,
            category: service.category,
            price: service.price,
            description: service.description,
            isActive: true
          },
          create: {
            code: service.code,
            name: service.name,
            category: service.category,
            price: service.price,
            description: service.description,
            isActive: true
          }
        });
        console.log(`✅ Added: ${service.name} (${service.code}) - ETB ${service.price}`);
      } catch (error) {
        console.error(`❌ Error adding ${service.name}:`, error.message);
      }
    }

    // Add Insurance Companies
    console.log('\n🏥 Adding insurance companies...');
    const insuranceCompanies = [
      {
        name: 'Ethiopian Telecom',
        code: 'ETC001',
        contactInfo: 'Insurance Manager - +251-11-123-4567 - insurance@ethiotelecom.et - Addis Ababa, Ethiopia',
        isActive: true
      },
      {
        name: 'Test Insurance',
        code: 'TEST001',
        contactInfo: 'Test Manager - +251-11-987-6543 - test@testinsurance.et - Addis Ababa, Ethiopia',
        isActive: true
      }
    ];

    for (const insurance of insuranceCompanies) {
      try {
        await prisma.insurance.upsert({
          where: { code: insurance.code },
          update: {
            name: insurance.name,
            contactInfo: insurance.contactInfo,
            isActive: insurance.isActive
          },
          create: {
            code: insurance.code,
            name: insurance.name,
            contactInfo: insurance.contactInfo,
            isActive: insurance.isActive
          }
        });
        console.log(`✅ Added insurance: ${insurance.name} (${insurance.code})`);
      } catch (error) {
        console.error(`❌ Error adding insurance ${insurance.name}:`, error.message);
      }
    }

    // Display summary
    const totalServices = await prisma.service.count();
    const totalInsurance = await prisma.insurance.count();
    
    console.log('\n📊 Summary:');
    console.log(`✅ Total services in database: ${totalServices}`);
    console.log(`✅ Total insurance companies: ${totalInsurance}`);
    console.log('\n🎉 All services and insurance companies added successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

addServicesAndInsurance();
