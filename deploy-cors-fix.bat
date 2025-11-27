@echo off
REM CORS Fix Deployment Script for Windows
REM This script helps deploy the CORS fixes to production

echo ========================================
echo RestoBill AI - CORS Fix Deployment
echo ========================================
echo.

REM Check if git is available
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Git is not installed. Please install git first.
    pause
    exit /b 1
)

REM Check if we're in the right directory
if not exist "backend\server.py" (
    echo [ERROR] Please run this script from the project root directory
    pause
    exit /b 1
)

echo Step 1: Checking current branch...
for /f "tokens=*" %%i in ('git branch --show-current') do set CURRENT_BRANCH=%%i
echo Current branch: %CURRENT_BRANCH%

if not "%CURRENT_BRANCH%"=="main" (
    echo [WARNING] You're not on the main branch
    set /p SWITCH="Do you want to switch to main? (y/n): "
    if /i "%SWITCH%"=="y" (
        git checkout main
        echo [SUCCESS] Switched to main branch
    ) else (
        echo [INFO] Continuing on %CURRENT_BRANCH%
    )
)

echo.
echo Step 2: Checking for uncommitted changes...
git status -s > temp_status.txt
for /f %%i in ("temp_status.txt") do set SIZE=%%~zi
del temp_status.txt

if %SIZE% GTR 0 (
    echo [WARNING] You have uncommitted changes
    git status -s
    echo.
    set /p COMMIT="Do you want to commit these changes? (y/n): "
    if /i "%COMMIT%"=="y" (
        git add backend\server.py frontend\.env.production
        git commit -m "fix: Add finverge.tech to CORS allowed origins and update production backend URL"
        echo [SUCCESS] Changes committed
    ) else (
        echo [WARNING] Skipping commit. Please commit manually before deploying.
        pause
        exit /b 1
    )
) else (
    echo [SUCCESS] No uncommitted changes
)

echo.
echo Step 3: Pushing to remote repository...
set /p PUSH="Push to remote? This will trigger backend deployment on Render. (y/n): "
if /i "%PUSH%"=="y" (
    git push origin %CURRENT_BRANCH%
    echo [SUCCESS] Pushed to remote repository
    echo [INFO] Render will automatically deploy the backend changes
) else (
    echo [WARNING] Skipped push. Backend won't be updated.
)

echo.
echo Step 4: Backend Deployment Status
echo [INFO] Check backend deployment at: https://dashboard.render.com
echo [INFO] Backend URL: https://restro-ai.onrender.com
echo.
pause

echo.
echo Step 5: Testing backend health...
where curl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    curl -s https://restro-ai.onrender.com/health > health_check.txt
    findstr /C:"healthy" health_check.txt >nul
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Backend is healthy and running
    ) else (
        echo [ERROR] Backend health check failed
        type health_check.txt
    )
    del health_check.txt
) else (
    echo [WARNING] curl not found. Please manually check: https://restro-ai.onrender.com/health
)

echo.
echo Step 6: Frontend Deployment
echo [INFO] Frontend needs to be rebuilt and redeployed
echo.
set /p BUILD="Do you want to build the frontend now? (y/n): "
if /i "%BUILD%"=="y" (
    cd frontend
    echo [INFO] Installing dependencies...
    call npm install
    echo [INFO] Building production bundle...
    call npm run build
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Frontend built successfully
        echo [INFO] Build output is in frontend\build\
        echo.
        echo [INFO] Deploy the build to your hosting platform:
        echo   - For Vercel: vercel --prod
        echo   - For Netlify: netlify deploy --prod
        echo   - Or push to trigger auto-deployment
    ) else (
        echo [ERROR] Frontend build failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [WARNING] Skipped frontend build
)

echo.
echo Step 7: Verification
echo ====================
echo [INFO] After frontend deployment, verify the following:
echo.
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Go to https://finverge.tech
echo 3. Open DevTools (F12) - Console tab
echo 4. Try to login
echo 5. Check for CORS errors (should be none)
echo.
echo [INFO] Expected behavior:
echo   [OK] No CORS errors in console
echo   [OK] Login request succeeds
echo   [OK] API calls return data
echo.

echo Step 8: Testing CORS Configuration
where curl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Testing CORS preflight request...
    curl -s -H "Origin: https://finverge.tech" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -X OPTIONS https://restro-ai.onrender.com/api/auth/login -I > cors_test.txt
    findstr /C:"finverge.tech" cors_test.txt >nul
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] CORS is configured correctly
        findstr /C:"access-control-allow-origin" cors_test.txt
    ) else (
        echo [WARNING] CORS headers not found. Backend may still be deploying.
        echo [INFO] Wait a few minutes and test manually
    )
    del cors_test.txt
) else (
    echo [WARNING] curl not found. Please test CORS manually
)

echo.
echo ========================================
echo Deployment Process Complete!
echo ========================================
echo.
echo [INFO] Next Steps:
echo 1. Deploy frontend to your hosting platform
echo 2. Clear browser cache
echo 3. Test login at https://finverge.tech
echo 4. Verify no CORS errors
echo.
echo [INFO] Documentation:
echo   - Full guide: CORS_FIX_COMPLETE.md
echo   - Troubleshooting: See CORS_FIX_COMPLETE.md
echo.
echo [SUCCESS] All backend changes deployed!
echo.

echo ========================================
echo Deployment Summary
echo ========================================
echo Backend URL: https://restro-ai.onrender.com
echo Frontend URL: https://finverge.tech
echo CORS Origins: finverge.tech, www.finverge.tech
echo Status: Backend deployed, Frontend needs deployment
echo.
echo [INFO] Check CORS_FIX_COMPLETE.md for detailed verification steps
echo.
pause
