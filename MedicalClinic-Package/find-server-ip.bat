@echo off
REM Find Server IP Address
REM Run this on the server PC to find its IP address

echo ========================================
echo Finding Server IP Address...
echo ========================================
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ========================================
echo Copy the IPv4 Address above
echo Use it on client PCs: http://IP_ADDRESS:3001
echo ========================================
echo.
pause
