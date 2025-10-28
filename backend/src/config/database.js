const { PrismaClient } = require('@prisma/client');

// Singleton Prisma client - connections are lazy and handled automatically
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn']
});

module.exports = prisma;