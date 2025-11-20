@echo off
REM Medical Clinic System - Auto-Start Script
REM This script runs automatically on Windows startup
REM Place this file in: shell:startup folder

REM Wait for system to fully boot (30 seconds)
timeout /t 30 /nobreak >nul

REM Get the installation directory
set "INSTALL_DIR=C:\MedicalClinic"

REM Change to installation directory
cd /d "%INSTALL_DIR%"

REM Check if start-server.bat exists
if not exist "start-server.bat" (
    REM If not found, try to start directly
    if exist "backend.exe" (
        start "Medical Clinic Backend" backend.exe
        timeout /t 10 /nobreak >nul
        cd frontend
        if exist "dist" (
            start "Medical Clinic Frontend" cmd /k "npm run preview -- --port 3001"
        )
    )
    exit /b
)

REM Run the main startup script (minimized)
start /min "" "%INSTALL_DIR%\start-server.bat"
