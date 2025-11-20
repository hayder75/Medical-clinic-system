@echo off
REM Find Server IP Address
REM Run this to find the IP address for other PCs to connect

echo ========================================
echo Finding Server IP Address...
echo ========================================
echo.

ipconfig | findstr /i "IPv4"

echo.
echo ========================================
echo Copy the IPv4 Address above
echo Use it on client PCs: http://IP_ADDRESS:5173
echo ========================================
echo.
pause
