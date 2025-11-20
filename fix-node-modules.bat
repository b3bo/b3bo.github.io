@echo off
echo ========================================
echo Removing node_modules from Git
echo ========================================
echo.

cd /d "%~dp0"

echo Removing node_modules from git tracking...
git rm -r --cached SierraWebsite/node_modules

echo.
echo Committing the removal...
git commit -m "Remove node_modules from git tracking"

echo.
echo Pushing to GitHub...
git push

echo.
echo ========================================
echo Done! node_modules removed from GitHub
echo Now deploying neighborhood map files...
echo ========================================
pause
