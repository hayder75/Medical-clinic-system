@echo off
REM Medical Clinic System - Complete System Seeding
REM This script seeds ALL components: Lab Tests, Radiology, and optionally Dental

echo ========================================
echo Medical Clinic System - Complete System Seeding
echo ========================================
echo.
echo This will seed:
echo   1. Lab Tests (CBC, HIV, HBsAg, HCG, Urinalysis, Stool, etc.)
echo   2. Radiology Tests (9 Ultrasound tests with templates)
echo   3. Dental Services and Teeth (optional - only if your clinic has dental)
echo.
echo ========================================
echo.

cd /d "%~dp0\.."

REM ========================================
REM PART 1: LAB TESTS
REM ========================================
echo.
echo ========================================
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

echo ========================================
echo Lab Tests Seeding Completed!
echo ========================================
echo.

REM ========================================
REM PART 2: RADIOLOGY
REM ========================================
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

REM ========================================
REM PART 3: DENTAL (OPTIONAL)
REM ========================================
echo.
echo ========================================
echo PART 3: Dental Services and Teeth (OPTIONAL)
echo ========================================
echo.
echo Does your clinic have a dental department?
echo.
set /p HAS_DENTAL="Enter Y for Yes, N for No (default: N): "

if /i "%HAS_DENTAL%"=="Y" (
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

REM ========================================
REM COMPLETION
REM ========================================
echo.
echo ========================================
echo ========================================
echo Complete System Seeding Finished!
echo ========================================
echo ========================================
echo.
echo Summary:
echo   - Lab Tests: Seeded
echo   - Radiology Tests: Seeded
if /i "%HAS_DENTAL%"=="Y" (
    echo   - Dental Services: Seeded
    echo   - Teeth Data: Seeded
) else (
    echo   - Dental Services: Skipped
    echo   - Teeth Data: Skipped
)
echo.
echo Your system is now ready to use!
echo.
pause

