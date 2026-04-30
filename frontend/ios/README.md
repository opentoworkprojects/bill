# BillByteKOT iOS App

## Option 1: PWA (Recommended - No App Store Required)

iOS users can install BillByteKOT as a Progressive Web App (PWA):

1. Open Safari on iPhone/iPad
2. Go to https://billbytekot.in
3. Tap the Share button (square with arrow)
4. Tap "Add to Home Screen"
5. Name it "BillByteKOT" and tap "Add"

The app will appear on the home screen with full-screen experience.

## Option 2: Native iOS App (Requires Apple Developer Account - $99/year)

To create a native iOS app, you need:
- Mac computer with Xcode
- Apple Developer Account ($99/year)
- iOS Distribution Certificate
- App Store Connect access

### Using Capacitor (Recommended for Native)

```bash
# Install Capacitor
npm install @capacitor/core @capacitor/ios

# Initialize Capacitor
npx cap init BillByteKOT in.billbytekot.app

# Add iOS platform
npx cap add ios

# Build the web app
npm run build

# Sync with iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

### iOS App Configuration

**Bundle ID:** `in.billbytekot.app`
**App Name:** BillByteKOT
**Display Name:** BillByteKOT

### Apple App Site Association (AASA)

For Universal Links (deep linking), create `/.well-known/apple-app-site-association`:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.in.billbytekot.app",
        "paths": ["*"]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAM_ID.in.billbytekot.app"]
  }
}
```

Replace `TEAM_ID` with your Apple Developer Team ID.

## PWA Features Already Configured

The web app already has:
- ✅ Web App Manifest (`/manifest.json`)
- ✅ Service Worker for offline support
- ✅ iOS meta tags for full-screen experience
- ✅ Apple touch icons
- ✅ Splash screens

## App Store Submission Requirements

If submitting to App Store:
1. App icons (1024x1024 for App Store)
2. Screenshots for different device sizes
3. Privacy Policy URL
4. App description and keywords
5. Age rating questionnaire
6. Export compliance information
