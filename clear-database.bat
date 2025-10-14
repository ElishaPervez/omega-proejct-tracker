@echo off
echo.
echo ========================================
echo   Clear Database - Commission Manager
echo ========================================
echo.
echo WARNING: This will delete ALL your data!
echo   - All projects
echo   - All clients
echo   - All invoices
echo   - All timer sessions
echo   - All users
echo.
set /p confirm="Are you sure? Type YES to continue: "

if /i "%confirm%" NEQ "YES" (
    echo.
    echo Cancelled. No data was deleted.
    pause
    exit /b
)

echo.
echo Deleting database...

if exist "prisma\dev.db" (
    del /f "prisma\dev.db"
    echo   - Deleted dev.db
)

if exist "prisma\dev.db-journal" (
    del /f "prisma\dev.db-journal"
    echo   - Deleted dev.db-journal
)

echo.
echo Database cleared successfully!
echo.
echo Next steps:
echo   1. Run: npx prisma migrate dev
echo   2. Start fresh with a clean database
echo.
pause
