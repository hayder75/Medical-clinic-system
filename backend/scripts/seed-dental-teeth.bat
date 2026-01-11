@echo off
REM Medical Clinic System - Seed Dental Services and Teeth
REM This script seeds dental services and teeth data (for clinics with dental department)

echo ========================================
echo Medical Clinic System - Seeding Dental Services and Teeth
echo ========================================
echo.
echo NOTE: This is only needed for clinics with a dental department.
echo If your clinic does NOT have dental services, you can skip this.
echo.
pause

cd /d "%~dp0\.."

echo Step 1/2: Creating dental services...
node scripts/create-dental-services.js
if %errorLevel% neq 0 (
    echo ERROR: Creating dental services failed!
    pause
    exit /b 1
)
echo.

echo Step 2/2: Seeding teeth data (32 teeth for dental chart)...
node scripts/seed-scripts/seed-teeth.js
if %errorLevel% neq 0 (
    echo ERROR: Seeding teeth data failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Dental Services and Teeth Seeding Completed Successfully!
echo ========================================
echo.
pause

