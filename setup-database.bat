@echo off
REM Setup Database Schema
echo ========================================
echo Medical Clinic System - Database Setup
echo ========================================
echo.

cd /d "%~dp0\backend"

REM Check if .env exists
if not exist .env (
    echo.
    echo ========================================
    echo ERROR: .env file not found!
    echo ========================================
    echo.
    echo Please create a .env file in the backend folder with this content:
    echo.
    echo DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/medical_clinic_system_updated
    echo JWT_SECRET=your_jwt_secret_here
    echo.
    echo Replace YOUR_PASSWORD with your PostgreSQL password.
    echo If password is "postgres", use: DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medical_clinic_system_updated
    echo.
    echo If your password has special characters like @, #, $, etc., you need to URL-encode them:
    echo   @ becomes %%40
    echo   # becomes %%23
    echo   $ becomes %%24
    echo   Space becomes %%20
    echo.
    echo Example: If password is "My@Pass123", use "My%%40Pass123"
    echo.
    echo File location: %CD%\.env
    echo.
    pause
    exit /b 1
)

echo .env file found.
echo.
echo Verifying .env file content...
type .env
echo.
echo If the DATABASE_URL looks correct, press any key to continue...
pause >nul

echo.
echo ========================================
echo Setting up database schema...
echo ========================================
echo.

echo IMPORTANT: Make sure the backend server is NOT running!
echo If you see "EPERM" errors, stop the server and try again.
echo.
pause

echo Installing/Updating dependencies (this ensures correct Prisma version 5.20.0)...
call npm install
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Stopping any running Node.js processes that might lock Prisma files...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Generating Prisma Client (using Prisma 5.20.0 from node_modules)...
call npm exec prisma generate
if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to generate Prisma client
    echo.
    echo Please check:
    echo   1. Your .env file exists: %CD%\.env
    echo   2. DATABASE_URL is correct in .env file
    echo.
    echo Current .env content:
    type .env
    echo.
    pause
    exit /b 1
)

echo.
echo Creating database tables...
echo.
echo NOTE: If database doesn't exist, run create-database.bat first
echo.
echo Reading database configuration from .env file...
for /f "tokens=*" %%a in ('type .env ^| findstr /i "DATABASE_URL"') do (
    set DATABASE_URL=%%a
)
echo Database URL found in .env file.
echo.
pause

echo.
echo Pushing schema to database...
echo NOTE: If this fails with authentication error, check:
echo   - Your .env file has correct DATABASE_URL
echo   - Database name in .env matches your actual database name
echo   - PostgreSQL password is correct
echo   - Special characters in password are URL-encoded (@ = %%40, # = %%23, etc.)
echo.

call npm exec prisma db push
if %errorLevel% neq 0 (
    echo.
    echo ========================================
    echo ERROR: Failed to create database tables
    echo ========================================
    echo.
    echo Common issues and solutions:
    echo.
    echo 1. AUTHENTICATION ERROR (P1000):
    echo    - Check your .env file DATABASE_URL
    echo    - Format should be: postgresql://postgres:PASSWORD@localhost:5432/medical_clinic_system_updated
    echo    - If password has special characters, URL-encode them:
    echo        @ becomes %%40
    echo        # becomes %%23  
    echo        $ becomes %%24
    echo        Space becomes %%20
    echo    - Example: If password is "Jesus@123", use "Jesus%%40123"
    echo.
    echo 2. DATABASE NOT FOUND:
    echo    - Run create-database.bat first to create the database
    echo    - Or create manually: CREATE DATABASE medical_clinic_system_updated;
    echo.
    echo 3. POSTGRESQL NOT RUNNING:
    echo    - Start PostgreSQL service from Services (services.msc)
    echo.
    echo Current .env file content:
    type .env
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Database setup completed successfully!
echo ========================================
echo.
echo Next step: Run seed-system.bat to load all system data
echo.
cd ..
pause
