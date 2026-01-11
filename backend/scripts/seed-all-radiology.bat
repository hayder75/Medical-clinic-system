@echo off
REM Medical Clinic System - Seed All Radiology Tests
REM This script seeds all radiology tests and templates

echo ========================================
echo Medical Clinic System - Seeding Radiology Tests
echo ========================================
echo.

cd /d "%~dp0\.."

echo Step 1/4: Cleaning up old radiology tests (keeping only 9 ultrasound tests)...
node scripts/cleanup-radiology-tests.js
if %errorLevel% neq 0 (
    echo ERROR: Radiology cleanup failed!
    pause
    exit /b 1
)
echo.

echo Step 2/4: Creating missing ultrasound tests...
node scripts/create-missing-ultrasound-tests.js
if %errorLevel% neq 0 (
    echo ERROR: Creating missing ultrasound tests failed!
    pause
    exit /b 1
)
echo.

echo Step 3/4: Populating radiology templates (Findings and Conclusion)...
node scripts/populate-radiology-templates.js
if %errorLevel% neq 0 (
    echo ERROR: Populating radiology templates failed!
    pause
    exit /b 1
)
echo.

echo Step 4/4: Fixing radiology services (ensuring InvestigationType records exist)...
node scripts/fix-radiology-services.js
if %errorLevel% neq 0 (
    echo ERROR: Fixing radiology services failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Radiology Tests Seeding Completed Successfully!
echo ========================================
echo.
pause

