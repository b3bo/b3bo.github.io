@echo off
echo ========================================
echo REMOVING EXPOSED CREDENTIALS FROM GIT
echo ========================================
echo.

cd /d C:\Users\johnb\Documents\GitHub\b3bo.github.io

echo Step 1: Add files to .gitignore...
echo RealEstateApps/service_account.json>> .gitignore
echo RealEstateApps/*.json>> .gitignore
echo **/*service_account*.json>> .gitignore

echo.
echo Step 2: Removing from current commit...
git rm -r --cached RealEstateApps 2>nul
git commit -m "Remove sensitive files" 2>nul

echo.
echo Step 3: Purging from ALL Git history (may take 1-2 minutes)...
git filter-branch --force --index-filter "git rm -r --cached --ignore-unmatch RealEstateApps" --prune-empty --tag-name-filter cat -- --all

echo.
echo Step 4: Cleaning up references...
git for-each-ref --format="delete %%(refname)" refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo.
echo ========================================
echo DONE! Credentials removed from history.
echo.
echo NEXT STEPS:
echo 1. Force push: git push origin --force --all
echo 2. Go to Google Cloud Console and DELETE the exposed key
echo 3. Create a NEW API key
echo ========================================
pause
