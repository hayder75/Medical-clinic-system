@echo off
setlocal enabledelayedexpansion
REM Seed All System Data - For Existing Database
echo ========================================
echo Medical Clinic System - Seed System Data
echo ========================================
echo.
echo This will seed ALL system data:
echo   - Lab Tests (CBC, HIV, HBsAg, HCG, Urinalysis, Stool, etc.)
echo   - Radiology Tests (9 Ultrasound tests with templates)
echo   - Card Services (Registration and Activation)
echo   - Nurse Walk-in Services
echo   - Emergency Drug Services
echo   - Material Needs Services
echo   - Dental Services and Teeth (optional)
echo.
echo NOTE: Database and tables must already exist!
echo       If tables don't exist, run setup-database.bat first.
echo.
pause

cd /d "%~dp0\backend"

REM Check if .env exists
if not exist .env (
    echo.
    echo ERROR: .env file not found!
    echo Please make sure .env file exists in backend folder.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo VERIFICATION: Checking Database Tables
echo ========================================
echo.
echo IMPORTANT: All database tables must exist before seeding!
echo.
echo If you haven't run setup-database.bat yet, please do so first.
echo.
echo This will verify tables exist. If they don't, run:
echo   1. verify-database-tables.bat (quick fix)
echo   2. OR setup-database.bat (full setup)
echo.
pause

echo.
echo Checking if LabTestGroup table exists...
node scripts/check-tables-exist.js

if %errorLevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Database tables are missing!
    echo ========================================
    echo.
    echo Please run ONE of these first:
    echo   1. verify-database-tables.bat (recommended - quick fix)
    echo   2. setup-database.bat (full database setup)
    echo.
    echo Then come back and run this seed file again.
    echo.
    pause
    exit /b 1
)

echo.
echo Database tables verified - proceeding with seeding...
echo.
pause

echo.
echo ========================================
echo PART 1: Seeding Lab Tests
echo ========================================
echo.

echo Step 1/4: Consolidating CBC tests...
node scripts/consolidate-cbc.js
if %errorLevel% neq 0 (
    echo.
    echo WARNING: CBC consolidation had issues.
    echo This might be because tables don't exist yet.
    echo.
    echo IMPORTANT: Make sure you ran setup-database.bat first!
    echo If tables are missing, run: cd backend ^&^& npm exec prisma db push
    echo.
    echo Continuing with other seeding steps...
    echo.
)
echo.

echo Step 2/4: Updating lab templates (HIV, HBsAg, HCG, Urinalysis, Stool, CBC)...
node scripts/update-lab-templates-simple.js
if %errorLevel% neq 0 (
    echo ERROR: Lab template update failed!
    pause
    exit /b 1
)
echo.

echo Step 3/4: Creating new lab tests (H. pylori Antigen, H. pylori Antibody, ESR)...
node scripts/create-new-lab-tests.js
if %errorLevel% neq 0 (
    echo ERROR: New lab test creation failed!
    pause
    exit /b 1
)
echo.

echo Step 4/4: Adding "Strongly Reactive" option to relevant tests...
node scripts/add-strongly-reactive-option.js
if %errorLevel% neq 0 (
    echo ERROR: Adding strongly reactive option failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Lab Tests Seeding Completed!
echo ========================================
echo.

echo.
echo ========================================
echo PART 2: Seeding Radiology Tests
echo ========================================
echo.

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
echo Radiology Tests Seeding Completed!
echo ========================================
echo.

echo.
echo ========================================
echo PART 3: Seeding Other Services
echo ========================================
echo.

echo Step 1/2: Creating card services (Card Registration and Activation)...
node scripts/create-card-services.js
if %errorLevel% neq 0 (
    echo ERROR: Creating card services failed!
    pause
    exit /b 1
)
echo.

echo Step 2/2: Seeding service categories (Nurse Walk-in, Emergency Drugs, Material Needs)...
node scripts/seed-new-service-categories.js
if %errorLevel% neq 0 (
    echo ERROR: Seeding service categories failed!
    pause
    exit /b 1
)
echo.

echo ========================================
echo Other Services Seeding Completed!
echo ========================================
echo.

echo.
echo ========================================
echo PART 4: Dental Services and Teeth (OPTIONAL)
echo ========================================
echo.
echo Does your clinic have a dental department?
echo.
set /p HAS_DENTAL="Enter Y for Yes, N for No (default: N): "

if /i "!HAS_DENTAL!"=="Y" (
    echo.
    echo Creating dental services...
    node scripts/create-dental-services.js
    if %errorLevel% neq 0 (
        echo ERROR: Creating dental services failed!
        pause
        exit /b 1
    )
    echo.
    
    echo Seeding teeth data (32 teeth for dental chart)...
    node scripts/seed-scripts/seed-teeth.js
    if %errorLevel% neq 0 (
        echo ERROR: Seeding teeth data failed!
        pause
        exit /b 1
    )
    echo.
    
    echo ========================================
    echo Dental Services and Teeth Seeding Completed!
    echo ========================================
    echo.
) else (
    echo.
    echo Skipping dental services (clinic does not have dental department).
    echo.
)

echo.
echo ========================================
echo ========================================
echo System Data Seeding Completed!
echo ========================================
echo ========================================
echo.
echo Summary:
echo   - Lab Tests: Seeded
echo   - Radiology Tests: Seeded
echo   - Card Services: Seeded (Registration and Activation)
echo   - Nurse Walk-in Services: Seeded
echo   - Emergency Drug Services: Seeded
echo   - Material Needs Services: Seeded
if /i "!HAS_DENTAL!"=="Y" (
    echo   - Dental Services: Seeded
    echo   - Teeth Data: Seeded
) else (
    echo   - Dental Services: Skipped
    echo   - Teeth Data: Skipped
)
echo.
echo Next steps:
echo   1. Run create-admin-user.bat to create admin account (if not done)
echo   2. Start backend: cd backend ^&^& npm start
echo   3. Start frontend: cd frontend ^&^& npm run dev
echo.
cd ..
pause

