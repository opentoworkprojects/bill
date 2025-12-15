@echo off
echo ========================================
echo Building BillByteKOT Android App
echo ========================================
echo.

echo Step 1: Navigating to Android project...
cd frontend\billbytekot
if errorlevel 1 (
    echo ERROR: Could not find frontend\billbytekot directory
    pause
    exit /b 1
)

echo.
echo Step 2: Cleaning previous builds...
call gradlew.bat clean
if errorlevel 1 (
    echo ERROR: Clean failed
    pause
    exit /b 1
)

echo.
echo Step 3: Building Android App Bundle (AAB)...
call gradlew.bat bundleRelease
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo AAB Location:
echo app\build\outputs\bundle\release\app-release.aab
echo.
echo Next Steps:
echo 1. Upload app-release.aab to Google Play Console
echo 2. Go to: https://play.google.com/console
echo 3. Select your app and create a new release
echo 4. Upload the AAB file
echo.
echo Version: 12 (versionCode 12)
echo.
pause
