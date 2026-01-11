@echo off
REM Compress Project for Shipping
echo ========================================
echo Compressing Project for Shipping
echo ========================================
echo.

cd /d "%~dp0"

REM First, run cleanup
echo Running cleanup first...
call prepare-for-shipping.bat
if %errorLevel% neq 0 (
    echo WARNING: Cleanup had issues, but continuing...
)

echo.
echo ========================================
echo Compressing Project...
echo ========================================
echo.

REM Try to find compression tool
set ZIP_TOOL=
set ZIP_NAME=Medical-Clinic-System.zip

REM Check for 7-Zip (most common on Windows)
if exist "C:\Program Files\7-Zip\7z.exe" (
    set ZIP_TOOL=C:\Program Files\7-Zip\7z.exe
    set ZIP_NAME=Medical-Clinic-System.7z
    echo Using 7-Zip...
) else if exist "C:\Program Files (x86)\7-Zip\7z.exe" (
    set ZIP_TOOL=C:\Program Files (x86)\7-Zip\7z.exe
    set ZIP_NAME=Medical-Clinic-System.7z
    echo Using 7-Zip...
) else (
    REM Try PowerShell compression (built-in Windows)
    where powershell >nul 2>&1
    if %errorLevel% equ 0 (
        set ZIP_TOOL=powershell
        echo Using PowerShell compression...
    )
)

if "%ZIP_TOOL%"=="" (
    echo.
    echo ERROR: No compression tool found!
    echo.
    echo Please install one of these:
    echo   1. 7-Zip (recommended): https://www.7-zip.org/
    echo   2. Or use Windows built-in compression:
    echo      - Right-click the folder
    echo      - Select "Send to" ^> "Compressed (zipped) folder"
    echo.
    pause
    exit /b 1
)

REM Get parent directory
for %%i in ("%CD%") do set PARENT_DIR=%%~dpi
set FOLDER_NAME=%~nx0
set FOLDER_NAME=Medical-clinic-system-deployment (5)

echo Compressing to: %PARENT_DIR%%ZIP_NAME%
echo.

if "%ZIP_TOOL%"=="powershell" (
    REM Use PowerShell to compress
    powershell -Command "Compress-Archive -Path '.\*' -DestinationPath '%PARENT_DIR%%ZIP_NAME%' -Force"
) else (
    REM Use 7-Zip
    "%ZIP_TOOL%" a -tzip "%PARENT_DIR%%ZIP_NAME%" * -xr!.git -xr!node_modules -xr!backend\dist -xr!*.log -xr!*.cache
)

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Compression Complete!
    echo ========================================
    echo.
    echo File created: %PARENT_DIR%%ZIP_NAME%
    echo.
    echo You can now send this file to your client.
    echo.
) else (
    echo.
    echo ERROR: Compression failed!
    echo.
    echo Please compress manually:
    echo   1. Right-click the project folder
    echo   2. Select "Send to" ^> "Compressed (zipped) folder"
    echo.
)

pause

