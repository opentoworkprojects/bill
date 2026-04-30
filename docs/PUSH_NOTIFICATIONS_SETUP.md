# Push Notifications Setup Guide

This guide explains how to set up **real push notifications** like WhatsApp/Zomato that work even when the app is completely closed.

## Overview

We use **Firebase Cloud Messaging (FCM)** for push notifications. This is the same technology used by WhatsApp, Zomato, Swiggy, etc.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: `billbytekot` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create Project"

## Step 2: Add Android App to Firebase

1. In Firebase Console, click the Android icon to add an Android app
2. Enter package name: `in.billbytekot.twa`
3. Enter app nickname: `BillByteKOT`
4. Click "Register App"
5. Download `google-services.json`
6. Place it in `frontend/billbytekot/app/` folder

## Step 3: Get Firebase Server Credentials

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. Click **Generate new private key**
4. Download the JSON file
5. Open the JSON and copy these values to your backend `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## Step 4: Get Web Push Certificate (VAPID Key)

1. In Firebase Console, go to **Project Settings**
2. Go to **Cloud Messaging** tab
3. Under "Web Push certificates", click **Generate key pair**
4. Copy the key and add to frontend environment:

```env
REACT_APP_FIREBASE_VAPID_KEY=your-vapid-key
```

## Step 5: Add Firebase Web Config

1. In Firebase Console, go to **Project Settings**
2. Under "Your apps", click the web icon `</>` to add a web app
3. Register app with nickname: `BillByteKOT Web`
4. Copy the config and add to frontend `.env`:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## Step 6: Rebuild TWA App

After adding `google-services.json`:

```bash
cd frontend/billbytekot
bubblewrap build
```

This will create a new APK with Firebase support.

## Step 7: Deploy Backend

Make sure your backend has the Firebase credentials in `.env` and redeploy.

## Using Push Notifications

### From Super Admin Panel

1. Go to `/ops` (Super Admin Panel)
2. Navigate to **Notifications** tab
3. Fill in notification details:
   - Title: "🎉 Special Offer!"
   - Message: "Get 50% off on your subscription today!"
   - Type: Promo
4. Click **Send Push + In-App Notification**

### API Endpoints

- `POST /api/fcm/register` - Register device for push notifications
- `POST /api/fcm/send` - Send push to all devices (Super Admin)
- `GET /api/fcm/stats` - Get push notification statistics

## How It Works

1. When user installs the app and allows notifications, their FCM token is registered
2. When you send a notification from Super Admin, it goes to Firebase
3. Firebase delivers the notification to all registered devices
4. Notification appears in the phone's notification tray (even if app is closed!)
5. User taps notification → App opens

## Troubleshooting

### Notifications not appearing?

1. Check if Firebase is configured: `GET /api/fcm/stats` should show `firebase_configured: true`
2. Check if devices are registered: Look at `active_devices` count
3. Make sure app has notification permission enabled in phone settings

### Token registration failing?

1. Check if `google-services.json` is in the correct location
2. Rebuild the TWA app after adding the file
3. Check browser console for errors

## Testing

1. Install the app on your phone
2. Allow notifications when prompted
3. Go to Super Admin → Notifications
4. Send a test notification
5. You should see it appear in your phone's notification tray!

## Notes

- Push notifications work on Android TWA apps
- iOS requires a native app with APNs (Apple Push Notification service)
- Web browsers also support FCM but with limitations
