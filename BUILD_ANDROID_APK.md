# 📱 Build Android APK with Bubblewrap

## Complete guide to create Android app from your web app

---

## 🚀 What is Bubblewrap?

Bubblewrap is Google's official tool to create **Trusted Web Activities (TWA)** - native Android apps that wrap your Progressive Web App (PWA).

### Benefits:
- ✅ **Native Android app** from your web app
- ✅ **No code changes** needed
- ✅ **Full screen** experience (no browser UI)
- ✅ **Play Store ready**
- ✅ **Auto-updates** with your website
- ✅ **Small APK size** (~1-2MB)

---

## 📋 Prerequisites

### 1. Install Node.js
```bash
# Check if installed
node --version
npm --version

# If not installed, download from: https://nodejs.org/
```

### 2. Install Java Development Kit (JDK)
```bash
# Download JDK 11 or higher from:
# https://adoptium.net/

# Verify installation
java -version
```

### 3. Install Android SDK
```bash
# Option A: Install Android Studio (Recommended)
# Download from: https://developer.android.com/studio

# Option B: Install command-line tools only
# Download from: https://developer.android.com/studio#command-tools
```

### 4. Set Environment Variables

**Windows:**
```cmd
# Add to System Environment Variables:
JAVA_HOME=C:\Program Files\Java\jdk-11
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk

# Add to PATH:
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

**Mac/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc:
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools
```

---

## 🔧 Step 1: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

**Verify installation:**
```bash
bubblewrap --version
```

---

## 🎯 Step 2: Prepare Your Web App

### Create manifest.json (if not exists)

**Location:** `frontend/public/manifest.json`

```json
{
  "name": "BillByteKOT - Restaurant Billing & KOT",
  "short_name": "BillByteKOT",
  "description": "AI-powered restaurant billing, KOT, and inventory management system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8b5cf6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Create Icons

**Required sizes:**
- 192x192 pixels → `frontend/public/icon-192.png`
- 512x512 pixels → `frontend/public/icon-512.png`

**Quick way to create icons:**
1. Use your logo
2. Go to: https://realfavicongenerator.net/
3. Upload logo
4. Download icons
5. Rename to `icon-192.png` and `icon-512.png`

---

## 🏗️ Step 3: Initialize Bubblewrap Project

### Create a new directory for Android build:
```bash
mkdir android-app
cd android-app
```

### Initialize Bubblewrap:
```bash
bubblewrap init --manifest https://billbytekot.in/manifest.json
```

### Answer the prompts:

```
? Domain being opened in the TWA: billbytekot.in
? Name of the application: BillByteKOT
? Short name for the application: BillByteKOT
? Application ID: in.billbytekot.app
? Display mode: standalone
? Orientation: portrait
? Theme color: #8b5cf6
? Background color: #ffffff
? Icon URL: https://billbytekot.in/icon-512.png
? Maskable icon URL: https://billbytekot.in/icon-512.png
? Splash screen color: #8b5cf6
? Fallback behavior: customtabs
? Enable notifications: Yes
? Features: location, camera
? Signing key: Create new
? Key alias: billbytekot
? Key password: [enter secure password]
? Key store password: [enter secure password]
```

---

## 🔐 Step 4: Generate Signing Key

Bubblewrap will create a signing key automatically, or you can create one manually:

```bash
keytool -genkey -v -keystore billbytekot.keystore -alias billbytekot -keyalg RSA -keysize 2048 -validity 10000
```

**Important:** Save the keystore file and passwords securely!

---

## 🔗 Step 5: Setup Digital Asset Links

### Generate SHA-256 fingerprint:
```bash
keytool -list -v -keystore billbytekot.keystore -alias billbytekot
```

**Copy the SHA-256 fingerprint** (looks like: `AA:BB:CC:DD:...`)

### Create assetlinks.json:

**Location:** `frontend/public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "in.billbytekot.app",
      "sha256_cert_fingerprints": [
        "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
      ]
    }
  }
]
```

**Replace the fingerprint with your actual SHA-256 fingerprint!**

### Verify assetlinks.json is accessible:
```
https://billbytekot.in/.well-known/assetlinks.json
```

---

## 🏗️ Step 6: Build the APK

### Build debug APK (for testing):
```bash
bubblewrap build
```

**Output:** `app-release-unsigned.apk` or `app-debug.apk`

### Build release APK (for Play Store):
```bash
bubblewrap build --release
```

**Output:** `app-release-signed.apk`

---

## 📦 Step 7: Test the APK

### Install on Android device:

**Option A: USB Connection**
```bash
# Enable USB debugging on your Android device
# Connect device via USB
adb install app-release-signed.apk
```

**Option B: Share APK file**
1. Copy APK to your phone
2. Open file manager
3. Tap APK file
4. Allow "Install from unknown sources"
5. Install

### Test checklist:
- [ ] App opens in full screen
- [ ] No browser UI visible
- [ ] Login works
- [ ] All features work
- [ ] Offline mode works (if PWA)
- [ ] Notifications work (if enabled)
- [ ] Back button works correctly

---

## 🎨 Step 8: Customize App (Optional)

### Update app colors:

**Edit:** `android-app/twa-manifest.json`

```json
{
  "themeColor": "#8b5cf6",
  "backgroundColor": "#ffffff",
  "splashScreenFadeOutDuration": 300
}
```

### Update app name:

**Edit:** `android-app/app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="app_name">BillByteKOT</string>
    <string name="app_short_name">BillByteKOT</string>
</resources>
```

### Rebuild after changes:
```bash
bubblewrap build
```

---

## 🚀 Step 9: Publish to Google Play Store

### 1. Create Google Play Console Account
- Go to: https://play.google.com/console
- Pay one-time fee: $25
- Complete registration

### 2. Create New App
- Click "Create app"
- Fill in app details:
  - App name: BillByteKOT
  - Default language: English
  - App type: App
  - Category: Business
  - Free/Paid: Free

### 3. Upload APK
- Go to "Release" → "Production"
- Click "Create new release"
- Upload `app-release-signed.apk`
- Add release notes

### 4. Complete Store Listing
**Required:**
- App name: BillByteKOT
- Short description (80 chars):
  ```
  AI-powered restaurant billing, KOT & inventory management. Free 7-day trial!
  ```
- Full description (4000 chars):
  ```
  BillByteKOT is the complete restaurant management solution with AI-powered features:

  🍽️ RESTAURANT FEATURES:
  • Smart menu management with categories
  • Kitchen Order Ticket (KOT) system
  • Table management with auto-clearance
  • Order tracking and status updates
  • Kitchen display system

  💰 BILLING & PAYMENTS:
  • Fast billing with thermal printer support
  • Multiple payment methods (Cash, Card, UPI)
  • Razorpay integration
  • PDF invoice generation
  • GST compliant billing

  📊 BUSINESS INSIGHTS:
  • Real-time sales analytics
  • Daily/weekly/monthly reports
  • Top-selling items analysis
  • Revenue tracking
  • Customer analytics

  📦 INVENTORY MANAGEMENT:
  • Auto-update stock levels
  • Low stock alerts
  • Supplier management
  • Bulk CSV import

  👥 STAFF MANAGEMENT:
  • Role-based access (Admin, Cashier, Waiter, Kitchen)
  • Staff performance tracking
  • Secure login system

  🎯 WHY CHOOSE BILLBYTEKOT?
  • 7-day free trial with all features
  • Only ₹499/year after trial
  • Works offline
  • Multi-currency support
  • 4 thermal printer themes
  • No hidden costs

  🚀 GET STARTED:
  1. Install the app
  2. Create your account
  3. Add your menu
  4. Start billing!

  Perfect for: Restaurants, Cafes, Food Trucks, Cloud Kitchens, Bakeries

  Try BillByteKOT today and transform your restaurant operations!
  ```

- Screenshots (2-8 required):
  - Dashboard
  - Menu page
  - Billing page
  - Reports page
  - Kitchen display
  - Mobile view

- Feature graphic (1024x500):
  - Create promotional banner

- App icon (512x512):
  - Your app icon

- Category: Business
- Contact email: support@billbytekot.in
- Privacy policy URL: https://billbytekot.in/privacy

### 5. Content Rating
- Complete questionnaire
- Get rating (likely: Everyone)

### 6. Pricing & Distribution
- Free app
- Available in: India (or worldwide)
- Content guidelines: Accept

### 7. Submit for Review
- Review all sections
- Click "Submit for review"
- Wait 1-7 days for approval

---

## 📱 Alternative: Quick APK Build Script

Create `build-android.sh`:

```bash
#!/bin/bash

echo "🚀 Building BillByteKOT Android APK..."

# Check if bubblewrap is installed
if ! command -v bubblewrap &> /dev/null; then
    echo "❌ Bubblewrap not installed. Installing..."
    npm install -g @bubblewrap/cli
fi

# Create android-app directory if not exists
if [ ! -d "android-app" ]; then
    echo "📁 Creating android-app directory..."
    mkdir android-app
    cd android-app
    
    echo "🔧 Initializing Bubblewrap..."
    bubblewrap init --manifest https://billbytekot.in/manifest.json
else
    cd android-app
fi

# Build APK
echo "🏗️ Building APK..."
bubblewrap build

echo "✅ APK built successfully!"
echo "📦 Location: android-app/app/build/outputs/apk/release/"
echo ""
echo "📱 Next steps:"
echo "1. Test APK on Android device"
echo "2. Upload to Google Play Console"
echo "3. Submit for review"
```

**Make executable:**
```bash
chmod +x build-android.sh
```

**Run:**
```bash
./build-android.sh
```

---

## 🐛 Troubleshooting

### Error: "JAVA_HOME not set"
```bash
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-11

# Mac/Linux
export JAVA_HOME=/Library/Java/JavaVirtualMachines/jdk-11.jdk/Contents/Home
```

### Error: "Android SDK not found"
```bash
# Windows
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### Error: "Manifest not found"
- Ensure manifest.json is accessible at: https://billbytekot.in/manifest.json
- Check CORS headers allow access
- Verify JSON is valid

### Error: "Icon not found"
- Ensure icons exist at specified URLs
- Check file sizes (192x192 and 512x512)
- Verify PNG format

### Error: "Digital Asset Links verification failed"
- Check assetlinks.json is accessible
- Verify SHA-256 fingerprint is correct
- Ensure package name matches

---

## 📊 APK Size Optimization

### Reduce APK size:

1. **Enable ProGuard** (code shrinking):
   ```gradle
   buildTypes {
       release {
           minifyEnabled true
           shrinkResources true
       }
   }
   ```

2. **Use WebP images** instead of PNG
3. **Remove unused resources**
4. **Enable app bundle** (AAB instead of APK)

### Build App Bundle (recommended for Play Store):
```bash
bubblewrap build --release --bundletool
```

**Output:** `app-release.aab` (smaller than APK)

---

## 🎯 Best Practices

### 1. Version Management
- Update version in `twa-manifest.json`
- Follow semantic versioning (1.0.0, 1.0.1, etc.)
- Keep changelog

### 2. Testing
- Test on multiple Android versions
- Test on different screen sizes
- Test offline functionality
- Test deep links

### 3. Updates
- App auto-updates when website updates
- No need to publish new APK for web changes
- Only rebuild for native changes

### 4. Performance
- Optimize web app for mobile
- Use service worker for offline
- Minimize JavaScript bundle
- Optimize images

---

## 📋 Checklist

### Before Building:
- [ ] manifest.json created and accessible
- [ ] Icons created (192x192, 512x512)
- [ ] assetlinks.json created
- [ ] SHA-256 fingerprint added
- [ ] Web app works on mobile
- [ ] HTTPS enabled

### After Building:
- [ ] APK tested on device
- [ ] All features work
- [ ] No browser UI visible
- [ ] Deep links work
- [ ] Notifications work (if enabled)

### Before Publishing:
- [ ] Play Console account created
- [ ] Screenshots prepared
- [ ] Feature graphic created
- [ ] Description written
- [ ] Privacy policy published
- [ ] Content rating completed

---

## 💰 Costs

### One-time:
- Google Play Console: $25 (lifetime)

### Recurring:
- None! (unless you use paid services)

---

## 🎉 Summary

### What You Get:
- ✅ Native Android app
- ✅ Full screen experience
- ✅ Play Store ready
- ✅ Auto-updates with website
- ✅ Small APK size (~1-2MB)
- ✅ No code changes needed

### Time Required:
- Setup: 30 minutes
- Build: 5 minutes
- Test: 15 minutes
- Publish: 1 hour
- **Total: ~2 hours**

### Commands Summary:
```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize project
bubblewrap init --manifest https://billbytekot.in/manifest.json

# Build APK
bubblewrap build

# Install on device
adb install app-release-signed.apk
```

---

**Status:** ✅ GUIDE COMPLETE

**Difficulty:** ⭐⭐⭐ (Medium)

**Time:** ~2 hours

**Last Updated:** December 11, 2024

**Ready to build your Android app! 📱**
