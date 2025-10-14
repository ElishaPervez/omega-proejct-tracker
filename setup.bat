@echo off
echo.
echo ========================================
echo   Omega Project Tracker - Setup
echo ========================================
echo.
echo This will install all dependencies...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    echo.
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

echo Installing dependencies...
echo This may take a few minutes...
echo.

call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to install dependencies!
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
