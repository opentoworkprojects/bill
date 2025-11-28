@echo off
echo ========================================
echo   RestoBill Desktop App Builder
echo   by FinVerge Tech (finverge.tech)
echo ========================================
echo.
echo Production URL: https://finverge.tech
echo Backend URL: https://restro-ai.onrender.com
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

:: Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo npm version:
npm --version
echo.

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
)

echo.
echo Select build option:
echo [1] Build for Windows (recommended)
echo [2] Run in development mode
echo [3] Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo Building RestoBill for Windows...
    echo This will create an installer that loads from finverge.tech
    echo.
    npm run electron:build:win
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo ========================================
        echo SUCCESS! Windows build complete.
        echo ========================================
        echo.
        echo Output files in: dist-electron\
        echo - RestoBill-1.0.0-win-x64.exe (Installer)
        echo - RestoBill-1.0.0-win-x64-portable.exe (Portable)
        echo.
        explorer dist-electron
    ) else (
        echo ERROR: Build failed!
    )
) else if "%choice%"=="2" (
    echo.
    echo Starting development mode...
    echo This will run React on localhost:3000
    npm run electron:dev
) else if "%choice%"=="3" (
    exit /b 0
) else (
    echo Invalid choice!
)

echo.
pause
