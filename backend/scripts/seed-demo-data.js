'use strict';

/*
  Demo seed script
  - Assumes master data (users, services, templates, catalog) already exist
  - Inserts 2–3 clean demo patients with no history
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding clean demo patients...');

  const patients = [
    { id: 'PAT-DEMO-001', name: 'John Demo', gender: 'MALE', type: 'REGULAR' },
    { id: 'PAT-DEMO-002', name: 'Jane Demo', gender: 'FEMALE', type: 'REGULAR' },
    { id: 'PAT-DEMO-003', name: 'Alex Demo', gender: 'OTHER', type: 'REGULAR' },
  ];

  for (const p of patients) {
    await prisma.patient.upsert({
      where: { id: p.id },
      update: { name: p.name, gender: p.gender, type: p.type, status: 'Active' },
      create: {
        id: p.id,
        name: p.name,
        gender: p.gender,
        type: p.type,
        status: 'Active',
      },
    });
  }

  console.log('✅ Demo patients seeded.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
