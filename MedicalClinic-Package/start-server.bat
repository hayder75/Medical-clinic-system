@echo off
REM Medical Clinic System - Server Startup Script
REM This script starts both backend and frontend servers

echo ========================================
echo Medical Clinic System - Starting...
echo ========================================
echo.

REM Get the directory where this script is located
cd /d "%~dp0"

REM Check if backend.exe exists
if not exist "backend.exe" (
    echo ERROR: backend.exe not found!
    echo Please ensure you're running this from the installation directory.
    pause
    exit /b 1
)

echo [1/3] Starting Backend Server...
start "Medical Clinic Backend" backend.exe
timeout /t 10 /nobreak >nul
echo Backend started!
echo.

echo [2/3] Starting Frontend Server...
cd frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

REM Check if dist folder exists (production build)
if not exist "dist" (
    echo ERROR: Frontend not built!
    echo Please contact vendor.
    pause
    exit /b 1
)

REM Start frontend preview server (serves the built files)
start "Medical Clinic Frontend" cmd /k "npm run preview -- --port 3001"
timeout /t 5 /nobreak >nul
echo Frontend started!
echo.

cd ..

echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo To access from other computers:
echo Use: http://YOUR_SERVER_IP:3001
echo.
echo To find your IP address, run: find-server-ip.bat
echo.
echo Press any key to close this window...
echo (The servers will continue running in separate windows)
pause >nul
