# Installation Guide

## 🖥️ What You Need to Install on Your Home PC

### 1. Required Software

#### **Node.js** (v18 or higher)
- **Download**: https://nodejs.org/
- **Why**: Required for running the backend and frontend
- **Check**: `node --version`

#### **Docker Desktop**
- **Download**: https://www.docker.com/products/docker-desktop/
- **Why**: Runs the database and containers
- **Check**: `docker --version`

#### **Git**
- **Download**: https://git-scm.com/
- **Why**: To clone the repository
- **Check**: `git --version`

### 2. Environment Variables You Need to Create

When you clone the repository, you'll need to create these files:

#### **backend/.env** (Copy from .env.example)
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

### 3. Quick Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-github-repo-url>
   cd Medical-clinic-system
   ```

2. **Run the setup script**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Or manually setup**
   ```bash
   # Copy environment file
   cp backend/.env.example backend/.env
   
   # Start with Docker
   docker compose up -d
   ```

### 4. What Gets Uploaded to GitHub

✅ **These files ARE uploaded:**
- All source code (backend/, frontend/)
- Package.json files
- Docker configuration files
- README.md and documentation
- .env.example (template)

❌ **These files are NOT uploaded (in .gitignore):**
- .env files (contains secrets)
- node_modules/ (dependencies)
- uploads/ (user files)
- *.db files (database files)
- Log files

### 5. Troubleshooting

#### **Port Already in Use**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000,3001,5432 | xargs kill -9
```

#### **Docker Issues**
```bash
# Reset everything
docker compose down -v
docker system prune -f
docker compose up -d
```

#### **Database Issues**
```bash
# Check if PostgreSQL is running
docker compose ps

# View database logs
docker compose logs postgres
```

### 6. Development vs Production

#### **Development** (what you'll use at home)
- Uses Docker for database
- Frontend runs on localhost:3001
- Backend runs on localhost:3000
- Uses .env file for configuration

#### **Production** (when you deploy)
- Uses cloud database (AWS RDS, etc.)
- Uses environment variables from hosting platform
- Frontend and backend deployed separately
- Uses production-grade secrets

### 7. File Structure After Clone

```
Medical-clinic-system/
├── .gitignore              # What not to upload
├── .env.example            # Environment template
├── README.md               # Main documentation
├── INSTALL.md              # This file
├── setup.sh                # Setup script
├── docker-compose.yml      # Docker services
├── backend/
│   ├── .env.example        # Backend env template
│   ├── .env                # You create this
│   ├── package.json
│   ├── Dockerfile
│   └── src/                # Backend code
└── frontend/
    ├── package.json
    ├── Dockerfile
    └── src/                # Frontend code
```

### 8. Next Steps After Installation

1. **Test the system**: Visit http://localhost:3001
2. **Login**: Use admin/admin123
3. **Explore**: Try different user roles
4. **Customize**: Modify the code as needed
5. **Deploy**: When ready, deploy to cloud

### 9. Support

If you encounter issues:
1. Check this INSTALL.md file
2. Check README.md for more details
3. Open an issue on GitHub
4. Check Docker logs: `docker compose logs`
