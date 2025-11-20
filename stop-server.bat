@echo off
REM Medical Clinic System - Stop Server Script
REM This script stops both backend and frontend servers

echo ========================================
echo Medical Clinic System - Stopping...
echo ========================================
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo.
echo All servers stopped!
echo.
pause


