# Medical Clinic System - Installation Guide

## 📋 Prerequisites

Before starting, make sure you have installed:
1. **Node.js** (v16 or higher) - Download from https://nodejs.org/
2. **PostgreSQL** - Download from https://www.postgresql.org/download/
3. **Git** (optional, for version control)

---

## 🚀 Step-by-Step Installation

### STEP 1: Extract the ZIP File

1. Extract the `Medical-clinic-system-deployment.zip` file to a folder (e.g., `C:\Medical-clinic-system-deployment`)
2. Make sure the folder structure looks like this:
   ```
   Medical-clinic-system-deployment/
   ├── backend/
   ├── frontend/
   ├── *.bat files
   └── INSTALLATION_GUIDE.md
   ```

---

### STEP 2: Install PostgreSQL (if not already installed)

1. Download and install PostgreSQL from https://www.postgresql.org/download/
2. During installation:
   - Remember the password you set for the `postgres` user
   - Default port is 5432 (keep this)
   - Install pgAdmin (optional but recommended)

**Important:** The password in the `.env` file is set to: `Jesus@123`

If your PostgreSQL password is different, you need to update the `.env` file:
- Location: `backend\.env`
- Find the line: `DATABASE_URL=postgresql://postgres:Jesus%40123@localhost:5432/clinicdatabase`
- Replace `Jesus%40123` with your actual password (URL-encoded)
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`

---

### STEP 3: Create the Database

1. Open Command Prompt or PowerShell
2. Navigate to the project folder:
   ```cmd
   cd C:\Medical-clinic-system-deployment
   ```
3. Run the database creation script:
   ```cmd
   create-database.bat
   ```
   This will create a database named `clinicdatabase`

**Note:** If you get a password prompt, enter: `Jesus@123` (or your PostgreSQL password)

---

### STEP 4: Setup Database Tables

1. Make sure you're still in the project folder
2. Run the database setup script:
   ```cmd
   setup-database.bat
   ```
   This will create all necessary tables in the database

**Expected output:** You should see "Database setup completed successfully!"

---

### STEP 5: Install Backend Dependencies

1. Open Command Prompt or PowerShell
2. Navigate to the backend folder:
   ```cmd
   cd backend
   ```
3. Install Node.js packages:
   ```cmd
   npm install
   ```
   This may take a few minutes. Wait for it to complete.

---

### STEP 6: Install Frontend Dependencies

1. Open a NEW Command Prompt or PowerShell window
2. Navigate to the frontend folder:
   ```cmd
   cd C:\Medical-clinic-system-deployment\frontend
   ```
3. Install Node.js packages:
   ```cmd
   npm install
   ```
   This may take a few minutes. Wait for it to complete.

---

### STEP 7: Seed the Database (Create Initial Data)

1. Go back to the main project folder:
   ```cmd
   cd C:\Medical-clinic-system-deployment
   ```
2. Run the seed script:
   ```cmd
   seed-system.bat
   ```
   This will create:
   - Admin user and other staff users
   - Services, insurance, and other initial data

**Expected output:** You should see "Seeding completed successfully!"

---

### STEP 8: Start the System

1. Make sure you're in the main project folder:
   ```cmd
   cd C:\Medical-clinic-system-deployment
   ```
2. Run the start script:
   ```cmd
   start-server.bat
   ```
   This will:
   - Start the backend server on port 3000
   - Start the frontend server on port 3001
   - Open two separate windows (one for backend, one for frontend)

**Wait for both servers to start** (you'll see "Server running on port 3000" and similar messages)

---

### STEP 9: Access the System

1. Open your web browser
2. Go to: `http://localhost:3001`
3. You should see the login page

---

## 🔐 Default Login Credentials

After seeding, you can login with:

| Username | Password | Role |
|----------|----------|------|
| **admin** | admin123 | Administrator |
| **doctor1** | doctor123 | Doctor |
| **nurse1** | nurse123 | Nurse |
| **billing1** | billing123 | Billing Officer |
| **pharmacy1** | pharmacy123 | Pharmacist |
| **lab1** | lab123 | Lab Technician |
| **radiology1** | radiology123 | Radiologist |
| **reception** | reception123 | Receptionist |

**⚠️ IMPORTANT:** Change these passwords after first login!

---

## 📝 Quick Reference - BAT Files

Here's what each BAT file does:

| File | Purpose |
|------|---------|
| `create-database.bat` | Creates the PostgreSQL database |
| `setup-database.bat` | Creates all database tables |
| `seed-system.bat` | Seeds initial data (users, services, etc.) |
| `start-server.bat` | Starts both backend and frontend servers |
| `check-database.bat` | Checks if database exists |
| `create-admin-user.bat` | Creates admin user (if needed) |
| `find-server-ip.bat` | Finds your server IP for network access |
| `setup-auto-start.bat` | Sets up Windows service for auto-start |

---

## 🔧 Troubleshooting

### Problem: "Database connection failed"
**Solution:**
1. Make sure PostgreSQL is running
2. Check the password in `backend\.env` file
3. Verify the database name is correct
4. Try running `check-database.bat` to see available databases

### Problem: "Port 3000 or 3001 already in use"
**Solution:**
1. Close any other applications using these ports
2. Or change the ports in:
   - Backend: `backend\server.js` (look for `PORT = 3000`)
   - Frontend: `frontend\vite.config.js` (look for port configuration)

### Problem: "npm install fails"
**Solution:**
1. Make sure Node.js is installed: `node --version`
2. Try clearing npm cache: `npm cache clean --force`
3. Delete `node_modules` folder and `package-lock.json`, then run `npm install` again

### Problem: "Cannot find module"
**Solution:**
1. Make sure you ran `npm install` in both `backend` and `frontend` folders
2. Check that `node_modules` folders exist in both directories

### Problem: "Authentication failed for user postgres"
**Solution:**
1. The password in `.env` file is: `Jesus@123`
2. If your PostgreSQL password is different, update the `.env` file
3. Remember to URL-encode special characters:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`

---

## 🌐 Accessing from Other Computers

If you want to access the system from other computers on the same network:

1. Run: `find-server-ip.bat` to get your server IP address
2. On other computers, open browser and go to: `http://YOUR_IP_ADDRESS:3001`
3. Example: `http://192.168.1.100:3001`

---

## 🔄 Daily Usage

### Starting the System:
```cmd
start-server.bat
```

### Stopping the System:
- Close the two command windows (backend and frontend)
- Or press `Ctrl+C` in each window

### Restarting the System:
1. Stop the system (close windows)
2. Run `start-server.bat` again

---

## 📞 Support

If you encounter any issues:
1. Check the error messages in the command windows
2. Verify all prerequisites are installed
3. Make sure all BAT files completed successfully
4. Check that PostgreSQL is running

---

## ✅ Installation Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed
- [ ] Database created (`create-database.bat`)
- [ ] Database tables created (`setup-database.bat`)
- [ ] Backend dependencies installed (`npm install` in backend folder)
- [ ] Frontend dependencies installed (`npm install` in frontend folder)
- [ ] Database seeded (`seed-system.bat`)
- [ ] System started (`start-server.bat`)
- [ ] Can access `http://localhost:3001`
- [ ] Can login with admin credentials

---

## 🎉 You're All Set!

Once you complete all steps, your Medical Clinic System is ready to use!

**Remember:**
- Keep the backend and frontend windows open while using the system
- Change default passwords after first login
- Backup your database regularly

---

**Last Updated:** November 2025
**Version:** 1.0



