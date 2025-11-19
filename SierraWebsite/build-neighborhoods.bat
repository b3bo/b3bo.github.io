@echo off
echo ========================================
echo Building Neighborhood Map with Tailwind
echo ========================================
echo.

cd /d "%~dp0"

echo Running Tailwind build...
call npm run build:tailwind

echo.
echo Replacing old index.html with Tailwind version...
copy /Y "neighborhoods\index-tailwind.html" "neighborhoods\index.html"

echo.
echo ========================================
echo Done! Test at:
echo file:///C:/Users/johnb/Documents/GitHub/b3bo.github.io/SierraWebsite/neighborhoods/index.html
echo.
echo Or deploy with: ..\deploy.bat
echo ========================================
pause
