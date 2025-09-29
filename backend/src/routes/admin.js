const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// User Management
router.post('/users', adminController.createUser);
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/password', adminController.updateUserPassword);

// Service Management
router.post('/services', adminController.createService);
router.get('/services', adminController.getServices);
router.put('/services/:id', adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

// Insurance Management
router.post('/insurances', adminController.createInsurance);
router.get('/insurances', adminController.getInsurances);
router.put('/insurances/:id', adminController.updateInsurance);
router.delete('/insurances/:id', adminController.deleteInsurance);

// Investigation Types Management
router.post('/investigation-types', adminController.createInvestigationType);
router.get('/investigation-types', adminController.getInvestigationTypes);

// Inventory Management
router.post('/inventory', adminController.createInventoryItem);
router.get('/inventory', adminController.getInventory);
router.put('/inventory/:id', adminController.updateInventoryItem);

// Billing Overview
router.get('/billing-overview', adminController.getBillingOverview);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

// Reports
router.get('/reports/daily', adminController.getDailyReport);
router.get('/reports/weekly', adminController.getWeeklyReport);
router.get('/reports/revenue', adminController.getRevenueReport);

module.exports = router;