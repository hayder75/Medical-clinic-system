@echo off
REM PostgreSQL Portable - Initialization Script
REM This script sets up PostgreSQL with default client credentials

echo ========================================
echo PostgreSQL Portable - Setup
echo ========================================
echo.

set "PG_DIR=%~dp0postgresql-portable"
set "PG_DATA=%PG_DIR%\data"
set "PG_BIN=%PG_DIR%\bin"

REM Check if PostgreSQL portable exists
if not exist "%PG_DIR%" (
    echo ERROR: PostgreSQL portable not found!
    echo Please ensure postgresql-portable folder exists.
    pause
    exit /b 1
)

echo [1/4] Initializing PostgreSQL data directory...
if not exist "%PG_DATA%" (
    "%PG_BIN%\initdb.exe" -D "%PG_DATA%" -U postgres --encoding=UTF8 --locale=C
    if %errorLevel% neq 0 (
        echo ERROR: Failed to initialize database
        pause
        exit /b 1
    )
    echo Database initialized!
) else (
    echo Database already initialized!
)

echo.
echo [2/4] Starting PostgreSQL server...
start "PostgreSQL Server" "%PG_BIN%\pg_ctl.exe" -D "%PG_DATA%" -l "%PG_DIR%\postgresql.log" start
timeout /t 5 /nobreak >nul

echo.
echo [3/4] Creating default database and user...
"%PG_BIN%\psql.exe" -U postgres -d postgres -c "CREATE USER clinic_user WITH PASSWORD 'clinic_password';" 2>nul
"%PG_BIN%\psql.exe" -U postgres -d postgres -c "CREATE DATABASE medical_clinic OWNER clinic_user;" 2>nul
"%PG_BIN%\psql.exe" -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE medical_clinic TO clinic_user;" 2>nul

if %errorLevel% equ 0 (
    echo Default user and database created!
) else (
    echo WARNING: User/database may already exist (this is OK)
)

echo.
echo [4/4] Setting up .env file...
set "ENV_FILE=%~dp0backend\.env"
if not exist "%ENV_FILE%" (
    copy "%~dp0backend\.env.client" "%ENV_FILE%" >nul 2>&1
    echo .env file created with default credentials!
) else (
    echo .env file already exists (keeping existing configuration)
)

echo.
echo ========================================
echo PostgreSQL Setup Complete!
echo ========================================
echo.
echo Default Credentials:
echo   User: clinic_user
echo   Password: clinic_password
echo   Database: medical_clinic
echo.
echo PostgreSQL is now running!
echo You can now start the Medical Clinic System.
echo.
pause

