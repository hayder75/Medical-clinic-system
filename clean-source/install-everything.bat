@echo off
setlocal enabledelayedexpansion
REM Medical Clinic System - Complete Auto-Installation
REM This script installs everything needed and sets up the system

echo ========================================
echo Medical Clinic System - Auto Installation
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

cd /d "%~dp0"

echo [1/6] Checking Node.js installation...
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo Node.js not found. Please install Node.js first.
    echo Download from: https://nodejs.org/
    echo Install Node.js and run this script again.
    pause
    exit /b 1
) else (
    node --version
    echo Node.js found!
)

echo.
echo [2/6] Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo PostgreSQL not found. Please install PostgreSQL first.
    echo Download from: https://www.postgresql.org/download/windows/
    echo Install PostgreSQL and run this script again.
    pause
    exit /b 1
) else (
    psql --version
    echo PostgreSQL found!
)

echo.
echo [3/6] Installing backend dependencies...
cd backend
if not exist "node_modules" (
    echo Installing backend packages...
    call npm install
    if %errorLevel% neq 0 (
        echo ERROR: Backend installation failed!
        pause
        exit /b 1
    )
) else (
    echo Backend dependencies already installed.
)
cd ..

echo.
echo [4/6] Installing frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing frontend packages...
    call npm install
    if %errorLevel% neq 0 (
        echo ERROR: Frontend installation failed!
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)
cd ..

echo.
echo [5/6] Setting up database...
cd backend

REM Check if .env exists, if not create it
if not exist ".env" (
    echo.
    echo ═══════════════════════════════════════════════════════
    echo   Database Configuration
    echo ═══════════════════════════════════════════════════════
    echo.
    echo Please enter your PostgreSQL password:
    echo (This is the password you set when installing PostgreSQL)
    echo.
    set /p postgres_password="PostgreSQL Password: "
    
    if "!postgres_password!"=="" (
        echo.
        echo ERROR: Password cannot be empty!
        echo Please run this script again and enter your PostgreSQL password.
        pause
        exit /b 1
    )
    
    echo.
    echo Creating .env file with your password...
    
    REM Create .env file with the password
    (
        echo # Database Configuration
        echo DATABASE_URL="postgresql://postgres:!postgres_password!@localhost:5432/clinicdb?schema=public"
        echo.
        echo # Server Configuration
        echo PORT=3000
        echo HOST=0.0.0.0
        echo NODE_ENV=development
        echo.
        echo # JWT Secret
        echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
        echo.
        echo # License Secret
        echo LICENSE_SECRET=CHANGE_THIS_TO_YOUR_SECRET_KEY_MIN_32_CHARS
        echo.
        echo # Uploads Directory
        echo UPLOADS_DIR=uploads
        echo.
        echo # Frontend URL
        echo FRONTEND_URL=http://localhost:5173
    ) > .env
    
    echo ✅ .env file created successfully!
    echo.
) else (
    echo .env file already exists.
    echo If you need to change the database password, edit backend/.env manually.
    echo.
)

call npx prisma generate
if %errorLevel% neq 0 (
    echo ERROR: Prisma generation failed!
    pause
    exit /b 1
)

REM Check if database exists, if not create it
echo Setting up database schema...
call npx prisma db push
if %errorLevel% neq 0 (
    echo WARNING: Database setup may have failed. Check your DATABASE_URL in .env file.
)
cd ..

echo.
echo [6/6] Setting up auto-start...
call setup-auto-start.bat

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. License file is already included (30-day trial)
echo 2. Run start-server.bat to start the system
echo 3. Access at: http://localhost:5173
echo 4. Login: admin / admin123
echo.
pause

