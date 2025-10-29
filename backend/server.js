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
const radiologiesRoutes = require('./src/routes/radiologies');
const labsRoutes = require('./src/routes/labs');
const pharmaciesRoutes = require('./src/routes/pharmacies');
const batchOrdersRoutes = require('./src/routes/batchOrders');
const pharmacyBillingRoutes = require('./src/routes/pharmacyBilling');
const medicationRoutes = require('./src/routes/medications');
const adminRoutes = require('./src/routes/admin');
const schedulesRoutes = require('./src/routes/schedules');
const walkInSalesRoutes = require('./src/routes/walkInSales');
const dentalRoutes = require('./src/routes/dental');
const dentalPhotosRoutes = require('./src/routes/dentalPhotos');
const patientAttachedImagesRoutes = require('./src/routes/patientAttachedImages');
const virtualQueueRoutes = require('./src/routes/virtualQueue');
const medicalCertificatesRoutes = require('./src/routes/medicalCertificates');
const continuousInfusionsRoutes = require('./src/routes/continuousInfusions');
const receptionRoutes = require('./src/routes/reception');
const emergencyBillingRoutes = require('./src/routes/emergencyBilling');
const emergencyRoutes = require('./src/routes/emergency');
const cashManagementRoutes = require('./src/routes/cashManagement');
const galleryRoutes = require('./src/routes/gallery');
const appointmentsRoutes = require('./src/routes/appointments');
const insuranceRoutes = require('./src/routes/insurance');
const loansRoutes = require('./src/routes/loans');
const accountsRoutes = require('./src/routes/accounts');
const walkInOrdersRoutes = require('./src/routes/walkInOrders');

// Middleware
const authMiddleware = require('./src/middleware/auth');
const roleGuard = require('./src/middleware/roleGuard');
const fileUpload = require('./src/middleware/fileUpload');
const logger = require('./src/middleware/logger');

const fs = require('fs');
const path = require('path');

const app = express();

// Ensure uploads directory structure exists on startup
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
const uploadsPath = path.resolve(__dirname, uploadsDir);
const uploadSubdirs = [
  'patient-attached-images',
  'dental-photos',
  'receipts',
  'patient-gallery'
];

try {
  // Create main uploads directory
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`Created uploads directory: ${uploadsPath}`);
  }
  
  // Create all required subdirectories
  uploadSubdirs.forEach(subdir => {
    const subdirPath = path.resolve(uploadsPath, subdir);
    if (!fs.existsSync(subdirPath)) {
      fs.mkdirSync(subdirPath, { recursive: true });
      console.log(`Created ${subdir} directory: ${subdirPath}`);
    }
  });
} catch (error) {
  console.error('Failed to create uploads directories:', error);
  process.exit(1);
}

// Singleton Prisma client - connections are lazy
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn']
});

// Handle connection cleanup on shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

app.use(cors({
  origin: true, // Allow all origins
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
app.use('/api/doctors', authMiddleware, roleGuard(['DOCTOR', 'ADMIN', 'BILLING_OFFICER', 'NURSE', 'RECEPTIONIST', 'LAB_TECHNICIAN', 'RADIOLOGIST']), doctorsRoutes);
app.use('/api/nurses', authMiddleware, roleGuard(['NURSE', 'ADMIN', 'DOCTOR']), nursesRoutes);
app.use('/api/radiologies', authMiddleware, roleGuard(['RADIOLOGIST', 'RADIOLOGY_TECHNICIAN', 'DOCTOR', 'ADMIN', 'LAB_TECHNICIAN']), radiologiesRoutes);
app.use('/api/labs', authMiddleware, roleGuard(['LAB_TECHNICIAN', 'DOCTOR', 'ADMIN']), labsRoutes);
app.use('/api/pharmacies', authMiddleware, roleGuard(['PHARMACY_OFFICER', 'PHARMACIST', 'PHARMACY_BILLING_OFFICER', 'ADMIN']), pharmaciesRoutes);
app.use('/api/batch-orders', batchOrdersRoutes);
app.use('/api/pharmacy-billing', authMiddleware, roleGuard(['PHARMACY_BILLING_OFFICER', 'PHARMACIST', 'ADMIN']), pharmacyBillingRoutes);
app.use('/api/medications', authMiddleware, medicationRoutes);
app.use('/api/admin', authMiddleware, roleGuard(['ADMIN']), adminRoutes);
app.use('/api/schedules', authMiddleware, schedulesRoutes);
app.use('/api/walk-in-sales', authMiddleware, roleGuard(['PHARMACIST', 'PHARMACY_BILLING_OFFICER', 'ADMIN']), walkInSalesRoutes);
app.use('/api/dental', dentalRoutes);
app.use('/api/dental-photos', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), dentalPhotosRoutes);
app.use('/api/patient-attached-images', authMiddleware, patientAttachedImagesRoutes);
app.use('/api/pre-registration', authMiddleware, roleGuard(['BILLING_OFFICER', 'RECEPTIONIST', 'ADMIN']), virtualQueueRoutes);
app.use('/api/medical-certificates', authMiddleware, roleGuard(['DOCTOR', 'ADMIN']), medicalCertificatesRoutes);
app.use('/api/continuous-infusions', continuousInfusionsRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/emergency-billing', authMiddleware, roleGuard(['BILLING_OFFICER', 'ADMIN']), emergencyBillingRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/cash-management', cashManagementRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/appointments', authMiddleware, appointmentsRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/accounts', authMiddleware, accountsRoutes);
app.use('/api/walk-in-orders', authMiddleware, walkInOrdersRoutes);

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
const HOST = process.env.HOST || '0.0.0.0';

// Health check endpoint for Render
app.get('/api/health', async (req, res) => {
  let dbStatus = 'unknown';
  let dbError = null;
  
  // Try to ping database without disconnecting
  try {
    await prisma.$executeRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'disconnected';
    dbError = error.message;
  }
  
  // Always return 200 OK - service is live, database may be sleeping
  res.status(200).json({ 
    status: dbStatus === 'connected' ? 'OK' : 'STARTING',
    database: dbStatus,
    error: dbError,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Auto-seed admin user if it doesn't exist (only on startup)
(async () => {
  try {
    const adminExists = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (!adminExists) {
      console.log('🔧 Admin user not found, creating default admin...');
      const bcrypt = require('bcryptjs');
      await prisma.user.create({
        data: {
          username: 'admin',
          fullname: 'System Administrator',
          email: 'admin@clinic.com',
          role: 'ADMIN',
          password: await bcrypt.hash('admin123', 10),
          availability: true,
          isActive: true,
          specialties: []
        }
      });
      console.log('✅ Default admin user created:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.error('⚠️  Warning: Could not check/create admin user:', error.message);
    // Don't exit - server should still start even if seeding fails
  }
})();

app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check: http://${HOST}:${PORT}/api/health`);
});