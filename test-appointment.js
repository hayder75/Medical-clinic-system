const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestAppointment() {
  try {
    // Find a doctor and patient
    const doctor = await prisma.user.findFirst({
      where: { role: 'DOCTOR' }
    });
    
    const patient = await prisma.patient.findFirst();
    
    if (!doctor || !patient) {
      console.log('No doctor or patient found');
      return;
    }
    
    console.log('Creating test appointment...');
    console.log('Doctor:', doctor.name);
    console.log('Patient:', patient.name);
    
    // Create a test appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        date: new Date(),
        time: '10:00',
        type: 'FOLLOW_UP',
        status: 'SCHEDULED',
        notes: 'Test follow-up appointment'
      },
      include: {
        patient: true,
        doctor: true
      }
    });
    
    console.log('✅ Test appointment created:', appointment);
    
    // List all appointments
    const appointments = await prisma.appointment.findMany({
      include: {
        patient: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } }
      }
    });
    
    console.log('📅 All appointments:', appointments.length);
    appointments.forEach(apt => {
      console.log(`- ${apt.patient.name} with ${apt.doctor.name} on ${apt.date.toISOString().split('T')[0]} at ${apt.time} (${apt.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAppointment();




