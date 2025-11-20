@echo off
REM Medical Clinic System - Start Server
REM Starts both backend and frontend servers

echo ========================================
echo Medical Clinic System - Starting...
echo ========================================
echo.

cd /d "%~dp0"

REM Check Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server...
cd backend
start "Medical Clinic Backend" cmd /k "npm start"
timeout /t 10 /nobreak >nul
echo Backend started!
echo.

echo [2/2] Starting Frontend Server...
cd ..\frontend

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from .env.example...
    copy .env.example .env >nul
    echo Frontend .env created!
)

start "Medical Clinic Frontend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo Frontend started!
echo.

cd ..

echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Default Login:
echo   Username: admin
echo   Password: admin123
echo   (Change password immediately!)
echo.
echo To access from other computers:
echo 1. Find server IP: Run find-server-ip.bat
echo 2. Configure firewall: Run setup-network.bat (as admin)
echo 3. Access: http://SERVER_IP:5173
echo.
echo Press any key to close this window...
echo (The servers will continue running in separate windows)
pause >nul
