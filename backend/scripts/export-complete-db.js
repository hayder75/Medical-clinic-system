'use strict';

// Export core reference and catalog data to JSON for seeding another environment

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '');
  const outFile = path.resolve(__dirname, `../complete-database-export-${timestamp}.json`);

  // Read data in dependency-safe order
  const [services, investigationTypes, labTestTemplates, users, departments] = await Promise.all([
    prisma.service.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.investigationType.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.labTestTemplate.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.department.findMany({ orderBy: { createdAt: 'asc' } }).catch(() => [])
  ]);

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      note: 'Catalog export for seeding another environment. Does not include patient/financial records.'
    },
    services,
    investigationTypes,
    labTestTemplates,
    users,
    departments
  };

  fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));
  console.log(`✅ Exported catalog data to: ${outFile}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


