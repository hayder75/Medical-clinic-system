'use strict';

// Seed a fresh database from an export JSON created by export-complete-db.js

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function upsertServices(services) {
  for (const s of services) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {
        code: s.code,
        name: s.name,
        category: s.category,
        price: s.price,
        description: s.description,
        isActive: s.isActive
      },
      create: {
        id: s.id,
        code: s.code,
        name: s.name,
        category: s.category,
        price: s.price,
        description: s.description,
        isActive: s.isActive
      }
    });
  }
}

async function upsertInvestigationTypes(types) {
  for (const t of types) {
    await prisma.investigationType.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        price: t.price,
        category: t.category,
        serviceId: t.serviceId || null
      },
      create: {
        id: t.id,
        name: t.name,
        price: t.price,
        category: t.category,
        serviceId: t.serviceId || null
      }
    });
  }
}

async function upsertLabTestTemplates(templates) {
  for (const t of templates) {
    await prisma.labTestTemplate.upsert({
      where: { id: t.id },
      update: {
        name: t.name,
        category: t.category,
        description: t.description,
        fields: t.fields,
        isActive: t.isActive
      },
      create: {
        id: t.id,
        name: t.name,
        category: t.category,
        description: t.description,
        fields: t.fields,
        isActive: t.isActive
      }
    });
  }
}

async function upsertDepartments(departments) {
  if (!departments) return;
  for (const d of departments) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: { name: d.name, description: d.description },
      create: { id: d.id, name: d.name, description: d.description }
    });
  }
}

async function upsertUsers(users) {
  for (const u of users) {
    // Preserve passwords as-is from export (already hashed)
    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        fullname: u.fullname,
        username: u.username,
        password: u.password,
        email: u.email,
        phone: u.phone,
        role: u.role,
        specialties: u.specialties,
        licenseNumber: u.licenseNumber,
        availability: u.availability,
        isActive: u.isActive,
        consultationFee: u.consultationFee ?? null
      },
      create: {
        id: u.id,
        fullname: u.fullname,
        username: u.username,
        password: u.password,
        email: u.email,
        phone: u.phone,
        role: u.role,
        specialties: u.specialties,
        licenseNumber: u.licenseNumber,
        availability: u.availability,
        isActive: u.isActive,
        consultationFee: u.consultationFee ?? null
      }
    });
  }
}

async function main() {
  const argPath = process.argv[2];
  if (!argPath) {
    console.error('Usage: node scripts/seed-from-export.js <export.json>');
    process.exit(1);
  }
  const inputPath = path.resolve(process.cwd(), argPath);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

  // Order matters due to FKs
  await upsertServices(data.services || []);
  await upsertInvestigationTypes(data.investigationTypes || []);
  await upsertLabTestTemplates(data.labTestTemplates || []);
  await upsertDepartments(data.departments || []);
  await upsertUsers(data.users || []);

  console.log('✅ Seeding completed successfully.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


