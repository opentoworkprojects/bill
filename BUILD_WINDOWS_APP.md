# 🪟 Build Windows Desktop App

## Complete guide to build and distribute BillByteKOT Windows app

---

## 🚀 Quick Build

### Step 1: Build the App
```bash
cd frontend
npm install
npm run electron:build:win
```

### Step 2: Find the Output
```
Location: frontend/dist-electron/
Files created:
- BillByteKOT-Setup-1.0.0.exe (Installer)
- BillByteKOT-1.0.0-win.exe (Portable)
```

---

## 📦 Distribution Options

### Option 1: GitHub Releases (Recommended - Free)

**Steps:**
1. Go to your GitHub repository
2. Click "Releases" → "Create a new release"
3. Tag: `v1.0.0`
4. Title: `BillByteKOT v1.0.0 - Windows Desktop App`
5. Upload the `.exe` files
6. Publish release

**Download URL:**
```
https://github.com/YOUR_USERNAME/billbytekot/releases/download/v1.0.0/BillByteKOT-Setup-1.0.0.exe
```

### Option 2: Google Drive (Easy)

**Steps:**
1. Upload `.exe` to Google Drive
2. Right-click → Get link
3. Change to "Anyone with the link"
4. Copy the link

**Make it direct download:**
```
Original: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
Direct: https://drive.google.com/uc?export=download&id=FILE_ID
```

### Option 3: Dropbox (Easy)

**Steps:**
1. Upload to Dropbox
2. Get shareable link
3. Change `?dl=0` to `?dl=1` for direct download

### Option 4: Host on Your Server

**Upload to:**
```
/var/www/billbytekot.in/public/downloads/
```

**Download URL:**
```
https://billbytekot.in/downloads/BillByteKOT-Setup-1.0.0.exe
```

---

## 🔧 Update Download Links

### In LandingPage.js:
```javascript
const downloadUrls = {
  windows: "https://github.com/YOUR_USERNAME/billbytekot/releases/download/v1.0.0/BillByteKOT-Setup-1.0.0.exe",
  mac: "/download",
  linux: "/download",
};
```

### In DownloadPage.js:
```javascript
const downloadUrls = {
  windows: "https://github.com/YOUR_USERNAME/billbytekot/releases/download/v1.0.0/BillByteKOT-Setup-1.0.0.exe",
  mac: "web",
  linux: "web",
};
```

---

## 📝 Build Script Details

### What it does:
1. Checks Node.js installation
2. Installs dependencies
3. Builds Electron app
4. Creates Windows installer
5. Opens output folder

### Output files:
- **Installer**: Full installation with shortcuts
- **Portable**: Run without installation

---

## 🎯 Recommended Approach

### For Now (Quick):
Use **GitHub Releases** - it's free, reliable, and professional

### Steps:
```bash
# 1. Build the app
cd frontend
npm run electron:build:win

# 2. Create GitHub release
# Go to: https://github.com/YOUR_USERNAME/billbytekot/releases/new

# 3. Upload the .exe file

# 4. Update download links in code
```

---

## ✅ Complete Implementation

I'll update the code to include Windows download option with placeholder URL that you can replace with your actual link.
