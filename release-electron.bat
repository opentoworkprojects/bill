@echo off
echo ========================================
echo BillByteKOT Desktop - Release Builder
echo Version 2.0.1 - Print Format Fix
echo ========================================

cd frontend

echo.
echo [1/4] Installing dependencies...
call npm install

echo.
echo [2/4] Building React app...
call npm run build

echo.
echo [3/4] Building Electron app for Windows...
call npm run electron:build:win

echo.
echo [4/4] Build complete!
echo.
echo Output files are in: frontend/dist-electron/
echo.
echo Release files:
dir dist-electron\*.exe /b 2>nul
echo.

echo ========================================
echo Release 2.0.1 Build Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Test the .exe file in dist-electron folder
echo 2. Upload to your distribution platform
echo 3. Update download links on website
echo 4. Notify users about the print format fix
echo.
pause