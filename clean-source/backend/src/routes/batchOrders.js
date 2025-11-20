const express = require('express');
const multer = require('multer');
const path = require('path');
const batchOrderController = require('../controllers/batchOrderController');
const authMiddleware = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileUpload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

// Doctor routes - create batch orders
router.post('/create', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), batchOrderController.createBatchOrder);

// Lab department routes
router.get('/lab', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), batchOrderController.getLabBatchOrders);
router.put('/:batchOrderId/results', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), batchOrderController.updateBatchOrderResults);
router.post('/:batchOrderId/attachment', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'ADMIN']), fileUpload.single('file'), batchOrderController.uploadBatchOrderAttachment);

// Radiology department routes
router.get('/radiology', authMiddleware, roleGuard(['RADIOLOGY_TECHNICIAN', 'ADMIN']), batchOrderController.getRadiologyBatchOrders);
router.put('/:batchOrderId/results', authMiddleware, roleGuard(['RADIOLOGY_TECHNICIAN', 'ADMIN']), batchOrderController.updateBatchOrderResults);
router.post('/:batchOrderId/attachment', authMiddleware, roleGuard(['RADIOLOGY_TECHNICIAN', 'ADMIN']), fileUpload.single('file'), batchOrderController.uploadBatchOrderAttachment);

module.exports = router;
