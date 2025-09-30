const express = require('express');
const radiologyController = require('../controllers/radiologyController');
const fileUpload = require('../middleware/fileUpload');

const router = express.Router();

router.get('/orders', radiologyController.getOrders);
router.post('/orders/:orderId/report', radiologyController.fillReport);
router.post('/orders/:orderId/attachment', fileUpload.single('file'), radiologyController.uploadAttachment);
router.get('/investigation-types', radiologyController.getInvestigationTypes);

// New per-test result routes
router.post('/results', radiologyController.createRadiologyResult);
router.post('/results/:resultId/file', fileUpload.single('file'), radiologyController.uploadRadiologyResultFile);
router.get('/orders/:orderId/results', radiologyController.getRadiologyResults);

// New per-test result routes for batch orders
router.post('/batch-orders/:batchOrderId/results', radiologyController.createBatchRadiologyResult);
router.post('/batch-orders/:batchOrderId/results/:resultId/file', fileUpload.single('file'), radiologyController.uploadBatchRadiologyResultFile);
router.get('/batch-orders/:batchOrderId/results', radiologyController.getBatchRadiologyResults);
router.put('/batch-orders/:batchOrderId/results', radiologyController.completeBatchRadiologyOrder);

module.exports = router;