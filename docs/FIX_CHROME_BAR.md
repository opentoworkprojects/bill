# Fix "Running in Chrome" Bar in TWA App

The "Running in Chrome" notification bar appears when Android cannot verify that your website and app are owned by the same developer.

## Why It Happens

1. **Digital Asset Links not verified** - The `assetlinks.json` file is not accessible or has wrong fingerprint
2. **Fingerprint mismatch** - The SHA256 fingerprint in `assetlinks.json` doesn't match your APK signing key
3. **Cache issues** - Android cached an old verification result

## How to Fix

### Step 1: Get Your Correct SHA256 Fingerprint

Run this command in your `frontend/billbytekot` folder:

```bash
keytool -list -v -keystore android.keystore -alias android
```

Enter your keystore password when prompted. Look for the SHA256 fingerprint:
```
SHA256: 3A:B4:A6:42:B5:C0:7E:C8:1C:7F:E4:6A:19:2D:AF:D4:3A:4C:1C:12:52:54:F5:89:DB:C6:09:4E:66:40:34:97
```

### Step 2: Update assetlinks.json

Edit `frontend/public/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "in.billbytekot.twa",
      "sha256_cert_fingerprints": [
        "YOUR_SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

### Step 3: Deploy and Verify

1. Deploy the updated `assetlinks.json` to your website
2. Verify it's accessible: https://billbytekot.in/.well-known/assetlinks.json
3. Use Google's verification tool: https://developers.google.com/digital-asset-links/tools/generator

### Step 4: Clear Android Cache

On your Android device:
1. Go to Settings > Apps > Chrome
2. Clear Cache and Clear Data
3. Or uninstall and reinstall your TWA app

### Step 5: Rebuild APK (if needed)

If you changed the keystore or signing key:

```bash
cd frontend/billbytekot
bubblewrap build
```

## Verification Checklist

- [ ] `assetlinks.json` is accessible at `https://billbytekot.in/.well-known/assetlinks.json`
- [ ] Content-Type header is `application/json`
- [ ] SHA256 fingerprint matches your keystore
- [ ] Package name is `in.billbytekot.twa`
- [ ] No CORS issues (Access-Control-Allow-Origin: *)

## Common Issues

### 1. File Not Found (404)
Make sure the file is in `frontend/public/.well-known/assetlinks.json` and your hosting serves it correctly.

### 2. Wrong Content-Type
The server must return `Content-Type: application/json`. Check your `vercel.json` headers.

### 3. Multiple Fingerprints
If you have debug and release keys, add both fingerprints to the array.

### 4. Redirect Issues
Make sure `https://billbytekot.in/.well-known/assetlinks.json` doesn't redirect to another URL.

## Testing

Use this command to test:
```bash
curl -I https://billbytekot.in/.well-known/assetlinks.json
```

Expected response:
```
HTTP/2 200
content-type: application/json
access-control-allow-origin: *
```

## Note

The "Running in Chrome" bar will disappear once Android successfully verifies the digital asset links. This verification happens:
- When the app is first installed
- When Chrome's cache is cleared
- Periodically in the background

After fixing, you may need to:
1. Uninstall the app
2. Clear Chrome data
3. Reinstall the app
