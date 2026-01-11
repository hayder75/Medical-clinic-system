@echo off
REM Create Admin User
echo ========================================
echo Medical Clinic System - Create Admin User
echo ========================================
echo.
echo This will create an admin user with:
echo   Username: admin
echo   Password: admin123
echo   Email: admin@clinic.com
echo.
pause

cd /d "%~dp0\backend"

REM Check if .env exists
if not exist .env (
    echo.
    echo ERROR: .env file not found!
    echo Please run setup-database.bat first.
    echo.
    pause
    exit /b 1
)

echo Creating admin user...
echo.
call node scripts/seed-scripts/create-admin-user.js

if %errorLevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to create admin user!
    echo ========================================
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Admin user created successfully!
echo ========================================
echo.
echo You can now login with:
echo   Username: admin
echo   Password: admin123
echo.
echo IMPORTANT: Change the password after first login!
echo.
cd ..
pause
