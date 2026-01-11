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
echo SERVER IP ADDRESS FOUND!
echo ========================================
echo.
echo Copy the IPv4 Address shown above
echo.
echo To connect from other PCs:
echo 1. Make sure other PC is on SAME WiFi
echo 2. Open browser
echo 3. Type: http://IP_ADDRESS:3001
echo    (Replace IP_ADDRESS with the number above)
echo.
echo Example:
echo If IP is 192.168.1.100
echo Type: http://192.168.1.100:3001
echo.
echo ========================================
echo.
pause

