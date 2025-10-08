const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const pdfmake = require('pdfmake');
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const zod = require('zod');

// Routes
const authRoutes = require('./src/routes/auth');
const patientsRoutes = require('./src/routes/patients');
const visitsRoutes = require('./src/routes/visits');
const billingRoutes = require('./src/routes/billing');
const doctorsRoutes = require('./src/routes/doctors');
const nursesRoutes = require('./src/routes/nurses');
const labsRoutes = require('./src/routes/labs');
const radiologiesRoutes = require('./src/routes/radiologies');
const pharmaciesRoutes = require('./src/routes/pharmacies');
const batchOrdersRoutes = require('./src/routes/batchOrders');
const pharmacyBillingRoutes = require('./src/routes/pharmacyBilling');
const medicationRoutes = require('./src/routes/medications');
const adminRoutes = require('./src/routes/admin');
const schedulesRoutes = require('./src/routes/schedules');
const walkInSalesRoutes = require('./src/routes/walkInSales');
const dentalRoutes = require('./src/routes/dental');

// Middleware
const authMiddleware = require('./src/middleware/auth');
const roleGuard = require('./src/middleware/roleGuard');
const fileUpload = require('./src/middleware/fileUpload');
const logger = require('./src/middleware/logger');

const app = express();
const prisma = new PrismaClient();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Middleware to populate req.ip
app.use((req, res, next) => {
  req.ip = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for'] || '127.0.0.1';
  next();
});

app.use(logger);  // Audit middleware

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', authMiddleware, patientsRoutes);
app.use('/api/visits', authMiddleware, visitsRoutes);
app.use('/api/billing', authMiddleware, roleGuard(['BILLING_OFFICER', 'PHARMACY_BILLING_OFFICER', 'PHARMACIST', 'ADMIN']), billingRoutes);
app.use('/api/doctors', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), doctorsRoutes);
app.use('/api/nurses', authMiddleware, roleGuard(['NURSE', 'ADMIN']), nursesRoutes);
app.use('/api/labs', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'DOCTOR', 'ADMIN']), labsRoutes);
app.use('/api/radiologies', authMiddleware, roleGuard(['RADIOLOGIST', 'RADIOLOGY_TECHNICIAN', 'DOCTOR', 'ADMIN']), radiologiesRoutes);
app.use('/api/pharmacies', authMiddleware, roleGuard(['PHARMACY_OFFICER', 'PHARMACIST', 'PHARMACY_BILLING_OFFICER', 'ADMIN']), pharmaciesRoutes);
app.use('/api/batch-orders', batchOrdersRoutes);
app.use('/api/pharmacy-billing', authMiddleware, roleGuard(['PHARMACY_BILLING_OFFICER', 'PHARMACIST', 'ADMIN']), pharmacyBillingRoutes);
app.use('/api/medications', authMiddleware, medicationRoutes);
app.use('/api/admin', authMiddleware, roleGuard(['ADMIN']), adminRoutes);
app.use('/api/schedules', authMiddleware, schedulesRoutes);
app.use('/api/walk-in-sales', authMiddleware, roleGuard(['PHARMACIST', 'PHARMACY_BILLING_OFFICER', 'ADMIN']), walkInSalesRoutes);
app.use('/api/dental', dentalRoutes);

// Cron for inactivity (run daily)
cron.schedule('0 0 * * *', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await prisma.patient.updateMany({
    where: { updatedAt: { lt: thirtyDaysAgo }, status: 'Active' },
    data: { status: 'Inactive' },
  });
  console.log('Inactivity cron ran');
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
app.listen(PORT, HOST, () => console.log(`Server running on http://${HOST}:${PORT}`));