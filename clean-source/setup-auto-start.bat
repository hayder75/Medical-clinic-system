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

cd /d "%~dp0"

echo Setting up auto-start on boot...
echo.

REM Create startup script
set "STARTUP_SCRIPT=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MedicalClinic-Start.bat"

(
echo @echo off
echo REM Medical Clinic System - Auto-Start
echo cd /d "%~dp0"
echo timeout /t 30 /nobreak ^>nul
echo call start-server.bat
) > "%STARTUP_SCRIPT%"

echo ✅ Auto-start script created in Startup folder
echo.
echo The system will now start automatically when Windows boots.
echo.
echo To disable auto-start, delete:
echo %STARTUP_SCRIPT%
echo.
pause

