const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Handle database connection in serverless environment
prisma.$connect().catch(err => {
  console.error('❌ Database connection error:', err);
});

module.exports = prisma;