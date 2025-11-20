# Cleanup and Setup Plan

## 🧹 What to Remove

### Files to Delete:
- All `.md` files (documentation)
- `client-deployment/` folder
- `build-package/` folder
- All `.sh` scripts (build scripts)
- All `.ps1` scripts (installer scripts)
- Test files in root
- Backup files
- Export files

### Keep:
- `backend/` folder (source code)
- `frontend/` folder (source code)
- `package.json` files
- License system (as is - file-based)
- Essential config files

## 🚀 What to Create

### Auto-Setup Script:
- Installs Node.js (if not installed)
- Installs PostgreSQL (if not installed)
- Installs npm dependencies
- Sets up database
- Configures environment

### Auto-Start Script:
- Windows Service or Startup folder
- Starts backend and frontend automatically
- Runs on boot

### Network Setup:
- Instructions for finding server IP
- Firewall configuration
- Client PC connection guide

## 📦 Final Package Structure

```
MedicalClinic-Source/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── server.js
│   ├── package.json
│   └── ...
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
├── install-everything.bat
├── start-server.bat
├── setup-auto-start.bat
└── README.txt
```

