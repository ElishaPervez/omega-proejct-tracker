@echo off
echo.
echo ========================================
echo   Fresh Start - Commission Manager
echo ========================================
echo.
echo This will:
echo   1. Delete your .env file
echo   2. Clear the database
echo   3. Start interactive setup
echo.
echo WARNING: All configuration and data will be lost!
echo.
set /p confirm="Are you sure? Type YES to continue: "

if /i "%confirm%" NEQ "YES" (
    echo.
    echo Cancelled. No changes were made.
    pause
    exit /b
)

echo.
echo Starting fresh setup...
echo.

REM Delete .env file
if exist ".env" (
    del /f ".env"
    echo   - Deleted .env file
)

if exist ".env.local" (
    del /f ".env.local"
    echo   - Deleted .env.local file
)

REM Delete database
if exist "prisma\dev.db" (
    del /f "prisma\dev.db"
    echo   - Deleted database
)

if exist "prisma\dev.db-journal" (
    del /f "prisma\dev.db-journal"
    echo   - Deleted database journal
)

echo.
echo All cleaned up! Starting interactive setup...
echo.
echo ========================================
echo.

REM Run setup script
call node setup.js

echo.
echo ========================================
echo   Setting up database...
echo ========================================
echo.

REM Create database
call npx prisma migrate dev --name init

echo.
echo ========================================
echo   Registering Discord commands...
echo ========================================
echo.

REM Register Discord commands
call npm run discord:register

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo You can now start the application with:
echo   start-dev.bat
echo.
echo Or manually with:
echo   npm run dev (terminal 1)
echo   npm run discord:dev (terminal 2)
echo.
pause
