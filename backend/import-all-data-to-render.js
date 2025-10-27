const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function importAllData() {
  try {
    console.log('🚀 Starting comprehensive data import to Render...');

    // Read the exported data
    const exportData = JSON.parse(fs.readFileSync('complete-database-export-2025-10-25.json', 'utf8'));

    // Import Users (skip the ones we already created)
    console.log('\n👥 Importing Users...');
    const existingUsers = await prisma.user.findMany();
    const existingEmails = existingUsers.map(u => u.email);
    
    for (const user of exportData.User) {
      if (!existingEmails.includes(user.email)) {
        try {
          await prisma.user.create({
            data: {
              id: user.id,
              fullname: user.fullname,
              username: user.username,
              password: user.password, // Keep existing password hash
              email: user.email,
              phone: user.phone,
              role: user.role,
              specialties: user.specialties,
              licenseNumber: user.licenseNumber,
              availability: user.availability,
              consultationFee: user.consultationFee,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt
            }
          });
          console.log(`✅ Created user: ${user.email}`);
        } catch (error) {
          console.log(`⚠️  User ${user.email}: ${error.message}`);
        }
      } else {
        console.log(`⏭️  User ${user.email} already exists`);
      }
    }

    // Import Services
    console.log('\n🔧 Importing Services...');
    const existingServices = await prisma.service.findMany();
    const existingServiceCodes = existingServices.map(s => s.code);
    
    for (const service of exportData.Service) {
      if (!existingServiceCodes.includes(service.code)) {
        try {
          await prisma.service.create({
            data: {
              id: service.id,
              code: service.code,
              name: service.name,
              category: service.category,
              price: service.price,
              description: service.description,
              isActive: service.isActive,
              createdAt: service.createdAt,
              updatedAt: service.updatedAt
            }
          });
          console.log(`✅ Created service: ${service.name}`);
        } catch (error) {
          console.log(`⚠️  Service ${service.name}: ${error.message}`);
        }
      } else {
        console.log(`⏭️  Service ${service.code} already exists`);
      }
    }

    // Import Insurance
    console.log('\n🏥 Importing Insurance...');
    const existingInsurance = await prisma.insurance.findMany();
    const existingInsuranceCodes = existingInsurance.map(i => i.code);
    
    for (const insurance of exportData.Insurance) {
      if (!existingInsuranceCodes.includes(insurance.code)) {
        try {
          await prisma.insurance.create({
            data: {
              id: insurance.id,
              name: insurance.name,
              code: insurance.code,
              contactInfo: insurance.contactInfo,
              isActive: insurance.isActive,
              createdAt: insurance.createdAt,
              updatedAt: insurance.updatedAt
            }
          });
          console.log(`✅ Created insurance: ${insurance.name}`);
        } catch (error) {
          console.log(`⚠️  Insurance ${insurance.name}: ${error.message}`);
        }
      } else {
        console.log(`⏭️  Insurance ${insurance.code} already exists`);
      }
    }

    // Import Patients
    console.log('\n👤 Importing Patients...');
    for (const patient of exportData.Patient) {
      try {
        await prisma.patient.create({
          data: {
            id: patient.id,
            name: patient.name,
            type: patient.type,
            phone: patient.phone,
            email: patient.email,
            address: patient.address,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            emergencyContact: patient.emergencyContact,
            medicalHistory: patient.medicalHistory,
            allergies: patient.allergies,
            status: patient.status,
            insuranceId: patient.insuranceId,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt
          }
        });
        console.log(`✅ Created patient: ${patient.name}`);
      } catch (error) {
        console.log(`⚠️  Patient ${patient.name}: ${error.message}`);
      }
    }

    // Import Visits
    console.log('\n🏥 Importing Visits...');
    for (const visit of exportData.Visit) {
      try {
        await prisma.visit.create({
          data: {
            id: visit.id,
            patientId: visit.patientId,
            doctorId: visit.doctorId,
            visitDate: visit.visitDate,
            visitType: visit.visitType,
            chiefComplaint: visit.chiefComplaint,
            diagnosis: visit.diagnosis,
            treatment: visit.treatment,
            notes: visit.notes,
            status: visit.status,
            isEmergency: visit.isEmergency,
            createdAt: visit.createdAt,
            updatedAt: visit.updatedAt
          }
        });
        console.log(`✅ Created visit: ${visit.id}`);
      } catch (error) {
        console.log(`⚠️  Visit ${visit.id}: ${error.message}`);
      }
    }

    // Import Billings
    console.log('\n💰 Importing Billings...');
    for (const billing of exportData.Billing) {
      try {
        await prisma.billing.create({
          data: {
            id: billing.id,
            patientId: billing.patientId,
            visitId: billing.visitId,
            totalAmount: billing.totalAmount,
            paidAmount: billing.paidAmount,
            balance: billing.balance,
            status: billing.status,
            billingDate: billing.billingDate,
            dueDate: billing.dueDate,
            notes: billing.notes,
            createdAt: billing.createdAt,
            updatedAt: billing.updatedAt
          }
        });
        console.log(`✅ Created billing: ${billing.id}`);
      } catch (error) {
        console.log(`⚠️  Billing ${billing.id}: ${error.message}`);
      }
    }

    // Import Appointments
    console.log('\n📅 Importing Appointments...');
    for (const appointment of exportData.Appointment) {
      try {
        await prisma.appointment.create({
          data: {
            id: appointment.id,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            appointmentDate: appointment.appointmentDate,
            appointmentTime: appointment.appointmentTime,
            duration: appointment.duration,
            status: appointment.status,
            notes: appointment.notes,
            createdAt: appointment.createdAt,
            updatedAt: appointment.updatedAt
          }
        });
        console.log(`✅ Created appointment: ${appointment.id}`);
      } catch (error) {
        console.log(`⚠️  Appointment ${appointment.id}: ${error.message}`);
      }
    }

    console.log('\n🎉 Import completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👥 Users: ${exportData.User.length} total`);
    console.log(`🔧 Services: ${exportData.Service.length} total`);
    console.log(`🏥 Insurance: ${exportData.Insurance.length} total`);
    console.log(`👤 Patients: ${exportData.Patient.length} total`);
    console.log(`🏥 Visits: ${exportData.Visit.length} total`);
    console.log(`💰 Billings: ${exportData.Billing.length} total`);
    console.log(`📅 Appointments: ${exportData.Appointment.length} total`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importAllData();

