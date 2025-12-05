@echo off
setlocal enabledelayedexpansion

cd /d "%~dp0"

echo Starting reprocessing...
echo.

REM Run Python and capture output to log file
python.exe -u reprocess_script.py > reprocess_log.txt 2>&1

REM Display the log file
type reprocess_log.txt

echo.
echo Reprocessing complete. Log saved to reprocess_log.txt
echo.
echo Press any key to close...
pause > nul
