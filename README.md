# Medical Clinic System

A comprehensive medical clinic management system with features for patient management, billing, appointments, lab tests, radiology, pharmacy, and more.

## Features

- Patient Registration & Management
- Billing & Cash Management
- Doctor Consultation & Queue Management
- Nurse Services & Triage
- Lab Tests (Hierarchical System)
- Radiology Services
- Pharmacy Management
- Dental Services
- Insurance Management
- Virtual Queue & Pre-registration

## Tech Stack

- **Backend**: Node.js, Express.js, Prisma ORM, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS
- **Deployment**: PM2, Nginx (optional)

## Quick Start

### Local Development

1. **Setup Database**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your database credentials
   npx prisma migrate dev
   npx prisma generate
   ```

2. **Seed System Data**
   ```bash
   node seed-system/seed-all.js
   ```

3. **Start Backend**
   ```bash
   npm install
   npm start
   ```

4. **Start Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Server IP**: 51.222.143.50

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/medical_clinic_system
JWT_SECRET=your_jwt_secret_key_here
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=http://your-server-ip:3000/api
```

## System Seeding

The system seeds the following data (NO users or patients):
- Services (Radiology, Consultation, Card, Nurse, Dental, etc.)
- Lab Tests (Hierarchical system with groups and result fields)
- Medications Catalog
- Insurance Companies
- Investigation Types (Radiology)

Run: `node backend/seed-system/seed-all.js`

## License

Proprietary


