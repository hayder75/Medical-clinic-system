const { PrismaClient } = require('@prisma/client');

// Get DATABASE_URL and add connection pooling parameters for Render
let databaseUrl = process.env.DATABASE_URL;

// Add connection pooling parameters if not already present
if (databaseUrl && !databaseUrl.includes('?') && process.env.NODE_ENV === 'production') {
  databaseUrl += '?pgbouncer=true&connect_timeout=10';
}

// Singleton Prisma client with connection handling
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl
    }
  }
});

module.exports = prisma;