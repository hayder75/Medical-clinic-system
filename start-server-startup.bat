@echo off
REM Medical Clinic System - Auto-Start Script
REM This script runs automatically on Windows startup
REM Place this file in: shell:startup folder

REM Wait for system to fully boot (30 seconds)
timeout /t 30 /nobreak >nul

REM Get the directory where this script is located
REM Adjust this path to match your actual installation location
set "PROJECT_PATH=C:\MedicalClinic"

REM If script is in project folder, use that
if exist "%~dp0backend" (
    set "PROJECT_PATH=%~dp0"
)

REM Change to project directory
cd /d "%PROJECT_PATH%"

REM Check if start-server.bat exists
if not exist "start-server.bat" (
    REM If not found, try to start directly
    cd backend
    start "Medical Clinic Backend" cmd /k "npm start"
    timeout /t 10 /nobreak >nul
    cd ..\frontend
    start "Medical Clinic Frontend" cmd /k "npm run preview -- --port 3001"
    exit /b
)

REM Run the main startup script (minimized)
start /min "" "%PROJECT_PATH%\start-server.bat"

