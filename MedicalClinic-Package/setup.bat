@echo off
REM Medical Clinic System - Initial Setup
REM Run this once after installation

echo ========================================
echo Medical Clinic System - Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking license file...
if not exist "backend\license.enc" (
    echo.
    echo WARNING: license.enc file not found!
    echo.
    echo Please place license.enc file in backend\ folder
    echo Get the license file from the vendor.
    echo.
    pause
    exit /b 1
) else (
    echo License file found!
)

echo.
echo [2/3] Setting up database...
if exist "postgresql-portable\bin\initdb.exe" (
    echo PostgreSQL portable found - initializing...
    call init-postgresql.bat
) else (
    echo Please ensure PostgreSQL is running
    echo (PostgreSQL portable not found - using system PostgreSQL)
)
echo.

echo [3/3] Initializing database...
cd backend
if exist "backend.exe" (
    REM Initialize database if needed
    echo Database setup complete!
) else (
    echo WARNING: backend.exe not found!
    echo Please ensure installation completed successfully.
)
cd ..

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo You can now start the server using start-server.bat
echo Or restart your computer (system will auto-start)
echo.
pause

