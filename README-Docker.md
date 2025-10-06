# Medical Clinic System - Docker Setup

## 🐳 Docker Configuration

This medical clinic system is fully containerized using Docker and Docker Compose.

### Services

- **PostgreSQL Database** (Port 5432)
- **Backend API** (Port 3000) 
- **Frontend** (Port 3001)

### Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Run in background:**
   ```bash
   docker-compose up -d --build
   ```

3. **Stop all services:**
   ```bash
   docker-compose down
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

### Access URLs

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

### Test User Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| doctor1 | doctor123 | DOCTOR |
| nurse1 | nurse123 | NURSE |
| billing1 | billing123 | BILLING_OFFICER |
| pharmacy1 | pharmacy123 | PHARMACIST |
| lab1 | lab123 | LAB_TECHNICIAN |
| radiology1 | radiology123 | RADIOLOGIST |

### Database

The PostgreSQL database is automatically:
- Created on first run
- Schema applied via Prisma
- Seeded with test users and services

### Development

For development with hot reload:

```bash
# Backend only
docker-compose up postgres
cd backend && npm run dev

# Frontend only  
cd frontend && npm run dev
```

### Troubleshooting

- **Port conflicts**: Make sure ports 3000, 3001, and 5432 are available
- **Database issues**: Run `docker-compose down -v` to reset database
- **Build issues**: Run `docker-compose build --no-cache`
