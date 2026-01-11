@echo off
REM Medical Clinic System - Auto-Start Setup
REM Sets up the system to start automatically on Windows boot

echo ========================================
echo Medical Clinic System - Auto-Start Setup
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

REM Get the directory where this script is located (main folder)
cd /d "%~dp0"

REM Project root is where this script is located
set "PROJECT_ROOT=%~dp0"
set "STARTUP_SCRIPT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MedicalClinic-Start.bat"

echo Setting up auto-start on boot...
echo.

REM Create startup script
(
echo @echo off
echo REM Medical Clinic System - Auto-Start
echo REM This script runs automatically when Windows boots
echo.
echo REM Wait 30 seconds for system to fully boot
echo timeout /t 30 /nobreak ^>nul
echo.
echo REM Change to project directory
echo cd /d "%PROJECT_ROOT%"
echo.
echo REM Start backend server
echo cd backend
echo start "Medical Clinic Backend" /min cmd /c "npm start"
echo timeout /t 10 /nobreak ^>nul
echo.
echo REM Start frontend server
echo cd ..\frontend
echo start "Medical Clinic Frontend" /min cmd /c "npm run dev"
) > "%STARTUP_SCRIPT%"

echo ✅ Auto-start script created in Startup folder
echo.
echo The system will now start automatically when Windows boots.
echo.
echo Location: %STARTUP_SCRIPT%
echo.
echo To disable auto-start, delete the file above.
echo.
pause

