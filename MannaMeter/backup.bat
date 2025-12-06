@echo off
REM MannaMeter Backup Script
REM Creates automated backups of sermon analysis data
REM Usage: backup.bat [options]

setlocal enabledelayedexpansion

REM Configuration
set "SCRIPT_DIR=%~dp0"
set "PYTHON_CMD=python"
set "BACKUP_UTIL=backup_util.py"

REM Colors for output
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "RESET=[0m"

REM Check if we're in the right directory
if not exist "%SCRIPT_DIR%backup_util.py" (
    echo %RED%Error: backup_util.py not found in current directory%RESET%
    echo Please run this script from the MannaMeter directory
    pause
    exit /b 1
)

REM Parse command line arguments
set "ACTION=backup"
set "CLEANUP="
set "VERBOSE="

:parse_args
if "%~1"=="" goto end_parse
if "%~1"=="--cleanup" (
    set "CLEANUP=1"
    shift
    goto parse_args
)
if "%~1"=="--verbose" (
    set "VERBOSE=1"
    shift
    goto parse_args
)
if "%~1"=="--help" (
    goto show_help
)
if "%~1"=="list" (
    set "ACTION=list"
    shift
    goto parse_args
)
if "%~1"=="stats" (
    set "ACTION=stats"
    shift
    goto parse_args
)
if "%~1"=="verify" (
    set "ACTION=verify"
    shift
    goto parse_args
)
shift
goto parse_args

:end_parse

REM Check if Python is available
%PYTHON_CMD% --version >nul 2>&1
if errorlevel 1 (
    echo %RED%Error: Python is not available or not in PATH%RESET%
    echo Please ensure Python is installed and accessible
    pause
    exit /b 1
)

echo.
echo %BLUE%=====================================%RESET%
echo %BLUE%    MannaMeter Backup Utility%RESET%
echo %BLUE%=====================================%RESET%
echo.

REM Get current date and time for logging
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set "TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%"

echo Current time: %TIMESTAMP%
echo Working directory: %SCRIPT_DIR%
echo.

REM Execute the requested action
if "%ACTION%"=="backup" (
    call :do_backup
) else if "%ACTION%"=="list" (
    call :do_list
) else if "%ACTION%"=="stats" (
    call :do_stats
) else if "%ACTION%"=="verify" (
    call :do_verify
) else (
    echo %RED%Unknown action: %ACTION%%RESET%
    goto show_help
)

REM Cleanup if requested
if defined CLEANUP (
    echo.
    echo %YELLOW%Performing backup cleanup...%RESET%
    %PYTHON_CMD% %BACKUP_UTIL% cleanup
    if errorlevel 1 (
        echo %RED%Warning: Cleanup failed%RESET%
    ) else (
        echo %GREEN%Cleanup completed%RESET%
    )
)

echo.
echo %GREEN%Backup operation completed!%RESET%
if "%ACTION%"=="backup" (
    echo Your data is now safely backed up.
)
echo.
pause
goto :eof

:do_backup
echo %YELLOW%Creating backup...%RESET%
%PYTHON_CMD% %BACKUP_UTIL% backup
if errorlevel 1 (
    echo %RED%Backup failed!%RESET%
    exit /b 1
) else (
    echo %GREEN%Backup created successfully!%RESET%
)
goto :eof

:do_list
echo %YELLOW%Listing backups...%RESET%
%PYTHON_CMD% %BACKUP_UTIL% list
goto :eof

:do_stats
echo %YELLOW%Getting backup statistics...%RESET%
%PYTHON_CMD% %BACKUP_UTIL% stats
goto :eof

:do_verify
echo %YELLOW%Verifying backup integrity...%RESET%
%PYTHON_CMD% %BACKUP_UTIL% verify --all
goto :eof

:show_help
echo Usage: backup.bat [action] [options]
echo.
echo Actions:
echo   (default)    Create a new backup
echo   list         List all available backups
echo   stats        Show backup statistics
echo   verify       Verify backup integrity
echo.
echo Options:
echo   --cleanup    Clean up old backups after operation
echo   --verbose    Show detailed output
echo   --help       Show this help message
echo.
echo Examples:
echo   backup.bat                          # Create backup
echo   backup.bat --cleanup               # Create backup and cleanup old ones
echo   backup.bat list                    # List all backups
echo   backup.bat stats                   # Show backup statistics
echo   backup.bat verify                  # Verify all backups
echo.
echo The script will create backups in the 'backups' directory
echo and automatically manage backup retention.
echo.
pause
goto :eof