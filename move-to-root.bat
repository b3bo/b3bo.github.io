@echo off
echo Moving neighborhoods to root level...

REM Create neighborhoods folder at root
if not exist neighborhoods mkdir neighborhoods

REM Copy all files from SierraWebsite/neighborhoods to root/neighborhoods
xcopy /E /Y /I "SierraWebsite\neighborhoods\*" "neighborhoods\"

echo.
echo ✅ Done! Files copied to /neighborhoods/
echo URL will be: https://neighborhoods.truesouthcoastalhomes.com/neighborhoods/
echo.
echo Next: Update CSS/asset paths in neighborhoods\index.html
pause
