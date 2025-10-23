const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const galleryController = require('../controllers/galleryController');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads/patient-gallery');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  }
});

// Routes
// Upload image (Nurses, Receptionists, Admin)
router.post(
  '/upload',
  authMiddleware,
  roleGuard(['NURSE', 'RECEPTIONIST', 'ADMIN']),
  upload.single('image'),
  galleryController.uploadImage
);

// Get images for a specific visit (Nurses, Receptionists, Doctors, Admin)
router.get(
  '/visit/:visitId',
  authMiddleware,
  roleGuard(['NURSE', 'RECEPTIONIST', 'DOCTOR', 'ADMIN']),
  galleryController.getVisitImages
);

// Get all images for a patient (Nurses, Receptionists, Doctors, Admin)
router.get(
  '/patient/:patientId',
  authMiddleware,
  roleGuard(['NURSE', 'RECEPTIONIST', 'DOCTOR', 'ADMIN']),
  galleryController.getPatientImages
);

// Delete an image (Nurses, Receptionists, Admin)
router.delete(
  '/:imageId',
  authMiddleware,
  roleGuard(['NURSE', 'RECEPTIONIST', 'ADMIN']),
  galleryController.deleteImage
);

module.exports = router;

