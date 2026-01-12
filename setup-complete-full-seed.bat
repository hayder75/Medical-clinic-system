@echo off
setlocal enabledelayedexpansion
REM Complete Setup from Scratch - FULL VERSION (All Seeds - No Optional Prompts)
echo ========================================
echo Medical Clinic System - Complete Setup (FULL SEED)
echo ========================================
echo.
echo This will:
echo   1. Read database config from .env file
echo   2. Create database (if not exists)
echo   3. Setup database tables
echo   4. Seed ALL system data (Lab, Radiology, Card Services, Service Categories, Dental, Teeth)
echo   5. Create admin user
echo.
echo NO OPTIONAL PROMPTS - Everything will be seeded automatically!
echo.
pause

cd /d "%~dp0"

REM ========================================
REM STEP 1: Read Database Config from .env
REM ========================================
echo.
echo ========================================
echo STEP 1: Reading Database Configuration from .env
echo ========================================
echo.

cd backend

REM Default values
set DB_NAME=medical_clinic_system_updated
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_HOST=localhost
set DB_PORT=5432

if exist .env (
    echo Reading database configuration from .env file...
    echo.
    
    REM Read DATABASE_URL line from .env
    for /f "tokens=*" %%a in ('type .env ^| findstr /i "DATABASE_URL"') do (
        set DATABASE_URL_LINE=%%a
    )
    
    REM Remove quotes and DATABASE_URL= prefix
    set TEMP=!DATABASE_URL_LINE!
    set TEMP=!TEMP:"=!
    set TEMP=!TEMP:DATABASE_URL==!
    set TEMP=!TEMP: =!
    
    REM Format: postgresql://user:password@host:port/database
    REM Remove postgresql://
    set TEMP=!TEMP:postgresql://=!
    
    REM Split at @ to get auth and rest
    for /f "tokens=1,2 delims=@" %%b in ("!TEMP!") do (
        set AUTH_PART=%%b
        set REST_PART=%%c
    )
    
    REM Extract user and password from AUTH_PART
    for /f "tokens=1,2 delims=:" %%c in ("!AUTH_PART!") do (
        set DB_USER=%%c
        set TEMP_PASS=%%d
        REM Decode URL-encoded password (%40 = @)
        set TEMP_PASS=!TEMP_PASS:%%40=@!
        set TEMP_PASS=!TEMP_PASS:%%23=#!
        set TEMP_PASS=!TEMP_PASS:%%24=$!
        set TEMP_PASS=!TEMP_PASS:%%20= !
        set DB_PASSWORD=!TEMP_PASS!
    )
    
    REM Extract host, port, and database from REST_PART
    REM Format: host:port/database
    for /f "tokens=1,2 delims=/" %%d in ("!REST_PART!") do (
        set HOST_PORT=%%d
        set DB_NAME=%%e
    )
    
    REM Extract host and port
    for /f "tokens=1,2 delims=:" %%e in ("!HOST_PORT!") do (
        set DB_HOST=%%e
        set DB_PORT=%%f
    )
    
    REM Remove any query strings from database name
    for /f "tokens=1 delims=?" %%f in ("!DB_NAME!") do set DB_NAME=%%f
    
    REM Clean up any empty values
    if "!DB_NAME!"=="" set DB_NAME=medical_clinic_system_updated
    if "!DB_USER!"=="" set DB_USER=postgres
    if "!DB_PASSWORD!"=="" set DB_PASSWORD=postgres
    if "!DB_HOST!"=="" set DB_HOST=localhost
    if "!DB_PORT!"=="" set DB_PORT=5432
    
    echo Found in .env file:
    echo   Database Name: !DB_NAME!
    echo   Database User: !DB_USER!
    echo   Database Host: !DB_HOST!
    echo   Database Port: !DB_PORT!
    echo.
    
    set DB_NAME=!DB_NAME!
    set DB_USER=!DB_USER!
    set DB_PASSWORD=!DB_PASSWORD!
    set DB_HOST=!DB_HOST!
    set DB_PORT=!DB_PORT!
) else (
    echo WARNING: .env file not found!
    echo Using default values:
    echo   Database Name: %DB_NAME%
    echo   Database User: %DB_USER%
    echo.
    echo You should create .env file first using create-env-file.bat
    echo Continuing with defaults...
    echo.
)

REM URL encode password for DATABASE_URL
set ENCODED_PASSWORD=%DB_PASSWORD%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:@=%%40%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:#=%%23%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:$=%%24%
set ENCODED_PASSWORD=%ENCODED_PASSWORD: =%%20%

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
REM STEP 4: Seed ALL System Data (NO OPTIONAL - EVERYTHING)
REM ========================================
echo.
echo ========================================
echo STEP 4: Seeding ALL System Data (Complete)
echo ========================================
echo.
echo Seeding: Lab Tests, Radiology Tests, Card Services, Service Categories, Dental Services, Teeth, Medication Catalog...
echo NOTE: This matches the EXACT seeding process used on the server
echo.

cd backend

REM ========================================
REM PART 1/7: Lab Tests (EXACT MATCH TO SERVER)
REM ========================================
echo.
echo PART 1/7: Seeding Lab Tests...
echo.

echo Step 1/4: Consolidating CBC tests...
node scripts/consolidate-cbc.js
if %errorLevel% neq 0 (
    echo NOTE: CBC consolidation skipped (table may not exist or already done) - continuing...
)
echo.

echo Step 2/4: Updating lab templates (HIV, HBsAg, HCG, Urinalysis, Stool, CBC)...
node scripts/update-lab-templates-simple.js
if %errorLevel% neq 0 (
    echo ERROR: Lab template update failed!
    cd ..
    pause
    exit /b 1
)
echo.

echo Step 3/4: Creating new lab tests (H. pylori Antigen, H. pylori Antibody, ESR)...
node scripts/create-new-lab-tests.js
if %errorLevel% neq 0 (
    echo ERROR: New lab test creation failed!
    cd ..
    pause
    exit /b 1
)
echo.

echo Step 4/4: Adding "Strongly Reactive" option to relevant tests...
node scripts/add-strongly-reactive-option.js
if %errorLevel% neq 0 (
    echo ERROR: Adding strongly reactive option failed!
    cd ..
    pause
    exit /b 1
)
echo Lab Tests: Done!
echo.

REM ========================================
REM PART 2/7: Radiology Tests (EXACT MATCH TO SERVER)
REM ========================================
echo.
echo PART 2/7: Seeding Radiology Tests...
echo.

echo Step 1/4: Cleaning up old radiology tests (keeping only 9 ultrasound tests)...
node scripts/cleanup-radiology-tests.js
if %errorLevel% neq 0 (
    echo ERROR: Radiology cleanup failed!
    cd ..
    pause
    exit /b 1
)
echo.

echo Step 2/4: Creating missing ultrasound tests...
node scripts/create-missing-ultrasound-tests.js
if %errorLevel% neq 0 (
    echo ERROR: Creating missing ultrasound tests failed!
    cd ..
    pause
    exit /b 1
)
echo.

echo Step 3/4: Populating radiology templates (Findings and Conclusion)...
node scripts/populate-radiology-templates.js
if %errorLevel% neq 0 (
    echo ERROR: Populating radiology templates failed!
    cd ..
    pause
    exit /b 1
)
echo.

echo Step 4/4: Fixing radiology services (ensuring InvestigationType records exist)...
node scripts/fix-radiology-services.js
if %errorLevel% neq 0 (
    echo ERROR: Fixing radiology services failed!
    cd ..
    pause
    exit /b 1
)
echo Radiology Tests: Done!
echo.

REM ========================================
REM PART 3/7: Card Services & Service Categories
REM ========================================
echo.
echo PART 3/7: Seeding Card Services and Service Categories...
echo.

echo Step 1/2: Creating card services (Card Registration and Activation)...
node scripts/create-card-services.js
if %errorLevel% neq 0 (
    echo ERROR: Creating card services failed!
    cd ..
    pause
    exit /b 1
)
echo.

echo Step 2/2: Seeding service categories (Nurse Walk-in, Emergency Drugs, Material Needs)...
node scripts/seed-new-service-categories.js
if %errorLevel% neq 0 (
    echo ERROR: Seeding service categories failed!
    cd ..
    pause
    exit /b 1
)
echo Card Services and Categories: Done!
echo.

REM ========================================
REM PART 4/7: Dental Services
REM ========================================
echo.
echo PART 4/7: Seeding Dental Services...
echo.

echo Creating dental services...
node scripts/create-dental-services.js
if %errorLevel% neq 0 (
    echo ERROR: Creating dental services failed!
    cd ..
    pause
    exit /b 1
)
echo Dental Services: Done!
echo.

REM ========================================
REM PART 5/7: Teeth Data
REM ========================================
echo.
echo PART 5/7: Seeding Teeth Data...
echo.

echo Seeding teeth data (32 teeth for dental chart)...
node scripts/seed-scripts/seed-teeth.js
if %errorLevel% neq 0 (
    echo ERROR: Seeding teeth data failed!
    cd ..
    pause
    exit /b 1
)
echo Teeth Data: Done!
echo.

REM ========================================
REM PART 6/7: Medication Catalog
REM ========================================
echo.
echo PART 6/7: Seeding Medication Catalog...
echo.

echo Seeding medication catalog (35 common medications for pharmacy inventory)...
node scripts/seed-medication-catalog.js
if %errorLevel% neq 0 (
    echo ERROR: Seeding medication catalog failed!
    cd ..
    pause
    exit /b 1
)
echo Medication Catalog: Done!
echo.

REM ========================================
REM Summary
REM ========================================
echo.
echo ========================================
echo System Data Seeding Completed!
echo ========================================
echo.
echo Seeded:
echo   - Lab Tests (4 scripts: CBC, Templates, New Tests, Strongly Reactive) - EXACT MATCH TO SERVER
echo   - Radiology Tests (4 scripts: Cleanup, Ultrasound, Templates, Fix Services) - EXACT MATCH TO SERVER
echo   - Card Services
echo   - Service Categories
echo   - Dental Services
echo   - Teeth Data
echo   - Medication Catalog (35 common medications for pharmacy inventory)
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
echo Database: %DB_NAME%
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
