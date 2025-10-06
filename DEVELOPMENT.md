# Development Workflow Guide

## 🔄 **Do You Need to Recreate Docker Every Time?**

**Short Answer: NO!** Here are your options:

### **Option 1: Development Mode (Recommended) 🚀**

Use the development Docker setup with **hot reload** - your code changes automatically update without rebuilding!

```bash
# Start development mode
./dev.sh dev

# Your code changes will automatically reload!
# No need to rebuild containers
```

**What happens:**
- ✅ Code changes are **instantly reflected**
- ✅ No container rebuilding needed
- ✅ Hot reload for both frontend and backend
- ✅ Volume mounting keeps your code in sync

### **Option 2: Production Mode 🏭**

Use the production Docker setup - requires rebuilding for changes:

```bash
# Start production mode
./dev.sh prod

# For code changes, you need to rebuild:
docker compose up -d --build
```

### **Option 3: Hybrid Development (Best of Both Worlds) 🎯**

Run database in Docker, code locally:

```bash
# Start only database
docker compose up -d postgres

# Run backend locally
cd backend
npm install
npm run dev

# Run frontend locally (in another terminal)
cd frontend
npm install
npm run dev
```

## 🛠️ **Development Commands**

### **Quick Commands:**
```bash
# Development mode (hot reload)
./dev.sh dev

# Production mode
./dev.sh prod

# Stop all services
./dev.sh stop

# View logs
./dev.sh logs

# Restart services
./dev.sh restart

# Clean everything
./dev.sh clean
```

### **Manual Docker Commands:**
```bash
# Development mode
docker compose -f docker-compose.dev.yml up -d

# Production mode
docker compose up -d

# Rebuild specific service
docker compose build backend
docker compose up -d backend

# View logs
docker compose logs -f backend
docker compose logs -f frontend
```

## 📁 **File Structure for Development**

```
Medical-clinic-system/
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
├── dev.sh                      # Development script
├── backend/
│   ├── Dockerfile              # Production backend
│   ├── Dockerfile.dev          # Development backend
│   ├── src/                    # Your code (hot reloaded)
│   └── package.json
└── frontend/
    ├── Dockerfile              # Production frontend
    ├── Dockerfile.dev          # Development frontend
    ├── src/                    # Your code (hot reloaded)
    └── package.json
```

## 🔥 **Hot Reload Explained**

### **Backend Hot Reload:**
- Uses `nodemon` to watch file changes
- Automatically restarts server when you save files
- No need to rebuild Docker container

### **Frontend Hot Reload:**
- Uses Vite's built-in hot reload
- Instant updates in browser
- No page refresh needed

### **Volume Mounting:**
```yaml
# In docker-compose.dev.yml
volumes:
  - ./backend:/app          # Your local code → container
  - /app/node_modules       # Keep container's node_modules
```

## ⚡ **When You DO Need to Rebuild**

### **Rebuild Required:**
- ✅ Adding new npm packages
- ✅ Changing Dockerfile
- ✅ Modifying environment variables
- ✅ Database schema changes (Prisma)

### **Rebuild NOT Required:**
- ❌ Changing React components
- ❌ Modifying API routes
- ❌ Updating CSS/styling
- ❌ Changing business logic

## 🚀 **Recommended Development Workflow**

### **1. Start Development Mode:**
```bash
./dev.sh dev
```

### **2. Make Code Changes:**
- Edit files in `backend/src/` or `frontend/src/`
- Changes automatically reload
- No Docker rebuild needed

### **3. Add New Dependencies:**
```bash
# Backend
cd backend
npm install new-package

# Rebuild container
docker compose -f docker-compose.dev.yml up -d --build backend
```

### **4. Database Changes:**
```bash
# Update Prisma schema
cd backend
npx prisma db push

# Or run migrations
npx prisma migrate dev
```

## 🔧 **Troubleshooting**

### **Hot Reload Not Working:**
```bash
# Restart development mode
./dev.sh stop
./dev.sh dev
```

### **Code Changes Not Reflecting:**
```bash
# Check if volumes are mounted correctly
docker compose -f docker-compose.dev.yml ps

# Restart specific service
docker compose -f docker-compose.dev.yml restart backend
```

### **Performance Issues:**
```bash
# Use hybrid mode (database in Docker, code local)
docker compose up -d postgres
cd backend && npm run dev
cd frontend && npm run dev
```

## 📊 **Performance Comparison**

| Method | Startup Time | Code Change Time | Resource Usage |
|--------|-------------|------------------|----------------|
| **Development Mode** | ~30s | **Instant** | Medium |
| **Production Mode** | ~30s | ~30s rebuild | Low |
| **Hybrid Mode** | ~10s | **Instant** | Low |

## 🎯 **Best Practices**

### **For Active Development:**
- Use `./dev.sh dev` for hot reload
- Keep database in Docker
- Run code locally for maximum speed

### **For Testing:**
- Use `./dev.sh prod` to test production build
- Verify everything works before deployment

### **For Deployment:**
- Always test with production mode
- Use `docker compose up -d` for final testing

## 🚨 **Important Notes**

1. **Development mode** uses more resources but provides instant feedback
2. **Production mode** is more efficient but requires rebuilds
3. **Hybrid mode** gives you the best of both worlds
4. **Always test** in production mode before deploying

**Choose the workflow that fits your development style!** 🎉
