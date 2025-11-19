@echo off
echo ========================================
echo Installing SierraWebsite Dependencies
echo ========================================
echo.

cd /d "%~dp0"

echo Installing Node packages...
call npm install

echo.
echo ========================================
echo Done! Now run: build-neighborhoods.bat
echo ========================================
pause
