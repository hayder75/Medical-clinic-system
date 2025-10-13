const express = require('express');
const nurseController = require('../controllers/nurseController');

const router = express.Router();

router.post('/vitals', nurseController.recordVitals);
router.post('/continuous-vitals', nurseController.recordContinuousVitals);
router.get('/patient-vitals/:patientId', nurseController.getPatientVitals);
router.post('/assignments', nurseController.assignDoctor);
router.get('/queue', nurseController.getPatientQueue);
router.get('/doctors', nurseController.getDoctors);
router.get('/doctors-by-specialty', nurseController.getDoctorsBySpecialty);
router.get('/today-tasks', nurseController.getTodayTasks);
router.post('/administer', nurseController.markAdministered);
router.post('/administer-task', nurseController.administerTask);

module.exports = router;