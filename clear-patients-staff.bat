@echo off
REM Clear Patients, Staff, Audits, and Billing Data
echo ========================================
echo Clear Patients, Staff, Audits, and Billing
echo ========================================
echo.
echo WARNING: This will delete:
echo   - All patients
echo   - All staff (doctors, reception, nurses, admin)
echo   - All audit logs
echo   - All billing data and transactions
echo   - All cash management data
echo.
echo This action CANNOT be undone!
echo.
pause

cd /d "%~dp0\backend"

REM Check if .env exists
if not exist .env (
    echo.
    echo ERROR: .env file not found!
    echo Please make sure you're in the correct directory.
    echo.
    pause
    exit /b 1
)

echo Running cleanup script...
echo.
call node scripts/clear-patients-and-staff.js

if %errorLevel% neq 0 (
    echo.
    echo ERROR: Cleanup failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Cleanup completed!
echo ========================================
echo.
echo NOTE: You will need to create a new admin user.
echo Run: create-admin-user.bat
echo.
cd ..
pause

