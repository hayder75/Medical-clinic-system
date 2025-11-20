@echo off
REM Medical Clinic System - Node.js Auto-Installer
REM Downloads and installs Node.js automatically

echo ========================================
echo Installing Node.js...
echo ========================================
echo.

REM Check if already installed
where node >nul 2>&1
if %errorLevel% equ 0 (
    echo Node.js is already installed!
    node --version
    pause
    exit /b 0
)

REM Check admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: This installer requires administrator privileges.
    echo Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo Downloading Node.js installer...
echo This may take a few minutes...
echo.

powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi' -OutFile '%TEMP%\nodejs-installer.msi'"

if %errorLevel% neq 0 (
    echo ERROR: Failed to download Node.js installer.
    echo Please check your internet connection.
    echo.
    echo Manual download: https://nodejs.org/
    pause
    exit /b 1
)

echo Installing Node.js...
echo Please wait, this may take a few minutes...
echo.

msiexec /i "%TEMP%\nodejs-installer.msi" /quiet /norestart ADDLOCAL=ALL

if %errorLevel% neq 0 (
    echo ERROR: Failed to install Node.js.
    echo Please install Node.js manually from: https://nodejs.org/
    pause
    exit /b 1
)

echo Waiting for installation to complete...
timeout /t 15 /nobreak >nul

REM Refresh environment variables
call refreshenv >nul 2>&1

REM Check if Node.js is now available
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo.
    echo WARNING: Node.js installed but not found in PATH.
    echo Please restart your computer, then run install-everything.bat again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Node.js installed successfully!
echo ========================================
node --version
npm --version
echo.
echo You can now run install-everything.bat to continue.
echo.
pause
