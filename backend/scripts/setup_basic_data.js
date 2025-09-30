const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupBasicData() {
  try {
    console.log('🔧 Setting up basic data...');

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await prisma.user.createMany({
      data: [
        {
          id: '1515158c-b80d-48cb-a530-a8a32da7cd59',
          fullname: 'Dr. Hayder',
          username: 'hayder',
          email: 'hayder@clinic.com',
          password: hashedPassword,
          role: 'DOCTOR',
          specialties: ['General Doctor'],
          consultationFee: 500,
          phone: '0912345678'
        },
        {
          id: '533c4c75-983d-452a-adcb-8091bb3bd03b',
          fullname: 'Pharmacy Staff',
          username: 'pharmacy',
          email: 'pharmacy@clinic.com',
          password: hashedPassword,
          role: 'PHARMACIST',
          phone: '0912345679'
        },
        {
          id: 'nurse-123',
          fullname: 'Nurse Jane',
          username: 'nurse',
          email: 'nurse@clinic.com',
          password: hashedPassword,
          role: 'NURSE',
          phone: '0912345680'
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Users created');

    // Create medication catalog
    const medications = await prisma.medicationCatalog.createMany({
      data: [
        {
          name: 'Salbutamol',
          genericName: 'Albuterol',
          dosageForm: 'Inhaler',
          strength: '100mcg',
          category: 'INHALERS',
          unitPrice: 8.0,
          availableQuantity: 100,
          minimumStock: 10,
          manufacturer: 'Generic Pharma'
        },
        {
          name: 'Ibuprofen',
          genericName: 'Ibuprofen',
          dosageForm: 'Tablet',
          strength: '400mg',
          category: 'TABLETS',
          unitPrice: 0.5,
          availableQuantity: 200,
          minimumStock: 20,
          manufacturer: 'Generic Pharma'
        },
        {
          name: 'Amoxicillin',
          genericName: 'Amoxicillin',
          dosageForm: 'Capsule',
          strength: '500mg',
          category: 'CAPSULES',
          unitPrice: 2.5,
          availableQuantity: 150,
          minimumStock: 15,
          manufacturer: 'Generic Pharma'
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Medication catalog created');

    // Create a test patient
    const patient = await prisma.patient.create({
      data: {
        id: 'PAT-2025-01',
        name: 'Hanan Test',
        email: 'hanan@test.com',
        mobile: '0912345678',
        dob: new Date('1990-01-01'),
        gender: 'FEMALE',
        bloodType: 'O_PLUS',
        type: 'REGULAR'
      }
    });

    console.log('✅ Test patient created:', patient.name);

    // Create a visit
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        visitUid: 'VISIT-20250930-5573',
        status: 'AWAITING_RESULTS_REVIEW',
        queueType: 'RESULTS_REVIEW',
        assignmentId: 1
      }
    });

    console.log('✅ Test visit created:', visit.visitUid);

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        id: 1,
        patientId: patient.id,
        doctorId: '1515158c-b80d-48cb-a530-a8a32da7cd59',
        status: 'Active'
      }
    });

    console.log('✅ Assignment created');

    console.log('🎉 Basic data setup complete!');
    console.log('Doctor login: hayder@clinic.com / password123');
    console.log('Pharmacy login: pharmacy@clinic.com / password123');
    console.log('Nurse login: nurse@clinic.com / password123');

  } catch (error) {
    console.error('❌ Error setting up basic data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupBasicData();
