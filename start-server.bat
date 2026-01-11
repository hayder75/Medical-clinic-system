@echo off
REM Medical Clinic System - Start Server
REM Starts both backend and frontend servers
REM Run this from the main project folder

echo ========================================
echo Medical Clinic System - Starting...
echo ========================================
echo.

REM Get the directory where this script is located (main folder)
cd /d "%~dp0"

REM Check Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo ERROR: Node.js not found!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if .env exists in backend
if not exist backend\.env (
    echo.
    echo ERROR: .env file not found in backend folder!
    echo Please run setup-database.bat first to create the .env file.
    echo.
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server...
cd backend
start /min "Medical Clinic Backend" cmd /k "npm start || echo. && echo ======================================== && echo SERVER ERROR - Please contact support && echo ======================================== && echo. && echo The server has stopped. Please check the error above. && echo. && pause"
timeout /t 8 /nobreak >nul

echo [2/2] Starting Frontend Server...
cd ..\frontend
start /min "Medical Clinic Frontend" cmd /k "npm run dev || echo. && echo ======================================== && echo FRONTEND ERROR - Please contact support && echo ======================================== && echo. && echo The frontend has stopped. Please check the error above. && echo. && pause"
timeout /t 5 /nobreak >nul

cd ..

echo ========================================
echo System Started Successfully!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo To access from other computers:
echo 1. Find server IP: Run find-server-ip.bat
echo 2. Access: http://SERVER_IP:3001
echo.
echo Note: The frontend automatically detects the server IP
echo       No configuration needed - it works from any PC!
echo.
echo Closing this window in 3 seconds...
echo (The servers will continue running in the background)
echo (If the server stops, a window will appear with error details)
timeout /t 3 /nobreak >nul
