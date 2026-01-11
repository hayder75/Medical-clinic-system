@echo off
setlocal enabledelayedexpansion
REM Complete Setup from Scratch - Fully Automated (No Prompts)
echo ========================================
echo Medical Clinic System - Complete Setup from Scratch
echo ========================================
echo.
echo Database Name: medical_clinic_system_updated
echo Password: Jesus@123
echo.
echo This will run automatically - no prompts needed.
echo.
echo Steps:
echo   1. Create/Update .env file
echo   2. Create database (if not exists)
echo   3. Setup database tables
echo   4. Seed all system data (Dental skipped)
echo   5. Create admin user
echo.
pause

cd /d "%~dp0"

REM ========================================
REM STEP 1: Create/Update .env file
REM ========================================
echo.
echo ========================================
echo STEP 1: Creating .env File
echo ========================================
echo.

cd backend

REM Set defaults - password is Jesus@123
set DB_USER=postgres
set DB_PASSWORD=Jesus@123
set DB_NAME=medical_clinic_system_updated
set DB_HOST=localhost
set DB_PORT=5432

REM URL encode password (@ becomes %40)
set ENCODED_PASSWORD=%DB_PASSWORD%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:@=%%40%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:#=%%23%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:$=%%24%
set ENCODED_PASSWORD=%ENCODED_PASSWORD: =%%20%

REM Delete old .env and create new one (NO QUOTES, clean format)
if exist .env del .env

REM Write .env file using a temporary file to avoid special character issues
set TEMP_ENV=%TEMP%\medical_env_%RANDOM%.tmp
echo DATABASE_URL=postgresql://%DB_USER%:%ENCODED_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%> "%TEMP_ENV%"
echo JWT_SECRET=fallback-secret-key-change-in-production>> "%TEMP_ENV%"
copy /y "%TEMP_ENV%" .env >nul
del "%TEMP_ENV%" >nul 2>&1

REM Verify file was created
if not exist .env (
    echo ERROR: Failed to create .env file!
    cd ..
    pause
    exit /b 1
)

echo .env file created successfully.
echo Database: %DB_NAME%
echo User: %DB_USER%
echo.

cd ..

REM ========================================
REM STEP 2: Create Database (if not exists)
REM ========================================
echo.
echo ========================================
echo STEP 2: Checking/Creating Database
echo ========================================
echo.

REM Set PGPASSWORD for psql (use actual password, not encoded)
set PGPASSWORD=%DB_PASSWORD%

REM Try to find psql
set PSQL_PATH=
where psql >nul 2>&1
if %errorLevel% equ 0 (
    set PSQL_PATH=psql
) else (
    if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
        set PSQL_PATH=C:\Program Files\PostgreSQL\16\bin\psql.exe
    ) else if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
        set PSQL_PATH=C:\Program Files\PostgreSQL\15\bin\psql.exe
    ) else if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
        set PSQL_PATH=C:\Program Files\PostgreSQL\14\bin\psql.exe
    ) else if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
        set PSQL_PATH=C:\Program Files\PostgreSQL\13\bin\psql.exe
    )
)

if "%PSQL_PATH%"=="" (
    echo WARNING: PostgreSQL psql not found in PATH.
    echo Will try to connect anyway during table creation.
    echo If it fails, please install PostgreSQL or add it to PATH.
    echo.
) else (
    echo Checking if database '%DB_NAME%' exists...
    "%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -lqt 2>nul | findstr /i /c:"%DB_NAME%" >nul
    
    if %errorLevel% equ 0 (
        echo Database '%DB_NAME%' already exists - skipping creation.
        echo.
    ) else (
        echo Creating database '%DB_NAME%'...
        "%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;" 2>nul
        if %errorLevel% equ 0 (
            echo Database created successfully!
            echo.
        ) else (
            echo NOTE: Could not create database automatically.
            echo Database might already exist or PostgreSQL service not running.
            echo Continuing with table setup...
            echo.
        )
    )
)

REM ========================================
REM STEP 3: Setup Database Tables
REM ========================================
echo.
echo ========================================
echo STEP 3: Setting up Database Tables
echo ========================================
echo.

cd backend

echo IMPORTANT: Make sure PostgreSQL service is running!
echo If you see connection errors, start PostgreSQL service first.
echo.
timeout /t 2 /nobreak >nul

echo Installing dependencies (this may take a moment)...
call npm install >nul 2>&1
if %errorLevel% neq 0 (
    echo WARNING: npm install had issues, but continuing...
)
echo Dependencies installed.
echo.

echo Stopping any running Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Verifying .env file...
if not exist .env (
    echo ERROR: .env file not found in backend folder!
    cd ..
    pause
    exit /b 1
)

echo .env file found.
echo Verifying .env file content...
type .env
echo.

REM Build DATABASE_URL string carefully
set DATABASE_URL=postgresql://%DB_USER%:%ENCODED_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
set JWT_SECRET=fallback-secret-key-change-in-production

REM Set environment variables explicitly for Prisma (in case .env parsing fails)
setx DATABASE_URL "postgresql://%DB_USER%:%ENCODED_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%" >nul 2>&1

echo Generating Prisma Client...
echo Using DATABASE_URL: postgresql://%DB_USER%:***@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.

call npm exec prisma generate
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to generate Prisma client
    echo.
    echo Troubleshooting:
    echo   1. Check .env file exists: %CD%\.env
    echo   2. Check DATABASE_URL format in .env (should be one line, no quotes)
    echo   3. Make sure no extra spaces around = sign
    echo.
    echo Current .env content:
    type .env
    echo.
    echo Trying to read DATABASE_URL directly...
    for /f "tokens=2 delims==" %%a in ('findstr "^DATABASE_URL" .env') do (
        echo Found DATABASE_URL value: %%a
    )
    echo.
    cd ..
    pause
    exit /b 1
)
echo Prisma Client generated successfully!
echo.

echo Creating/updating database tables...
echo This may take a minute...
call npm exec prisma db push --accept-data-loss
if %errorLevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to create database tables!
    echo ========================================
    echo.
    echo Common issues:
    echo   1. PostgreSQL service not running
    echo      - Start it from: Services (services.msc)
    echo      - Or: net start postgresql-x64-16 (adjust version)
    echo.
    echo   2. Wrong password or connection
    echo      - Check .env file: DATABASE_URL
    echo      - Password should be: Jesus@123 (encoded as Jesus%%40123)
    echo.
    echo   3. Database doesn't exist
    echo      - Check if database was created in step 2
    echo.
    echo Current .env DATABASE_URL:
    for /f "tokens=2 delims==" %%a in ('findstr "^DATABASE_URL" .env') do echo   %%a
    echo.
    cd ..
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database tables created successfully!
echo ========================================
echo.

cd ..

REM ========================================
REM STEP 4: Seed System Data (No Prompts)
REM ========================================
echo.
echo ========================================
echo STEP 4: Seeding System Data
echo ========================================
echo.
echo Seeding: Lab Tests, Radiology Tests, Card Services, Nurse Services...
echo Dental Services: Skipped (not included)
echo.

cd backend

echo PART 1/3: Seeding Lab Tests...
node scripts/consolidate-cbc.js
if %errorLevel% neq 0 (
    echo NOTE: CBC consolidation skipped (table may not exist or already done) - continuing...
)
echo.

node scripts/update-lab-templates-simple.js
if %errorLevel% neq 0 (
    echo ERROR: Lab template update failed!
    cd ..
    pause
    exit /b 1
)
echo.

node scripts/create-new-lab-tests.js
if %errorLevel% neq 0 (
    echo ERROR: New lab test creation failed!
    cd ..
    pause
    exit /b 1
)
echo.

node scripts/add-strongly-reactive-option.js
if %errorLevel% neq 0 (
    echo ERROR: Adding strongly reactive option failed!
    cd ..
    pause
    exit /b 1
)
echo Lab Tests: Done!
echo.

echo PART 2/3: Seeding Radiology Tests...
node scripts/cleanup-radiology-tests.js
if %errorLevel% neq 0 (
    echo ERROR: Radiology cleanup failed!
    cd ..
    pause
    exit /b 1
)
echo.

node scripts/create-missing-ultrasound-tests.js
if %errorLevel% neq 0 (
    echo ERROR: Creating missing ultrasound tests failed!
    cd ..
    pause
    exit /b 1
)
echo.

node scripts/populate-radiology-templates.js
if %errorLevel% neq 0 (
    echo ERROR: Populating radiology templates failed!
    cd ..
    pause
    exit /b 1
)
echo.

node scripts/fix-radiology-services.js
if %errorLevel% neq 0 (
    echo ERROR: Fixing radiology services failed!
    cd ..
    pause
    exit /b 1
)
echo Radiology Tests: Done!
echo.

echo PART 3/3: Seeding Other Services...
node scripts/create-card-services.js
if %errorLevel% neq 0 (
    echo ERROR: Creating card services failed!
    cd ..
    pause
    exit /b 1
)
echo.

node scripts/seed-new-service-categories.js
if %errorLevel% neq 0 (
    echo ERROR: Seeding service categories failed!
    cd ..
    pause
    exit /b 1
)
echo Other Services: Done!
echo.

echo ========================================
echo System Data Seeding Completed!
echo ========================================
echo.

cd ..

REM ========================================
REM STEP 5: Create Admin User
REM ========================================
echo.
echo ========================================
echo STEP 5: Creating Admin User
echo ========================================
echo.

cd backend

echo Creating admin user...
node scripts/seed-scripts/create-admin-user.js
if %errorLevel% neq 0 (
    echo ERROR: Admin user creation failed!
    cd ..
    pause
    exit /b 1
)

cd ..

REM ========================================
REM COMPLETION
REM ========================================
echo.
echo ========================================
echo ========================================
echo SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo ========================================
echo.
echo Database: medical_clinic_system_updated
echo.
echo Login credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo IMPORTANT: 
echo   1. Change admin password after first login
echo   2. Start backend: cd backend ^&^& npm start
echo   3. Start frontend: cd frontend ^&^& npm run dev
echo   4. Access at: http://localhost:3001
echo.
pause
