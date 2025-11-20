@echo off
echo ========================================
echo Removing node_modules from Git History
echo ========================================
echo.
echo WARNING: This rewrites git history
echo Make sure no one else is working on this repo
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Remove from current tracking...
git rm -r --cached SierraWebsite/node_modules 2>nul
git commit -m "Remove node_modules from tracking" 2>nul

echo.
echo Step 2: Remove from git history (this may take a minute)...
git filter-branch --force --index-filter "git rm -rf --cached --ignore-unmatch SierraWebsite/node_modules" --prune-empty --tag-name-filter cat -- --all

echo.
echo Step 3: Clean up...
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo Step 4: Force push to GitHub...
git push origin --force --all

echo.
echo ========================================
echo Done! Git history cleaned
echo ========================================
pause
