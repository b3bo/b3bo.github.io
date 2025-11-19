@echo off
echo ========================================
echo Deploying changes to GitHub Pages
echo ========================================
echo.

cd /d "%~dp0"

echo Staging all changes...
git add -A

echo.
echo Checking status...
git status

echo.
echo Committing changes...
git commit -m "Add redirect page, documentation, and neighborhood map configs"

echo.
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo Done! GitHub Pages will update in 1-2 minutes
echo Check: https://b3bo.github.io/
echo ========================================
pause
