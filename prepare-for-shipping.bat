@echo off
REM Prepare Project for Shipping - Remove Large Files
echo ========================================
echo Preparing Project for Shipping
echo ========================================
echo.
echo This will remove:
echo   - .git folder (version control history - not needed)
echo   - backend/dist folder (compiled executable - can be rebuilt)
echo   - node_modules folders (can be reinstalled with npm install)
echo   - Large log and cache files
echo.
echo The system will still work - client just needs to:
echo   1. Run: cd backend ^&^& npm install
echo   2. Run: cd frontend ^&^& npm install
echo   3. Run setup scripts (.bat files)
echo.
pause

cd /d "%~dp0"

echo.
echo Removing .git folder...
if exist .git (
    rd /s /q .git
    echo   - .git folder removed
) else (
    echo   - .git folder not found (already removed)
)

echo.
echo Removing backend/dist folder...
if exist backend\dist (
    rd /s /q backend\dist
    echo   - backend/dist folder removed
) else (
    echo   - backend/dist folder not found (already removed)
)

echo.
echo Removing node_modules folders...
if exist backend\node_modules (
    rd /s /q backend\node_modules
    echo   - backend/node_modules removed
) else (
    echo   - backend/node_modules not found (already removed)
)

if exist frontend\node_modules (
    rd /s /q frontend\node_modules
    echo   - frontend/node_modules removed
) else (
    echo   - frontend/node_modules not found (already removed)
)

echo.
echo Removing log and cache files...
del /s /q *.log 2>nul
del /s /q *.cache 2>nul
del /s /q .DS_Store 2>nul
del /s /q Thumbs.db 2>nul

echo.
echo ========================================
echo Cleanup Complete!
echo ========================================
echo.
echo Project is now ready for compression and shipping.
echo.
echo Next steps:
echo   1. Compress this folder (zip or 7z)
echo   2. Send to client
echo   3. Client should extract and run:
echo      - setup-complete-system.bat (for new setup)
echo      - OR update-and-seed-system.bat (for existing system)
echo.
echo The system will work perfectly - client just needs Node.js installed.
echo.
pause

