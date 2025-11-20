@echo off
REM Medical Clinic System - Automated Installer
REM This script installs everything automatically

echo ========================================
echo Medical Clinic System - Installation
echo ========================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

set "INSTALL_DIR=C:\MedicalClinic"
set "CURRENT_DIR=%~dp0"

echo [1/5] Creating installation directory...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo [2/5] Copying files...
xcopy /E /I /Y "%CURRENT_DIR%*" "%INSTALL_DIR%"

echo [3/5] Setting up PostgreSQL Portable...
REM Note: PostgreSQL portable should be initialized here
REM This is handled by the main installer

echo [4/5] Setting up auto-start...
copy "%INSTALL_DIR%\start-server-startup.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\" >nul 2>&1

echo [5/5] Creating desktop shortcut...
powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%USERPROFILE%\Desktop\Medical Clinic System.lnk'); $Shortcut.TargetPath = '%INSTALL_DIR%\start-server.bat'; $Shortcut.Save()"

echo.
echo ========================================
echo Installation Complete!
echo ========================================
echo.
echo System installed to: %INSTALL_DIR%
echo.
echo IMPORTANT: You need to:
echo 1. Place license.enc file in: %INSTALL_DIR%\backend\
echo 2. Configure .env file in: %INSTALL_DIR%\backend\ (if needed)
echo 3. Restart your computer or run start-server.bat
echo.
echo To find your server IP address, run: find-server-ip.bat
echo.
pause

