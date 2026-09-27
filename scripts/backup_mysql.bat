@echo off
setlocal enabledelayedexpansion

:: ========================================================
:: MySQL Automated Backup Script (Windows)
:: Database: toeic_dictation
:: Retention: 7 days
:: ========================================================

echo ===================================================
echo   TOEIC Dictation - MySQL Automated Backup System
echo ===================================================

:: 1. Database & Connection Configuration
set DB_NAME=%1
if "%DB_NAME%"=="" set DB_NAME=toeic_dictation

set DB_USER=%DB_USER%
if "%DB_USER%"=="" set DB_USER=root

set DB_PASS=%DB_PASS%

set DB_HOST=%DB_HOST%
if "%DB_HOST%"=="" set DB_HOST=127.0.0.1

set DB_PORT=%DB_PORT%
if "%DB_PORT%"=="" set DB_PORT=3306

:: 2. Target Directory
set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%..\backups
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: 3. Formulate Timestamp (YYYYMMDD_HHMMSS)
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set DT=%%I
if "%DT%"=="" (
    set TIMESTAMP=%date:~-4%%date:~4,2%%date:~7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
    set TIMESTAMP=!TIMESTAMP: =0!
) else (
    set TIMESTAMP=%DT:~0,8%_%DT:~8,6%
)

set BACKUP_FILE=%BACKUP_DIR%\backup_%DB_NAME%_%TIMESTAMP%.sql

:: 4. Locate mysqldump executable
where mysqldump >nul 2>&1
if %ERRORLEVEL% equ 0 (
    set MYSQLDUMP_CMD=mysqldump
) else if exist "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" (
    set MYSQLDUMP_CMD="C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe"
) else if exist "D:\xampp\mysql\bin\mysqldump.exe" (
    set MYSQLDUMP_CMD="D:\xampp\mysql\bin\mysqldump.exe"
) else (
    echo [ERROR] mysqldump executable not found in PATH or standard installation folders!
    exit /b 1
)

echo [*] Starting database dump for '%DB_NAME%'...
echo [*] Output destination: %BACKUP_FILE%

:: 5. Execute mysqldump
if "%DB_PASS%"=="" (
    %MYSQLDUMP_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% --single-transaction --quick --routines --triggers %DB_NAME% > "%BACKUP_FILE%"
) else (
    %MYSQLDUMP_CMD% -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASS% --single-transaction --quick --routines --triggers %DB_NAME% > "%BACKUP_FILE%"
)

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Backup execution failed with code %ERRORLEVEL%!
    if exist "%BACKUP_FILE%" del "%BACKUP_FILE%"
    exit /b %ERRORLEVEL%
)

for %%A in ("%BACKUP_FILE%") do set FILE_SIZE=%%~zA
echo [SUCCESS] Backup completed successfully! (Size: %FILE_SIZE% bytes)

:: 6. Retention Policy: Clean up backup files older than 7 days
echo [*] Enforcing retention policy: pruning backups older than 7 days...
forfiles /p "%BACKUP_DIR%" /m backup_*.sql /d -7 /c "cmd /c echo Deleting old archive: @file & del @path" >nul 2>&1

echo ===================================================
echo   Backup Process Finished!
echo ===================================================
exit /b 0
