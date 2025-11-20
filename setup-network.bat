@echo off
REM Medical Clinic System - Network Setup
REM Configures Windows Firewall for network access

echo ========================================
echo Medical Clinic System - Network Setup
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

echo Configuring Windows Firewall...
echo.

REM Allow backend port
netsh advfirewall firewall add rule name="Medical Clinic Backend" dir=in action=allow protocol=TCP localport=3000 >nul 2>&1
echo ✅ Port 3000 (Backend) allowed

REM Allow frontend port
netsh advfirewall firewall add rule name="Medical Clinic Frontend" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1
echo ✅ Port 5173 (Frontend) allowed

echo.
echo ========================================
echo Network Setup Complete!
echo ========================================
echo.
echo Firewall rules added for ports 3000 and 5173
echo Other PCs on the same network can now connect.
echo.
echo To find your server IP, run: find-server-ip.bat
echo.
pause

