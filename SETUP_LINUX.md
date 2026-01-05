# Medical Clinic System - Linux/Ubuntu Setup Guide

This guide is for setting up the Medical Clinic System on Ubuntu/Linux systems.

## 📋 Prerequisites

Before starting, make sure you have installed:

1. **Node.js** (v16 or higher)
   ```bash
   # Using NodeSource repository (recommended)
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Or using snap
   sudo snap install node --classic
   ```

2. **PostgreSQL**
   ```bash
   sudo apt-get update
   sudo apt-get install postgresql postgresql-contrib
   ```

3. **Git** (optional, for version control)
   ```bash
   sudo apt-get install git
   ```

---

## 🚀 Quick Setup (Automated)

The easiest way to set up the system is to use the automated setup script:

```bash
# Make scripts executable (if not already)
chmod +x setup-system.sh start-server.sh

# Run the setup script
./setup-system.sh
```

This script will:
1. ✅ Check if `.env` file exists, create it if needed
2. ✅ Create the database if it doesn't exist
3. ✅ Install all dependencies (backend and frontend)
4. ✅ Set up database schema
5. ✅ Seed the system with initial data
6. ✅ Create admin user

---

## 📝 Manual Setup Steps

If you prefer to set up manually, follow these steps:

### STEP 1: Create .env File

Navigate to the backend folder and create a `.env` file:

```bash
cd backend
nano .env
```

Add the following content (replace with your PostgreSQL credentials):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/clinicdatabase
JWT_SECRET=fallback-secret-key-change-in-production
```

**Important:** If your password contains special characters, URL-encode them:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- Space becomes `%20`

**Example:** If your password is `My@Pass123`, use `My%40Pass123`

### STEP 2: Create the Database

```bash
# Connect to PostgreSQL as postgres user
sudo -u postgres psql

# Create the database
CREATE DATABASE clinicdatabase;

# Exit PostgreSQL
\q
```

### STEP 3: Install Backend Dependencies

```bash
cd backend
npm install
```

### STEP 4: Setup Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma db push
```

### STEP 5: Seed the System

```bash
# Make sure system-backup.json exists in backend folder
node scripts/seed-complete-system.js
```

### STEP 6: Create Admin User

```bash
node scripts/seed-scripts/create-admin-user.js
```

### STEP 7: Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 🚀 Starting the System

### Option 1: Using the Start Script (Recommended)

```bash
./start-server.sh
```

This will start both backend and frontend servers.

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🌐 Accessing the System

Once both servers are running:

1. Open your web browser
2. Go to: `http://localhost:3001`
3. You should see the login page

---

## 🔐 Default Login Credentials

After setup, you can login with:

| Username | Password | Role |
|----------|----------|------|
| **admin** | admin123 | Administrator |

**⚠️ IMPORTANT:** Change this password immediately after first login!

---

## 🔧 Troubleshooting

### Problem: "PostgreSQL connection failed"

**Solution:**
1. Make sure PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   sudo systemctl start postgresql  # if not running
   ```

2. Check your `.env` file in `backend/.env`
3. Verify the database name is correct
4. Test connection manually:
   ```bash
   psql -U postgres -d clinicdatabase
   ```

### Problem: "Port 3000 or 3001 already in use"

**Solution:**
1. Find and kill the process using the port:
   ```bash
   # For port 3000
   sudo lsof -ti:3000 | xargs kill -9
   
   # For port 3001
   sudo lsof -ti:3001 | xargs kill -9
   ```

2. Or change the ports in:
   - Backend: `backend/server.js` (look for `PORT = 3000`)
   - Frontend: `frontend/vite.config.js` (look for port configuration)

### Problem: "npm install fails"

**Solution:**
1. Make sure Node.js is installed: `node --version`
2. Try clearing npm cache: `npm cache clean --force`
3. Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### Problem: "Cannot find module"

**Solution:**
1. Make sure you ran `npm install` in both `backend` and `frontend` folders
2. Check that `node_modules` folders exist in both directories

### Problem: "Permission denied" when running scripts

**Solution:**
```bash
chmod +x setup-system.sh start-server.sh
```

### Problem: "Database does not exist"

**Solution:**
1. Create the database manually:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE clinicdatabase;
   \q
   ```

2. Or run the setup script again: `./setup-system.sh`

---

## 📁 Script Files

| File | Purpose |
|------|---------|
| `setup-system.sh` | Complete automated setup (database, schema, seed, admin) |
| `start-server.sh` | Start both backend and frontend servers |

---

## 🔄 Daily Usage

### Starting the System:
```bash
./start-server.sh
```

### Stopping the System:
- Press `Ctrl+C` in the terminal where the script is running
- Or find and kill the processes:
  ```bash
  pkill -f "node server.js"
  pkill -f "vite"
  ```

### Restarting the System:
1. Stop the system (Ctrl+C)
2. Run `./start-server.sh` again

---

## ✅ Setup Checklist

- [ ] Node.js installed (`node --version`)
- [ ] PostgreSQL installed and running
- [ ] Database created (`./setup-system.sh` or manually)
- [ ] Database schema created (Prisma migrations)
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] System seeded with initial data
- [ ] Admin user created
- [ ] Can access `http://localhost:3001`
- [ ] Can login with admin credentials

---

## 🎉 You're All Set!

Once you complete all steps, your Medical Clinic System is ready to use!

**Remember:**
- Keep the servers running while using the system
- Change default passwords after first login
- Backup your database regularly

---

**Last Updated:** November 2025  
**Version:** 1.0

