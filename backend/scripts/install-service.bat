@echo off
REM Medical Clinic System - Windows Service Installer
REM This installs the backend as a Windows Service for auto-start

echo ========================================
echo Medical Clinic System - Service Installer
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

cd /d "%~dp0"

echo Installing Windows Service...
echo.

REM Install node-windows if not installed
if not exist "node_modules\node-windows" (
    echo Installing node-windows...
    call npm install node-windows --save
)

REM Run service installer
node install-windows-service.js

if %errorLevel% equ 0 (
    echo.
    echo ========================================
    echo Service installed successfully!
    echo ========================================
    echo.
    echo The system will now start automatically on boot.
    echo.
    echo To manage the service:
    echo - Start: net start "Medical Clinic System"
    echo - Stop: net stop "Medical Clinic System"
    echo - Uninstall: node uninstall-windows-service.js
    echo.
) else (
    echo.
    echo ========================================
    echo Service installation failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
)

pause

