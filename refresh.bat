@echo off
echo.
echo ========================================
echo   Refresh - Commission Manager
echo ========================================
echo.
echo This will:
echo   1. Clear the database
echo   2. Re-create tables
echo   3. Re-register Discord commands
echo.
echo Your .env credentials will be PRESERVED.
echo.
echo WARNING: All data will be lost!
echo.
pause

echo.
echo ========================================
echo   Clearing Database...
echo ========================================
echo.

if exist "prisma\dev.db" (
    del /f "prisma\dev.db"
    echo   - Deleted database
) else (
    echo   - Database already clean
)

if exist "prisma\dev.db-journal" (
    del /f "prisma\dev.db-journal"
    echo   - Deleted database journal
) else (
    echo   - No journal file found
)

if exist "prisma\migrations" (
    rmdir /s /q "prisma\migrations"
    echo   - Cleared migrations folder
) else (
    echo   - No migrations folder found
)

echo.
echo ========================================
echo   Creating Database Tables...
echo ========================================
echo.

call npx prisma migrate dev --name init

echo.
echo ========================================
echo   Registering Discord Commands...
echo ========================================
echo.

call npm run discord:register

echo.
echo ========================================
echo   Refresh Complete!
echo ========================================
echo.
echo Database is now clean with fresh tables.
echo Your .env credentials are still intact.
echo.
echo Start the application with:
echo   start-dev.bat
echo.
echo Or manually with:
echo   npm run dev (terminal 1)
echo   npm run discord:dev (terminal 2)
echo.
pause
