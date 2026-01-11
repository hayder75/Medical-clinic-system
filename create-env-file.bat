@echo off
echo ========================================
echo Create .env File
echo ========================================
echo.
echo This will create a .env file in the backend folder.
echo.

cd /d "%~dp0\backend"

if exist .env (
    echo WARNING: .env file already exists!
    echo.
    echo Current .env file content:
    type .env
    echo.
    set /p OVERWRITE="Do you want to overwrite it? (Y/N): "
    if /i not "%OVERWRITE%"=="Y" (
        echo.
        echo Cancelled. .env file not modified.
        cd ..
        pause
        exit /b 0
    )
)

echo.
echo Please enter your database configuration:
echo.

set /p DB_USER="Database User (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="Database Password (default: postgres): "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres

set /p DB_NAME="Database Name (default: medical_clinic_system_updated): "
if "%DB_NAME%"=="" set DB_NAME=medical_clinic_system_updated

set /p DB_HOST="Database Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Database Port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

echo.
echo Creating .env file with:
echo   Database User: %DB_USER%
echo   Database Name: %DB_NAME%
echo   Database Host: %DB_HOST%
echo   Database Port: %DB_PORT%
echo.

REM URL encode special characters in password if needed
set ENCODED_PASSWORD=%DB_PASSWORD%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:@=%%40%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:#=%%23%
set ENCODED_PASSWORD=%ENCODED_PASSWORD:$=%%24%
set ENCODED_PASSWORD=%ENCODED_PASSWORD: =%%20%

(
echo DATABASE_URL=postgresql://%DB_USER%:%ENCODED_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo JWT_SECRET=fallback-secret-key-change-in-production
) > .env

echo .env file created successfully!
echo Location: %CD%\.env
echo.
echo Database URL: postgresql://%DB_USER%:***@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.
echo NOTE: If your password has special characters, they have been URL-encoded.
echo.
cd ..
pause
