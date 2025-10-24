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

// Create appointment (Doctors, Receptionists, Admins)
router.post(
  '/',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN']),
  createAppointment
);

// Get appointments by doctor (Doctor can view their own, Receptionist/Admin can view any)
router.get(
  '/doctor',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN']),
  getAppointmentsByDoctor
);

// Get all appointments (Reception and Admin)
router.get(
  '/',
  roleGuard(['RECEPTIONIST', 'ADMIN']),
  getAllAppointments
);

// Get appointment by ID
router.get(
  '/:id',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN']),
  getAppointmentById
);

// Update appointment
router.patch(
  '/:id',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN']),
  updateAppointment
);

// Delete appointment
router.delete(
  '/:id',
  roleGuard(['DOCTOR', 'RECEPTIONIST', 'ADMIN']),
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

