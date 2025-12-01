# WhatsApp Integration Setup Guide

## ⚠️ IMPORTANT: Install Latest Version

You need **BillByteKOT v1.1.0** to access WhatsApp Pro features.

### Step 1: Uninstall Old Version
1. Close BillByteKOT app completely
2. Go to Windows Settings → Apps
3. Find "BillByteKOT" and click Uninstall
4. Wait for uninstall to complete

### Step 2: Install New Version
1. Locate `BillByteKOT-Setup-1.1.0-win.exe` in `frontend/dist-electron/`
2. Double-click to install
3. Follow installation wizard
4. Launch BillByteKOT

### Step 3: Access WhatsApp Pro
1. Login to BillByteKOT
2. Go to **Settings** (left sidebar)
3. Look for tabs at the top:
   - Business Details
   - Print Customization
   - **WhatsApp** (basic)
   - Payment
   - Zomato/Swiggy
   - **WhatsApp Pro** ← Click this tab!

### Step 4: Login to WhatsApp
1. In WhatsApp Pro tab, you'll see:
   - Connection Status card
   - Green button: **"Login to WhatsApp"**
2. Click "Login to WhatsApp"
3. WhatsApp Web opens inside the app
4. Scan QR code with your phone
5. You're logged in permanently!

## Features You'll Get:

### ✅ Connection Status
- Shows if WhatsApp is connected
- Real-time status updates

### ✅ Single Messages
- Send WhatsApp messages to customers
- Quick message templates
- Direct integration

### ✅ Bulk Messages
- Send to multiple contacts at once
- Personalize with {name} variable
- Progress tracking

### ✅ Templates
- Pre-built message templates
- Order confirmations
- Delivery updates
- Feedback requests

## Troubleshooting

### "I don't see WhatsApp Pro tab"
- You're running an old version
- Uninstall and install v1.1.0

### "I only see phone number input"
- The app is not detecting Electron mode
- Press F12 to open DevTools
- Check console for: `WhatsApp Desktop - isElectron: true`
- If false, reinstall the app

### "Login button doesn't work"
- Check your internet connection
- Try closing and reopening the app
- Check DevTools console for errors

## Version Check
Current version should show: **v1.1.0**
Check in: Settings → About or Help menu

---

**Need Help?**
- Email: support@finverge.tech
- Check console logs (F12) for debug info
