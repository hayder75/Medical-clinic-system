const { PrismaClient } = require('@prisma/client');

// Get DATABASE_URL and optimize connection pooling for VPS
let databaseUrl = process.env.DATABASE_URL;

// Optimize connection pooling for VPS (not Render pgbouncer)
if (databaseUrl && !databaseUrl.includes('?') && process.env.NODE_ENV === 'production') {
  // VPS PostgreSQL connection pooling - optimized for performance
  databaseUrl += '?connection_limit=20&pool_timeout=20&connect_timeout=10';
}

// Singleton Prisma client with optimized settings
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  // Optimize for VPS performance
  __internal: {
    engine: {
      connectTimeout: 10000,
      queryTimeout: 30000
    }
  }
});

module.exports = prisma;