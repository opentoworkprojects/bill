#!/bin/bash

echo "========================================"
echo " Building BillByteKOT Android APK"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "[ERROR] Java JDK is not installed!"
    echo "Please install JDK from: https://adoptium.net/"
    exit 1
fi

# Check if Bubblewrap is installed
if ! command -v bubblewrap &> /dev/null; then
    echo "[INFO] Bubblewrap not found. Installing..."
    npm install -g @bubblewrap/cli
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install Bubblewrap"
        exit 1
    fi
    echo "[SUCCESS] Bubblewrap installed!"
    echo ""
fi

# Create android-app directory if not exists
if [ ! -d "android-app" ]; then
    echo "[INFO] Creating android-app directory..."
    mkdir android-app
    cd android-app
    
    echo ""
    echo "========================================"
    echo " Initializing Bubblewrap Project"
    echo "========================================"
    echo ""
    echo "Please answer the following questions:"
    echo ""
    
    bubblewrap init --manifest https://billbytekot.in/manifest.json
    
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to initialize Bubblewrap"
        cd ..
        exit 1
    fi
    
    cd ..
fi

# Build the APK
echo ""
echo "========================================"
echo " Building Android APK"
echo "========================================"
echo ""

cd android-app
bubblewrap build

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Build failed!"
    cd ..
    exit 1
fi

cd ..

echo ""
echo "========================================"
echo " Build Complete!"
echo "========================================"
echo ""
echo "APK Location: android-app/app/build/outputs/apk/release/"
echo ""
echo "Next Steps:"
echo "1. Test APK on Android device"
echo "2. Upload to Google Play Console"
echo "3. Submit for review"
echo ""

# Open output folder (Mac only)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Opening output folder..."
    open android-app/app/build/outputs/apk/release/
fi

echo "Done!"
