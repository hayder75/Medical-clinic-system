const express = require('express');
const nurseController = require('../controllers/nurseController');

const router = express.Router();

router.post('/vitals', nurseController.recordVitals);
router.post('/continuous-vitals', nurseController.recordContinuousVitals);
router.get('/patient-vitals/:patientId', nurseController.getPatientVitals);
router.post('/assignments', nurseController.assignDoctor);
router.post('/assign-nurse-service', nurseController.assignNurseService);
router.post('/assign-nurse-services', nurseController.assignNurseServices);
router.post('/assign-combined', nurseController.assignCombined);
router.get('/queue', nurseController.getPatientQueue);
router.get('/doctors', nurseController.getDoctors);
router.get('/doctors-by-specialty', nurseController.getDoctorsBySpecialty);
router.get('/services', nurseController.getNurseServices);
router.get('/nurses', nurseController.getNurses);
router.get('/today-tasks', nurseController.getTodayTasks);
router.get('/daily-tasks', nurseController.getNurseDailyTasks);
router.post('/complete-service', nurseController.completeNurseService);
router.post('/administer', nurseController.markAdministered);
router.post('/administer-task', nurseController.administerTask);

module.exports = router;