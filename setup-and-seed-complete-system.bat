@echo off
setlocal enabledelayedexpansion
REM Complete System Setup and Seeding - ALL IN ONE
echo ========================================
echo Medical Clinic System - Complete Setup and Seeding
echo ========================================
echo.
echo This will:
echo   1. Setup database tables (Prisma migrations)
echo   2. Seed ALL system data:
echo      - Lab Tests (CBC, HIV, HBsAg, HCG, Urinalysis, Stool, etc.)
echo      - Radiology Tests (9 Ultrasound tests with templates)
echo      - Services (Card Services, Consultation, etc.)
echo      - Investigation Types
echo      - Dental Services and Teeth (optional)
echo   3. Create Admin User
echo.
echo Make sure PostgreSQL is installed and running!
echo.
pause

cd /d "%~dp0\backend"

REM Check if .env exists
if not exist .env (
    echo.
    echo ERROR: .env file not found!
    echo Please run create-env-file.bat first to create the .env file.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo STEP 1: Database Setup (Migrations)
echo ========================================
echo.

echo IMPORTANT: Make sure the backend server is NOT running!
echo If you see "EPERM" errors, stop the server and try again.
echo.
pause

echo Installing/Updating dependencies...
call npm install
if %errorLevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Stopping any running Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Generating Prisma Client...
call npm exec prisma generate
if %errorLevel% neq 0 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo Running database migrations (creating all tables)...
echo NOTE: This will create all required tables including LabTestGroup, Service, LabTest, etc.
echo.
echo First trying: prisma migrate deploy (for production/existing migrations)...
call npm exec prisma migrate deploy
if %errorLevel% neq 0 (
    echo.
    echo migrate deploy failed, trying db push (for development/first setup)...
    echo This will create all tables from schema.prisma
    echo.
    pause
    call npm exec prisma db push --accept-data-loss
    if %errorLevel% neq 0 (
        echo.
        echo ========================================
        echo ERROR: Failed to create database tables!
        echo ========================================
        echo.
        echo Please check:
        echo   1. Database exists (run create-database.bat first if not created)
        echo   2. .env file has correct DATABASE_URL
        echo   3. PostgreSQL service is running
        echo   4. Database user has CREATE TABLE permissions
        echo.
        echo Current .env DATABASE_URL:
        type .env | findstr DATABASE_URL
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo Database tables created successfully!
echo ========================================
echo.

echo.
echo ========================================
echo STEP 2: Seeding All System Data
echo ========================================
echo.

echo PART 1: Seeding Lab Tests
echo ========================================
echo.

echo Step 1/4: Consolidating CBC tests...
node scripts/consolidate-cbc.js
if %errorLevel% neq 0 (
    echo ERROR: CBC consolidation failed!
    pause
    exit /b 1
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

echo Lab Tests Seeding Completed!
echo.

echo.
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

echo Radiology Tests Seeding Completed!
echo.

echo.
echo PART 3: Dental Services and Teeth (OPTIONAL)
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
    
    echo Dental Services and Teeth Seeding Completed!
    echo.
) else (
    echo.
    echo Skipping dental services (clinic does not have dental department).
    echo.
)

echo.
echo ========================================
echo STEP 3: Creating Admin User
echo ========================================
echo.

cd ..
call create-admin-user.bat
if %errorLevel% neq 0 (
    echo ERROR: Admin user creation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo ========================================
echo COMPLETE SETUP FINISHED SUCCESSFULLY!
echo ========================================
echo ========================================
echo.
echo Summary:
echo   - Database tables: Created
echo   - Lab Tests: Seeded
echo   - Radiology Tests: Seeded
if /i "!HAS_DENTAL!"=="Y" (
    echo   - Dental Services: Seeded
    echo   - Teeth Data: Seeded
) else (
    echo   - Dental Services: Skipped
    echo   - Teeth Data: Skipped
)
echo   - Admin User: Created
echo.
echo Login credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo IMPORTANT: 
echo   1. Change the admin password after first login
echo   2. Start the backend: cd backend ^&^& npm start
echo   3. Start the frontend: cd frontend ^&^& npm run dev
echo   4. Access at: http://localhost:3001
echo.
pause

