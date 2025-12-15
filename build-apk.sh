#!/bin/bash

echo "========================================"
echo "Building BillByteKOT Android App"
echo "========================================"
echo ""

echo "Step 1: Navigating to Android project..."
cd frontend/billbytekot || {
    echo "ERROR: Could not find frontend/billbytekot directory"
    exit 1
}

echo ""
echo "Step 2: Cleaning previous builds..."
./gradlew clean || {
    echo "ERROR: Clean failed"
    exit 1
}

echo ""
echo "Step 3: Building Android App Bundle (AAB)..."
./gradlew bundleRelease || {
    echo "ERROR: Build failed"
    exit 1
}

echo ""
echo "========================================"
echo "BUILD SUCCESSFUL!"
echo "========================================"
echo ""
echo "AAB Location:"
echo "app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "Next Steps:"
echo "1. Upload app-release.aab to Google Play Console"
echo "2. Go to: https://play.google.com/console"
echo "3. Select your app and create a new release"
echo "4. Upload the AAB file"
echo ""
echo "Version: 12 (versionCode 12)"
echo ""
