# Deployment Guide

## 🚀 How to Deploy the Medical Clinic System

### 1. GitHub Repository Setup

#### **Files to Push to GitHub:**
```bash
git add .
git commit -m "Initial commit: Medical Clinic System with Docker"
git push origin main
```

#### **What Gets Uploaded:**
✅ **Included:**
- All source code
- Docker configuration
- Documentation files
- Package.json files
- .env.example templates

❌ **Excluded (in .gitignore):**
- .env files (secrets)
- node_modules/
- uploads/
- *.db files
- Log files

### 2. Home PC Setup

#### **Step 1: Install Required Software**

1. **Node.js** (v18+)
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **Docker Desktop**
   - Download: https://www.docker.com/products/docker-desktop/
   - Verify: `docker --version`

3. **Git**
   - Download: https://git-scm.com/
   - Verify: `git --version`

#### **Step 2: Clone and Setup**

```bash
# Clone your repository
git clone https://github.com/yourusername/Medical-clinic-system.git
cd Medical-clinic-system

# Run setup script
chmod +x setup.sh
./setup.sh
```

#### **Step 3: Manual Setup (Alternative)**

```bash
# Create environment file
cp backend/.env.example backend/.env

# Start services
docker compose up -d

# Check status
docker compose ps
```

### 3. Environment Variables

#### **Required .env File (backend/.env):**
```env
# Database Configuration
DATABASE_URL="postgresql://postgres:password@localhost:5432/medical_clinic_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3000
HOST=localhost
NODE_ENV=development

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### 4. Production Deployment Options

#### **Option A: VPS/Cloud Server**

1. **DigitalOcean/AWS/Azure**
   ```bash
   # On your server
   git clone https://github.com/yourusername/Medical-clinic-system.git
   cd Medical-clinic-system
   
   # Update .env for production
   nano backend/.env
   
   # Start services
   docker compose up -d
   ```

2. **Environment Variables for Production:**
   ```env
   DATABASE_URL="postgresql://user:password@your-db-host:5432/medical_clinic_db"
   JWT_SECRET="your-production-secret-key"
   NODE_ENV="production"
   CORS_ORIGIN="https://yourdomain.com"
   ```

#### **Option B: Docker Hosting (Railway, Render, etc.)**

1. **Railway**
   - Connect GitHub repository
   - Set environment variables in dashboard
   - Deploy automatically

2. **Render**
   - Create new Web Service
   - Connect GitHub repository
   - Set build command: `docker compose up -d`
   - Set environment variables

#### **Option C: Traditional Hosting**

1. **Install Node.js and PostgreSQL**
2. **Clone repository**
3. **Install dependencies:**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
4. **Build frontend:**
   ```bash
   cd frontend && npm run build
   ```
5. **Start services:**
   ```bash
   # Backend
   cd backend && npm start
   
   # Frontend (serve static files)
   cd frontend && npx serve -s dist -l 3001
   ```

### 5. Database Setup

#### **Local Development:**
- Uses Docker PostgreSQL container
- Automatically created and seeded

#### **Production:**
- Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Update DATABASE_URL in .env
- Run migrations: `npx prisma db push`

### 6. Security Considerations

#### **Environment Variables:**
- Never commit .env files
- Use strong JWT secrets
- Use environment-specific database URLs
- Enable HTTPS in production

#### **Database:**
- Use strong passwords
- Enable SSL connections
- Regular backups
- Access restrictions

### 7. Monitoring and Maintenance

#### **Health Checks:**
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Check API health
curl http://localhost:3000/api/auth/login
```

#### **Backup Database:**
```bash
# Create backup
docker exec medical_clinic_db pg_dump -U postgres medical_clinic_db > backup.sql

# Restore backup
docker exec -i medical_clinic_db psql -U postgres medical_clinic_db < backup.sql
```

### 8. Troubleshooting

#### **Common Issues:**

1. **Port conflicts:**
   ```bash
   # Kill processes using ports
   sudo lsof -ti:3000,3001,5432 | xargs kill -9
   ```

2. **Docker issues:**
   ```bash
   # Reset everything
   docker compose down -v
   docker system prune -f
   docker compose up -d
   ```

3. **Database connection:**
   ```bash
   # Check database logs
   docker compose logs postgres
   
   # Test connection
   docker exec medical_clinic_db psql -U postgres -d medical_clinic_db -c "SELECT 1;"
   ```

### 9. Scaling

#### **Horizontal Scaling:**
- Use load balancer (Nginx, HAProxy)
- Multiple backend instances
- Database clustering
- CDN for frontend assets

#### **Vertical Scaling:**
- Increase server resources
- Optimize database queries
- Use caching (Redis)
- Image optimization

### 10. Backup Strategy

#### **Database Backups:**
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec medical_clinic_db pg_dump -U postgres medical_clinic_db > "backup_$DATE.sql"
```

#### **File Backups:**
- Backup uploads/ directory
- Version control for code
- Environment variable backups

### 11. Updates and Maintenance

#### **Code Updates:**
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker compose up -d --build

# Run migrations (if needed)
docker exec medical_clinic_backend npx prisma db push
```

#### **Dependency Updates:**
```bash
# Update packages
cd backend && npm update
cd ../frontend && npm update

# Rebuild containers
docker compose up -d --build
```

This deployment guide covers everything you need to get the Medical Clinic System running on your home PC and deployed to production! 🚀
