@echo off
REM Medical Clinic System - PostgreSQL Installation Guide
REM Opens PostgreSQL download page and provides instructions

echo ========================================
echo PostgreSQL Installation Guide
echo ========================================
echo.

where psql >nul 2>&1
if %errorLevel% equ 0 (
    echo PostgreSQL is already installed!
    psql --version
    pause
    exit /b 0
)

echo PostgreSQL requires manual installation.
echo.
echo Opening download page...
start https://www.postgresql.org/download/windows/

echo.
echo ========================================
echo Installation Instructions:
echo ========================================
echo.
echo 1. Download PostgreSQL from the opened page
echo 2. Run the installer
echo 3. During installation:
echo    - Remember the password for 'postgres' user
echo    - Use default port: 5432
echo    - Install all components
echo.
echo 4. After installation, create database:
echo    - Open pgAdmin or psql
echo    - Create database named: clinicdb
echo    - Or run: createdb clinicdb
echo.
echo 5. Then run install-everything.bat again
echo.
echo ========================================
echo.
pause
