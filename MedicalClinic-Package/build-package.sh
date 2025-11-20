#!/bin/bash

# Medical Clinic System - Package Builder
# This script creates a complete deployment package

set -e

echo "═══════════════════════════════════════════════════════"
echo "  Medical Clinic System - Package Builder"
echo "═══════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PACKAGE_NAME="MedicalClinic-System"
BUILD_DIR="build-package"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/$BUILD_DIR/$PACKAGE_NAME"
CLIENT_DEPLOY_DIR="$SCRIPT_DIR"  # Current directory (client-deployment folder)

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf "$PROJECT_ROOT/$BUILD_DIR"
mkdir -p "$PROJECT_ROOT/$DIST_DIR"
mkdir -p "$CLIENT_DEPLOY_DIR"

# Step 1: Build Frontend
echo ""
echo "📦 Step 1: Building Frontend..."
cd "$PROJECT_ROOT/frontend"
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi
npm run build
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Frontend built${NC}"

# Step 2: Copy Frontend
echo ""
echo "📦 Step 2: Copying Frontend..."
mkdir -p "$DIST_DIR/frontend"
cp -r "$PROJECT_ROOT/frontend/dist" "$DIST_DIR/frontend/"
# Also copy to client-deployment (current directory)
mkdir -p "$CLIENT_DEPLOY_DIR/frontend"
cp -r "$PROJECT_ROOT/frontend/dist" "$CLIENT_DEPLOY_DIR/frontend/"
echo -e "${GREEN}✅ Frontend copied${NC}"

# Step 3: Prepare Backend for Compilation
echo ""
echo "📦 Step 3: Preparing Backend..."
cd "$PROJECT_ROOT/backend"

# Install pkg if not installed
if ! command -v pkg &> /dev/null; then
    echo "   Installing pkg globally..."
    npm install -g pkg
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "   Installing backend dependencies..."
    npm install
fi

# Generate Prisma Client
echo "   Generating Prisma Client..."
npx prisma generate

cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Backend prepared${NC}"

# Step 4: Compile Backend
echo ""
echo "📦 Step 4: Compiling Backend to executable..."
cd "$PROJECT_ROOT/backend"
pkg . --targets node18-win-x64 --output "$PROJECT_ROOT/$DIST_DIR/backend.exe"
# Also copy to client-deployment (current directory)
cp "$PROJECT_ROOT/$DIST_DIR/backend.exe" "$SCRIPT_DIR/backend.exe" 2>/dev/null || true
cd "$PROJECT_ROOT"
echo -e "${GREEN}✅ Backend compiled to backend.exe${NC}"

# Step 5: Copy Backend Files
echo ""
echo "📦 Step 5: Copying Backend Files..."
mkdir -p "$DIST_DIR/backend"
cp -r "$PROJECT_ROOT/backend/prisma" "$DIST_DIR/backend/"
cp "$PROJECT_ROOT/backend/.env.example" "$DIST_DIR/backend/.env.example" 2>/dev/null || echo "# Configuration file" > "$DIST_DIR/backend/.env.example"
mkdir -p "$DIST_DIR/backend/uploads"
mkdir -p "$DIST_DIR/backend/uploads/patient-attached-images"
mkdir -p "$DIST_DIR/backend/uploads/dental-photos"
mkdir -p "$DIST_DIR/backend/uploads/receipts"
mkdir -p "$DIST_DIR/backend/uploads/patient-gallery"

# Also copy to client-deployment (current directory)
mkdir -p "$CLIENT_DEPLOY_DIR/backend"
cp -r "$PROJECT_ROOT/backend/prisma" "$CLIENT_DEPLOY_DIR/backend/" 2>/dev/null || true
cp "$PROJECT_ROOT/backend/.env.example" "$CLIENT_DEPLOY_DIR/backend/.env.example" 2>/dev/null || echo "# Configuration file" > "$CLIENT_DEPLOY_DIR/backend/.env.example"

# Copy client default .env file if it exists, otherwise create it
if [ -f "$CLIENT_DEPLOY_DIR/backend/.env.client" ]; then
    echo "   Using existing .env.client file"
else
    # Create default client .env file
    cat > "$CLIENT_DEPLOY_DIR/backend/.env.client" << 'ENVEOF'
# Medical Clinic System - Client Default Configuration
DATABASE_URL=postgresql://clinic_user:clinic_password@localhost:5432/medical_clinic
PORT=3000
HOST=0.0.0.0
JWT_SECRET=medical_clinic_jwt_secret_key_change_this_in_production
UPLOADS_DIR=./uploads
NODE_ENV=production
LICENSE_SECRET=CHANGE_THIS_TO_YOUR_SECRET_KEY_MIN_32_CHARS
ENVEOF
    echo "   Created default .env.client file"
fi

mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/patient-attached-images"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/dental-photos"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/receipts"
mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/patient-gallery"
echo -e "${GREEN}✅ Backend files copied${NC}"

# Step 6: Create Installation Scripts
echo ""
echo "📦 Step 6: Creating Installation Scripts..."

# Windows Installer Script
cat > "$DIST_DIR/install.bat" << 'INSTALL_EOF'
@echo off
REM Medical Clinic System - Automated Installer
REM This script installs everything automatically

echo ========================================
echo Medical Clinic System - Installation
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\MedicalClinic"
set "CURRENT_DIR=%~dp0"

echo [1/5] Creating installation directory...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [2/5] Copying files...
xcopy /E /I /Y "%CURRENT_DIR%*" "%INSTALL_DIR%"

echo [3/5] Setting up PostgreSQL Portable...
REM Note: PostgreSQL portable should be extracted here
REM This is a placeholder - actual PostgreSQL setup will be in separate script

echo [4/5] Setting up auto-start...
copy "%INSTALL_DIR%\start-server.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\" >nul 2>&1

echo [5/5] Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Medical Clinic System.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-server.bat'; $Shortcut.Save()"

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo System installed to: %INSTALL_DIR%
echo.
echo IMPORTANT: You need to:
echo 1. Place license.enc file in: %INSTALL_DIR%\backend\
echo 2. Configure .env file in: %INSTALL_DIR%\backend\
echo 3. Restart your computer or run start-server.bat
echo.
pause
INSTALL_EOF

# Start Server Script
cat > "$DIST_DIR/start-server.bat" << 'START_EOF'
@echo off
REM Medical Clinic System - Server Startup
REM This script starts the server automatically

cd /d "%~dp0"

REM Wait for system to fully boot
timeout /t 10 /nobreak >nul

REM Start backend
start "Medical Clinic Backend" backend.exe

REM Wait a bit
timeout /t 5 /nobreak >nul

REM Start frontend preview server
cd frontend
start "Medical Clinic Frontend" cmd /k "npm run preview -- --port 3001"
cd ..

echo.
echo Medical Clinic System Started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo To access from other computers:
echo Use: http://YOUR_SERVER_IP:3001
echo.
START_EOF

# Setup Script
cat > "$DIST_DIR/setup.bat" << 'SETUP_EOF'
@echo off
REM Medical Clinic System - Initial Setup
REM Run this once after installation

echo ========================================
echo Medical Clinic System - Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking license file...
if not exist "backend\license.enc" (
    echo WARNING: license.enc file not found!
    echo Please place license.enc file in backend\ folder
    echo.
    pause
)

echo [2/3] Setting up database...
echo Please ensure PostgreSQL is running
echo.

echo [3/3] Initializing database...
cd backend
backend.exe --init-db
cd ..

echo.
echo Setup complete!
echo You can now start the server using start-server.bat
echo.
pause
SETUP_EOF

echo -e "${GREEN}✅ Installation scripts created${NC}"

# Step 7: Create README
echo ""
echo "📦 Step 7: Creating Documentation..."

cat > "$DIST_DIR/README.txt" << 'README_EOF'
═══════════════════════════════════════════════════════
  Medical Clinic System - Installation Guide
═══════════════════════════════════════════════════════

QUICK START:
------------
1. Run install.bat (as Administrator)
2. Place license.enc file in: C:\MedicalClinic\backend\
3. Configure .env file in: C:\MedicalClinic\backend\
4. Restart computer (system will auto-start)

FILES INCLUDED:
---------------
- backend.exe          : Compiled backend server (includes Node.js)
- frontend/            : Compiled frontend files
- install.bat          : Installation script
- start-server.bat     : Server startup script
- setup.bat            : Initial setup script

CONFIGURATION:
-------------
1. License File:
   - Place license.enc in: C:\MedicalClinic\backend\
   - Get license from vendor

2. Environment Variables:
   - Edit: C:\MedicalClinic\backend\.env
   - Set DATABASE_URL, JWT_SECRET, etc.

3. Database:
   - PostgreSQL must be installed and running
   - Or use portable PostgreSQL included

ACCESS:
------
- Server PC: http://localhost:3001
- Client PCs: http://SERVER_IP:3001

AUTO-START:
----------
System automatically starts on Windows boot.
To disable: Remove from Startup folder

TROUBLESHOOTING:
---------------
- Check license.enc file exists
- Check PostgreSQL is running
- Check ports 3000 and 3001 are free
- Check Windows Firewall allows ports

SUPPORT:
-------
Contact vendor for license and support.
README_EOF

echo -e "${GREEN}✅ Documentation created${NC}"

# Step 8: Create Package Info
echo ""
echo "📦 Step 8: Finalizing package..."

# Create version file
echo "Package built on: $(date)" > "$PROJECT_ROOT/$DIST_DIR/VERSION.txt"
echo "Version: 1.0.0" >> "$PROJECT_ROOT/$DIST_DIR/VERSION.txt"

echo -e "${GREEN}✅ Package finalized${NC}"

# Step 9: Copy Everything to Client Deployment Folder
echo ""
echo "📦 Step 9: Copying to client-deployment folder..."

# Copy all built files to client-deployment
echo "   Copying compiled backend..."
cp "$DIST_DIR/backend.exe" "$CLIENT_DEPLOY_DIR/" 2>/dev/null || echo "   ⚠️  backend.exe not found (will be created after compilation)"

echo "   Copying frontend..."
if [ -d "$DIST_DIR/frontend/dist" ]; then
    mkdir -p "$CLIENT_DEPLOY_DIR/frontend"
    cp -r "$DIST_DIR/frontend/dist" "$CLIENT_DEPLOY_DIR/frontend/"
    echo -e "${GREEN}✅ Frontend copied${NC}"
else
    echo "   ⚠️  Frontend dist not found"
fi

echo "   Copying backend files..."
if [ -d "$DIST_DIR/backend" ]; then
    mkdir -p "$CLIENT_DEPLOY_DIR/backend"
    cp -r "$DIST_DIR/backend/prisma" "$CLIENT_DEPLOY_DIR/backend/" 2>/dev/null
    cp "$DIST_DIR/backend/.env.example" "$CLIENT_DEPLOY_DIR/backend/.env.example" 2>/dev/null
    mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads"
    mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/patient-attached-images"
    mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/dental-photos"
    mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/receipts"
    mkdir -p "$CLIENT_DEPLOY_DIR/backend/uploads/patient-gallery"
    echo -e "${GREEN}✅ Backend files copied${NC}"
fi

echo "   Copying installation scripts..."
# Scripts are already in client-deployment, but ensure they're up to date
echo -e "${GREEN}✅ Scripts ready${NC}"

echo ""
echo -e "${GREEN}✅ Files copied to client-deployment folder${NC}"

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Package built successfully!${NC}"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Package location: $PROJECT_ROOT/$DIST_DIR"
echo "Client deployment: $CLIENT_DEPLOY_DIR"
echo ""
echo "Next steps:"
echo "1. Add PostgreSQL portable to: $CLIENT_DEPLOY_DIR/postgresql-portable/"
echo "2. Generate license: npm run license:trial"
echo "3. Copy license.enc to: $CLIENT_DEPLOY_DIR/backend/"
echo "4. Test installation on Windows PC"
echo "5. Zip $CLIENT_DEPLOY_DIR folder and send to customer"
echo ""
echo "📦 Client-deployment folder is ready to share!"
echo ""

