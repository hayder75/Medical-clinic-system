# Medical Clinic System - Docker Setup

This document explains how to run the Medical Clinic Management System using Docker.

## 🐳 Docker Architecture

The system consists of 4 containers:

- **database**: PostgreSQL 16 database
- **backend**: Node.js API server with Prisma ORM
- **frontend**: React application served by Nginx
- **prisma-studio**: Database management interface (optional)

## 🚀 Quick Start

### Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 1.29+)

### 1. Build and Start All Services

```bash
# Build and start all containers
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

### 2. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555
- **Database**: localhost:5432

## 🔧 Development Commands

### Start Services
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up database backend

# Start in background
docker-compose up -d
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes database data)
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend
docker-compose logs frontend
```

### Database Operations
```bash
# Access database shell
docker-compose exec database psql -U postgres -d medical_clinic_db

# Run Prisma commands
docker-compose exec backend npx prisma studio
docker-compose exec backend npx prisma db push
```

## 👥 Test User Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | ADMIN |
| doctor1 | doctor123 | DOCTOR |
| nurse1 | nurse123 | NURSE |
| billing1 | billing123 | BILLING_OFFICER |
| pharmacy1 | pharmacy123 | PHARMACIST |
| lab1 | lab123 | LAB_TECHNICIAN |
| radiology1 | radiology123 | RADIOLOGIST |

## 🏗️ Container Details

### Backend Container
- **Base**: Node.js 20 Alpine
- **Port**: 3000
- **Features**: 
  - Prisma ORM with PostgreSQL
  - JWT Authentication
  - File upload handling
  - Health checks

### Frontend Container
- **Base**: Nginx Alpine
- **Port**: 3001
- **Features**:
  - React SPA
  - API proxy to backend
  - Gzip compression
  - Client-side routing

### Database Container
- **Base**: PostgreSQL 16 Alpine
- **Port**: 5432
- **Features**:
  - Persistent data storage
  - Health checks
  - Initialization scripts

## 🔍 Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 3000, 3001, 5432, and 5555 are available
2. **Database connection**: Wait for database to be healthy before backend starts
3. **Build failures**: Clear Docker cache with `docker-compose build --no-cache`

### Reset Everything
```bash
# Stop and remove everything
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Rebuild from scratch
docker-compose up --build
```

### View Container Status
```bash
# List running containers
docker-compose ps

# Check container health
docker-compose exec backend curl http://localhost:3000/api/auth/health
```

## 📁 Project Structure

```
Medical-clinic-system/
├── docker-compose.yml          # Main orchestration file
├── backend/
│   ├── Dockerfile              # Backend container config
│   ├── .dockerignore           # Files to ignore in build
│   └── init.sql               # Database initialization
├── frontend/
│   ├── Dockerfile              # Frontend container config
│   ├── nginx.conf              # Nginx configuration
│   └── .dockerignore           # Files to ignore in build
└── DOCKER_README.md            # This file
```

## 🚀 Production Deployment

For production deployment:

1. Update environment variables in `docker-compose.yml`
2. Use proper secrets management
3. Configure SSL/TLS certificates
4. Set up proper logging and monitoring
5. Use a reverse proxy (e.g., Traefik, Nginx)

## 📝 Notes

- Database data persists in Docker volumes
- All containers restart automatically unless stopped
- Prisma Studio is optional and can be removed for production
- Health checks ensure proper startup order
