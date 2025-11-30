# 🪟 Windows Installation Guide - Bypass SmartScreen

## ⚠️ Windows SmartScreen Warning

When you try to install RestoBill, Windows may show:
```
"Windows protected your PC"
"Microsoft Defender SmartScreen prevented an unrecognized app from starting"
```

**This is NORMAL!** The app is safe but not digitally signed (signing costs $300+/year).

## ✅ How to Install (Bypass SmartScreen):

### Method 1: Click "More Info" → "Run Anyway"

1. Double-click `RestoBill-Setup-1.2.0-win.exe`
2. Windows shows: **"Windows protected your PC"**
3. Click **"More info"** (small text link)
4. Click **"Run anyway"** button
5. Follow installation wizard
6. Done! ✅

### Method 2: Right-Click → Properties → Unblock

1. Right-click `RestoBill-Setup-1.2.0-win.exe`
2. Select **Properties**
3. At the bottom, check **"Unblock"** checkbox
4. Click **Apply** → **OK**
5. Now double-click to install normally

### Method 3: Disable SmartScreen Temporarily

1. Press `Win + I` (Settings)
2. Go to **Privacy & Security** → **Windows Security**
3. Click **App & browser control**
4. Under **Check apps and files**, select **Off** or **Warn**
5. Install RestoBill
6. Turn SmartScreen back **On** after installation

## 🔒 Is It Safe?

**YES!** The app is completely safe. Here's why Windows blocks it:

- ✅ **Not signed** - We don't have a $300/year code signing certificate
- ✅ **New app** - Windows hasn't seen it before
- ✅ **Open source** - You can review all the code
- ✅ **No malware** - Built with Electron (used by VS Code, Slack, Discord)

## 📦 What Gets Installed:

- **Location:** `C:\Users\[YourName]\AppData\Local\Programs\restobill\`
- **Size:** ~200 MB
- **Shortcuts:** Desktop + Start Menu
- **Uninstall:** Windows Settings → Apps → RestoBill

## 🚀 After Installation:

1. Launch RestoBill
2. Login with your credentials
3. Go to **Settings**
4. Look for **"WhatsApp Pro"** tab (6th tab)
5. Click it to access WhatsApp login!

## 🛡️ Antivirus Software:

Some antivirus software may also flag the app:

**Windows Defender:**
- Click "Allow on device" or "More info" → "Run anyway"

**Norton/McAfee/Avast:**
- Add to exclusions/whitelist
- Or temporarily disable during installation

**Kaspersky:**
- Click "More details" → "Run anyway"

## 🔧 Troubleshooting:

### "The app can't run on your PC"
- You need 64-bit Windows 10/11
- Check: Settings → System → About → System type

### "Installation failed"
- Run as Administrator (right-click → Run as administrator)
- Disable antivirus temporarily
- Check disk space (need 500 MB free)

### "App won't start after installation"
- Restart your computer
- Check Windows Defender isn't blocking it
- Reinstall with antivirus disabled

## 📞 Need Help?

- Email: support@finverge.tech
- The app is safe - Windows just doesn't recognize unsigned apps
- Thousands of legitimate apps show this warning

---

**Current Version:** v1.2.0  
**File:** RestoBill-Setup-1.2.0-win.exe  
**Location:** `frontend/dist-electron/`
