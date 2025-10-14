@echo off
echo.
echo ========================================
echo   Omega Project Tracker - Setup
echo ========================================
echo.
echo Installing all dependencies...
echo This will take 2-5 minutes...
echo.

npm install

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    echo Make sure Node.js is installed: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Dependencies installed successfully!
echo.
echo NEXT STEPS:
echo   1. Run: fresh-start.bat
echo      - This will ask for your Discord credentials
echo      - Creates database and registers commands
echo.
echo   2. Then run: start-dev.bat
echo      - Starts the web app and Discord bot
echo.
echo Need help? Check SETUP.md for detailed instructions
echo.
pause
