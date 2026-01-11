@echo off
REM Medical Clinic System - Seed All Lab Tests
REM This script seeds all lab test templates and configurations

echo ========================================
echo Medical Clinic System - Seeding Lab Tests
echo ========================================
echo.

cd /d "%~dp0\.."

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
echo Lab Tests Seeding Completed Successfully!
echo ========================================
echo.
pause

