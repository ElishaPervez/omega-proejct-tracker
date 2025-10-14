@echo off
echo Starting the Project Management App with Discord Integration...
echo.

REM Check if .env exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo.
    echo Please run setup first: fresh-start.bat
    echo.
    pause
    exit /b 1
)

REM Start the Next.js dev server in a new command prompt window
start "Next.js App" cmd /k "npm run dev"

REM Wait a few seconds for the Next.js server to start
timeout /t 3 /nobreak >nul

REM Open the browser to the local development URL
start http://localhost:3000

REM Start the Discord bot in another command prompt window
start "Discord Bot" cmd /k "npm run discord:dev"

echo Both applications are now running!
echo - Next.js App: http://localhost:3000
echo - Discord Bot: Running in background

pause