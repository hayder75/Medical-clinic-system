@echo off
setlocal enabledelayedexpansion
REM Create Clinic Database
echo ========================================
echo Create Clinic Database
echo ========================================
echo.

cd /d "%~dp0\backend"

REM Check if .env exists to get database name
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
    set /p USE_ENV="Use these values? (Y/N, default: Y): "
    if /i not "!USE_ENV!"=="N" (
        set DB_NAME=!DB_NAME!
        set DB_USER=!DB_USER!
        set DB_PASSWORD=!DB_PASSWORD!
        set DB_HOST=!DB_HOST!
        set DB_PORT=!DB_PORT!
        goto :create_db
    )
) else (
    echo .env file not found. Using default values:
    echo   Database: %DB_NAME%
    echo   User: %DB_USER%
    echo.
    echo You can create .env file first using create-env-file.bat
    echo.
    set /p USE_DEFAULTS="Use default values? (Y/N, default: Y): "
    if /i not "%USE_DEFAULTS%"=="N" (
        goto :create_db
    )
)

:prompt_values
echo.
echo Please enter database configuration:
set /p DB_NAME="Database Name (default: medical_clinic_system_updated): "
if "%DB_NAME%"=="" set DB_NAME=medical_clinic_system_updated
set /p DB_USER="Database User (default: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres
set /p DB_PASSWORD="Database Password (default: postgres): "
if "%DB_PASSWORD%"=="" set DB_PASSWORD=postgres
set /p DB_HOST="Database Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost
set /p DB_PORT="Database Port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

:create_db
echo.
echo ========================================
echo Database Configuration
echo ========================================
echo Database Name: %DB_NAME%
echo Database User: %DB_USER%
echo Database Host: %DB_HOST%
echo Database Port: %DB_PORT%
echo.
echo This will create database '%DB_NAME%' in PostgreSQL.
echo.
pause

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
    echo ERROR: PostgreSQL psql not found!
    echo Please make sure PostgreSQL is installed.
    pause
    exit /b 1
)

echo PostgreSQL found: %PSQL_PATH%
echo.
echo Creating database '%DB_NAME%'...
echo.
echo NOTE: If it asks for password, try:
echo   1. Press Enter (no password)
echo   2. Or use: %DB_PASSWORD%
echo   3. Or check your PostgreSQL installation
echo.

REM Set password for psql
set PGPASSWORD=%DB_PASSWORD%

REM Create database
"%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;"

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Database '%DB_NAME%' created successfully!
    echo ========================================
    echo.
) else (
    echo.
    REM Check if database already exists
    "%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -lqt | findstr /i /c:"%DB_NAME%" >nul
    if %errorLevel% equ 0 (
        echo Database '%DB_NAME%' already exists - that's OK!
        echo.
    ) else (
        echo ERROR: Failed to create database!
        echo.
        echo Possible issues:
        echo   1. Authentication failed - check password: %DB_PASSWORD%
        echo   2. PostgreSQL service not running
        echo   3. Incorrect host/port: %DB_HOST%:%DB_PORT%
        echo   4. User doesn't have permission to create databases
        echo.
        echo Try:
        echo   1. Make sure PostgreSQL service is running
        echo   2. Check your .env file: DATABASE_URL
        echo   3. Try running as Administrator
        echo   4. Test connection: psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -l
        echo.
    )
)

cd ..
pause
