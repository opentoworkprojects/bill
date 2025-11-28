#!/bin/bash

echo "========================================"
echo "   RestoBill Desktop App Builder"
echo "   by FinVerge Tech (finverge.tech)"
echo "========================================"
echo ""
echo "Production URL: https://finverge.tech"
echo "Backend URL: https://restro-ai.onrender.com"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies!"
        exit 1
    fi
fi

echo ""
echo "Select build option:"
echo "[1] Build for current platform"
echo "[2] Build for macOS"
echo "[3] Build for Linux"
echo "[4] Build for Windows (requires Wine on non-Windows)"
echo "[5] Run in development mode"
echo "[6] Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "Building RestoBill for current platform..."
        echo "App will load from finverge.tech"
        npm run electron:build
        if [ $? -eq 0 ]; then
            echo ""
            echo "========================================"
            echo "SUCCESS! Build complete."
            echo "========================================"
            echo "Output: dist-electron/"
        else
            echo "ERROR: Build failed!"
        fi
        ;;
    2)
        echo ""
        echo "Building RestoBill for macOS..."
        npm run electron:build:mac
        if [ $? -eq 0 ]; then
            echo ""
            echo "========================================"
            echo "SUCCESS! macOS build complete."
            echo "========================================"
            echo "Output: dist-electron/RestoBill-1.0.0-mac.dmg"
        else
            echo "ERROR: Build failed!"
        fi
        ;;
    3)
        echo ""
        echo "Building RestoBill for Linux..."
        npm run electron:build:linux
        if [ $? -eq 0 ]; then
            echo ""
            echo "========================================"
            echo "SUCCESS! Linux build complete."
            echo "========================================"
            echo "Output: dist-electron/RestoBill-1.0.0-linux.AppImage"
        else
            echo "ERROR: Build failed!"
        fi
        ;;
    4)
        echo ""
        echo "Building RestoBill for Windows..."
        echo "NOTE: Building for Windows on non-Windows requires Wine"
        npm run electron:build:win
        if [ $? -eq 0 ]; then
            echo ""
            echo "========================================"
            echo "SUCCESS! Windows build complete."
            echo "========================================"
            echo "Output: dist-electron/RestoBill-1.0.0-win-x64.exe"
        else
            echo "ERROR: Build failed!"
        fi
        ;;
    5)
        echo ""
        echo "Starting development mode..."
        echo "React will run on localhost:3000"
        npm run electron:dev
        ;;
    6)
        exit 0
        ;;
    *)
        echo "Invalid choice!"
        ;;
esac

echo ""
