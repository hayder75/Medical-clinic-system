@echo off
REM Verify Database Tables Exist
echo ========================================
echo Verify Database Tables
echo ========================================
echo.
echo This will check if all required database tables exist.
echo If tables are missing, it will create them.
echo.

cd /d "%~dp0\backend"

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    pause
    exit /b 1
)

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
echo Pushing schema to database (creating/updating all tables)...
call npm exec prisma db push --accept-data-loss
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to create database tables!
    echo Please check your database connection and .env file.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database tables verified successfully!
echo ========================================
echo.
echo All required tables now exist in the database.
echo You can now run seed-system-data.bat
echo.
cd ..
pause


