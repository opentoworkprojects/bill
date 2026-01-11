@echo off
echo ========================================
echo  Local Testing for Inventory & Menu Fixes
echo ========================================
echo.

echo 1. Checking if backend server is running...
curl -s http://localhost:8000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Backend server is not running!
    echo.
    echo Please start the backend server first:
    echo   cd backend
    echo   python server.py
    echo.
    pause
    exit /b 1
)

echo ✅ Backend server is running!
echo.

echo 2. Running comprehensive tests...
python test-local-comprehensive.py

echo.
echo 3. Testing frontend (if available)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is also running at http://localhost:3000
    echo You can now test the UI manually:
    echo   - Go to http://localhost:3000/inventory
    echo   - Try adding a new inventory item
    echo   - Go to orders and check if menu items load
) else (
    echo ⚠️  Frontend is not running
    echo To start frontend:
    echo   cd frontend
    echo   npm start
)

echo.
echo ========================================
echo  Testing Complete!
echo ========================================
pause