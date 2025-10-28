const express = require('express');
const router = express.Router();
const roleGuard = require('../middleware/roleGuard');
const {
  createAppointment,
  getAppointmentsByDoctor,
  getAllAppointments,
  updateAppointment,
  deleteAppointment,
  sendAppointmentToDoctor,
  getAppointmentById,
  debugAppointmentStatus
} = require('../controllers/appointmentController');

// Create appointment (Doctors and Receptionists only - no nurses/admins)
router.post(
  '/',
  roleGuard(['DOCTOR', 'RECEPTIONIST']),
  createAppointment
);

// Get appointments by doctor (Doctor can view their own, Receptionist/Admin/Nurse can view any)
router.get(
  '/doctor',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN', 'NURSE']),
  getAppointmentsByDoctor
);

// Get all appointments (Reception, Admin, and Nurse)
router.get(
  '/',
  roleGuard(['RECEPTIONIST', 'ADMIN', 'NURSE']),
  getAllAppointments
);

// Get appointment by ID (Everyone can view)
router.get(
  '/:id',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN', 'NURSE']),
  getAppointmentById
);

// Update appointment (Doctors and Receptionists only)
router.patch(
  '/:id',
  roleGuard(['DOCTOR', 'RECEPTIONIST']),
  updateAppointment
);

// Delete appointment (Doctors and Receptionists only)
router.delete(
  '/:id',
  roleGuard(['DOCTOR', 'RECEPTIONIST']),
  deleteAppointment
);

// Send appointment to doctor (Reception converts appointment to visit)
router.post(
  '/:id/send-to-doctor',
  roleGuard(['RECEPTIONIST', 'ADMIN']),
  sendAppointmentToDoctor
);

// Debug appointment status
router.get(
  '/:id/debug',
  roleGuard(['RECEPTIONIST', 'ADMIN', 'DOCTOR']),
  debugAppointmentStatus
);

module.exports = router;

