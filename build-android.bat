@echo off
echo ========================================
echo  Building BillByteKOT Android APK
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Java is installed
where java >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Java JDK is not installed!
    echo Please install JDK from: https://adoptium.net/
    pause
    exit /b 1
)

REM Check if Bubblewrap is installed
where bubblewrap >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Bubblewrap not found. Installing...
    call npm install -g @bubblewrap/cli
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install Bubblewrap
        pause
        exit /b 1
    )
    echo [SUCCESS] Bubblewrap installed!
    echo.
)

REM Create android-app directory if not exists
if not exist "android-app" (
    echo [INFO] Creating android-app directory...
    mkdir android-app
    cd android-app
    
    echo.
    echo ========================================
    echo  Initializing Bubblewrap Project
    echo ========================================
    echo.
    echo Please answer the following questions:
    echo.
    
    call bubblewrap init --manifest https://billbytekot.in/manifest.json
    
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to initialize Bubblewrap
        cd ..
        pause
        exit /b 1
    )
    
    cd ..
)

REM Build the APK
echo.
echo ========================================
echo  Building Android APK
echo ========================================
echo.

cd android-app
call bubblewrap build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Build failed!
    cd ..
    pause
    exit /b 1
)

cd ..

echo.
echo ========================================
echo  Build Complete!
echo ========================================
echo.
echo APK Location: android-app\app\build\outputs\apk\release\
echo.
echo Next Steps:
echo 1. Test APK on Android device
echo 2. Upload to Google Play Console
echo 3. Submit for review
echo.
echo Opening output folder...
start android-app\app\build\outputs\apk\release\

pause
