@echo off
echo 🚀 Starting Frontend Development Server
echo =====================================

cd frontend

echo 📦 Installing dependencies (if needed)...
call npm install

echo 🌐 Starting React development server...
echo.
echo 💡 The server will start on http://localhost:3000
echo 💡 You can test the print settings at: http://localhost:3000/settings
echo 💡 Press Ctrl+C to stop the server
echo.

call npm start