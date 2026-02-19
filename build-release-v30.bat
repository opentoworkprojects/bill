@echo off
echo ========================================
echo Building BillByteKOT Release v30
echo ========================================
echo.

cd frontend\billbytekot

echo Step 1: Cleaning project...
call gradlew clean
if %errorlevel% neq 0 (
    echo ERROR: Clean failed!
    pause
    exit /b %errorlevel%
)
echo.

echo Step 2: Building release bundle for Play Store...
call gradlew bundleRelease
if %errorlevel% neq 0 (
    echo ERROR: Bundle build failed!
    pause
    exit /b %errorlevel%
)
echo.

echo Step 3: Building release APK...
call gradlew assembleRelease
if %errorlevel% neq 0 (
    echo ERROR: APK build failed!
    pause
    exit /b %errorlevel%
)
echo.

echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Release files location:
echo Bundle: app\build\outputs\bundle\release\app-release.aab
echo APK: app\build\outputs\apk\release\app-release-unsigned.apk
echo.
echo Next steps:
echo 1. Sign the bundle/APK with your keystore
echo 2. Upload to Google Play Console
echo 3. Monitor for warning resolution
echo.
pause
