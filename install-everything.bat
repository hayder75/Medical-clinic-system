@echo off
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
    echo Node.js not found.
    echo.
    echo Would you like to install Node.js automatically? (Y/N)
    set /p install_node="> "
    if /i "%install_node%"=="Y" (
        echo.
        echo Installing Node.js automatically...
        call install-nodejs.bat
        if %errorLevel% neq 0 (
            echo.
            echo Node.js installation failed or requires restart.
            echo Please restart your computer and run this script again.
            pause
            exit /b 1
        )
    ) else (
        echo.
        echo Please install Node.js manually from: https://nodejs.org/
        echo Or run: install-nodejs.bat
        echo Then run this script again.
        pause
        exit /b 1
    )
)

REM Verify Node.js is available
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js is not available. Please install it first.
    pause
    exit /b 1
)

node --version
echo Node.js found!

echo.
echo [2/6] Checking PostgreSQL installation...
where psql >nul 2>&1
if %errorLevel% neq 0 (
    echo PostgreSQL not found.
    echo.
    echo PostgreSQL requires manual installation.
    echo.
    echo Would you like to open the download page? (Y/N)
    set /p open_pg="> "
    if /i "%open_pg%"=="Y" (
        start https://www.postgresql.org/download/windows/
    )
    echo.
    echo Installation Instructions:
    echo 1. Download and install PostgreSQL
    echo 2. During installation:
    echo    - Remember the password for 'postgres' user
    echo    - Use default port: 5432
    echo    - Install all components
    echo 3. After installation, create database:
    echo    - Open pgAdmin or Command Prompt
    echo    - Run: createdb clinicdb
    echo    - Or use pgAdmin to create database 'clinicdb'
    echo.
    echo Then run this script again.
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

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env >nul
    echo.
    echo ⚠️  IMPORTANT: Please edit backend/.env and set your DATABASE_URL!
    echo    Format: postgresql://username:password@localhost:5432/clinicdb
    echo.
    pause
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
    echo.
    echo ⚠️  WARNING: Database setup may have failed.
    echo    Please check your DATABASE_URL in backend/.env file.
    echo    Make sure PostgreSQL is running and database exists.
    echo.
)

REM Seed default admin user if database is ready
echo.
echo Creating default admin user...
call node create-admin-user.js
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
echo 1. Configure .env file in backend folder
echo 2. Place license.enc file in backend folder
echo 3. Run start-server.bat to start the system
echo 4. Access at: http://localhost:3000
echo.
pause

