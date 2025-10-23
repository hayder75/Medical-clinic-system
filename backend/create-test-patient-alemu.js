const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function getAdminToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ Failed to get admin token:', error.response?.data || error.message);
    throw error;
  }
}

async function getDoctorToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'doctor1',
      password: 'doctor123'
    });
    return response.data.token;
  } catch (error) {
    console.error('❌ Failed to get doctor token:', error.response?.data || error.message);
    throw error;
  }
}

async function createTestPatientAlemu() {
  try {
    console.log('🏥 Creating test patient Alemu with comprehensive orders...');

    // Get admin token for API calls
    const adminToken = await getAdminToken();
    console.log('✅ Admin token obtained');

    // Get doctor token for lab/radiology orders
    const doctorToken = await getDoctorToken();
    console.log('✅ Doctor token obtained');

    // 1. Create patient directly in database
    const patient = await prisma.patient.create({
      data: {
        id: `PAT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        name: 'Alemu Test',
        mobile: '0912345680',
        email: 'alemu.test@example.com',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        type: 'REGULAR',
        bloodType: 'O_PLUS',
        address: 'Test Address, Addis Ababa',
        emergencyContact: 'Emergency Contact',
        insuranceId: null
      }
    });

    console.log('✅ Patient created:', patient.id);

    // 2. Create visit directly in database
    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        visitUid: `VISIT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        date: new Date(),
        status: 'UNDER_DOCTOR_REVIEW',
        queueType: 'CONSULTATION',
        notes: 'Test patient with lab, radiology, and nurse service orders'
      }
    });

    console.log('✅ Visit created:', visit.visitUid);

    // 3. Assign to doctor directly in database
    const doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR', username: 'doctor1' }
    });

    if (doctor) {
      await prisma.assignment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          status: 'ACTIVE'
        }
      });
      console.log('✅ Assigned to doctor:', doctor.fullname);
    }

    // 4. Create consultation billing and payment
    const consultationService = await prisma.service.findFirst({
      where: { code: 'CONS001' }
    });

    if (consultationService) {
      const billing = await prisma.billing.create({
        data: {
          patientId: patient.id,
          visitId: visit.id,
          totalAmount: consultationService.price,
          status: 'PAID',
          notes: 'Consultation fee for test patient'
        }
      });

      await prisma.billingService.create({
        data: {
          billingId: billing.id,
          serviceId: consultationService.id,
          quantity: 1,
          unitPrice: consultationService.price,
          totalPrice: consultationService.price
        }
      });

      await prisma.billPayment.create({
        data: {
          billingId: billing.id,
          patientId: patient.id,
          amount: consultationService.price,
          type: 'CASH',
          notes: 'Consultation payment'
        }
      });

      console.log('✅ Consultation billing created and paid');
    }

    // 5. Order lab tests using API
    const labResponse = await axios.post(`${BASE_URL}/doctors/lab-orders/multiple`, {
      visitId: visit.id,
      patientId: patient.id,
      orders: [
        { typeId: 1, instructions: 'CBC test for Alemu' }
      ]
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });

    console.log('✅ Lab order created');

    // 6. Order radiology tests using API
    const radiologyResponse = await axios.post(`${BASE_URL}/doctors/radiology-orders/multiple`, {
      visitId: visit.id,
      patientId: patient.id,
      orders: [
        { typeId: 11, instructions: 'Chest X-Ray for Alemu' }
      ]
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });

    console.log('✅ Radiology order created');

    // Update visit status to UNDER_DOCTOR_REVIEW for nurse service orders
    await prisma.visit.update({
      where: { id: visit.id },
      data: { status: 'UNDER_DOCTOR_REVIEW' }
    });

    // 7. Order nurse services using API
    const nurseServicesResponse = await axios.get(`${BASE_URL}/nurses/services`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    const nurseServices = nurseServicesResponse.data.services || [];
    if (nurseServices.length > 0) {
      const nurseResponse = await axios.get(`${BASE_URL}/nurses/nurses`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const nurses = nurseResponse.data.nurses || [];
      if (nurses.length > 0) {
        await axios.post(`${BASE_URL}/doctors/service-orders`, {
          visitId: visit.id,
          patientId: patient.id,
          serviceIds: [nurseServices[0].id],
          assignedNurseId: nurses[0].id,
          instructions: 'Test nurse service for Alemu'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });

        console.log('✅ Nurse service order created:', nurseServices[0].name);
      }
    }

    console.log('\n🎉 Test patient Alemu created successfully!');
    console.log('📋 Summary:');
    console.log(`   Patient: ${patient.name} (${patient.id})`);
    console.log(`   Visit: ${visit.visitUid}`);
    console.log(`   Status: ${visit.status}`);
    console.log('   Lab Orders: 1');
    console.log('   Radiology Orders: 1');
    console.log('   Nurse Services: 1');
    console.log('   Consultation: Paid');

  } catch (error) {
    console.error('❌ Error creating test patient:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestPatientAlemu();