@echo off
setlocal enabledelayedexpansion
REM Check PostgreSQL Database - Reads from .env
echo ========================================
echo Check PostgreSQL Database
echo ========================================
echo.
echo This will check if the database from .env file exists.
echo.

cd /d "%~dp0\backend"

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
    
    REM Use the parsed values
    set DB_NAME=!DB_NAME!
    set DB_USER=!DB_USER!
    set DB_PASSWORD=!DB_PASSWORD!
    set DB_HOST=!DB_HOST!
    set DB_PORT=!DB_PORT!
) else (
    echo .env file not found. Using default values:
    echo   Database: %DB_NAME%
    echo   User: %DB_USER%
    echo.
)

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
echo Checking if database '%DB_NAME%' exists...
echo.
echo NOTE: If it asks for password, try:
echo   1. Press Enter (no password)
echo   2. Or use: %DB_PASSWORD%
echo   3. Or check your PostgreSQL installation
echo.

REM Set password for psql
set PGPASSWORD=%DB_PASSWORD%

REM Check if database exists
"%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -lqt | findstr /i /c:"%DB_NAME%" >nul

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Database '%DB_NAME%' EXISTS!
    echo ========================================
    echo.
    echo Database details:
    echo.
    "%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -lqt | findstr /i /c:"%DB_NAME%"
    echo.
) else (
    echo.
    echo ========================================
    echo Database '%DB_NAME%' NOT FOUND!
    echo ========================================
    echo.
    echo To create the database, run: create-database.bat
    echo.
)

echo.
echo All databases in PostgreSQL:
echo.
"%PSQL_PATH%" -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -l

if %errorLevel% neq 0 (
    echo.
    echo ERROR: Failed to connect to PostgreSQL!
    echo.
    echo Possible issues:
    echo   1. PostgreSQL service not running
    echo   2. Wrong username/password
    echo   3. Wrong host/port: %DB_HOST%:%DB_PORT%
    echo   4. Firewall blocking connection
    echo.
    echo Try:
    echo   1. Make sure PostgreSQL service is running
    echo   2. Check your .env file credentials
    echo   3. Verify PostgreSQL is accessible
    echo.
)

cd ..
pause
