const express = require('express');
const labController = require('../controllers/labController');
const fileUpload = require('../middleware/fileUpload');

const router = express.Router();

router.get('/orders', labController.getOrders);
router.post('/orders/:orderId/result', labController.fillResult);
router.post('/orders/:orderId/test', labController.testResult);
router.post('/orders/:orderId/attachment', fileUpload.single('file'), labController.uploadAttachment);
router.get('/investigation-types', labController.getInvestigationTypes);

// New per-test result routes
router.post('/results', labController.createLabResult);
router.post('/results/:resultId/file', fileUpload.single('file'), labController.uploadLabResultFile);
router.get('/orders/:orderId/results', labController.getLabResults);

// New detailed lab form routes
router.get('/templates', labController.getLabTemplates);
router.get('/templates/:templateId', labController.getLabTemplate);
router.post('/results/detailed', labController.submitDetailedResults);
router.get('/orders/:labOrderId/detailed-results', labController.getDetailedResults);

module.exports = router;