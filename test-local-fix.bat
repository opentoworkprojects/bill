@echo off
echo ========================================
echo Local Testing - Active Orders Fix
echo ========================================
echo.
echo This will test the active orders filtering fix locally
echo Make sure you have:
echo 1. Python 3.8+ installed
echo 2. Backend dependencies installed (pip install -r backend/requirements.txt)
echo 3. MongoDB running (local or Atlas)
echo 4. Backend/.env configured
echo.
pause

echo Starting local test...
python run_local_test_complete.py

echo.
echo Testing completed. Check the results above.
pause