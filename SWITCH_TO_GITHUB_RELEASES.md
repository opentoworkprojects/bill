# Switch to GitHub Releases for Windows App Download

## Why GitHub Releases?
- ✅ No virus scan warnings
- ✅ No file size limits
- ✅ Fast downloads (GitHub CDN)
- ✅ Professional and trusted
- ✅ Version management built-in
- ✅ No sign-in required

## Steps to Switch

### 1. Make Repository Public
1. Go to: https://github.com/shivshankar9/restro-ai
2. Click **Settings** (top right)
3. Scroll to bottom → **Danger Zone**
4. Click **"Change visibility"**
5. Select **"Make public"**
6. Confirm

### 2. Create a New Release
1. Go to: https://github.com/shivshankar9/restro-ai/releases
2. Click **"Create a new release"**
3. Tag version: `v1.3.0`
4. Release title: `BillByteKOT Desktop v1.3.0`
5. Description:
```markdown
## BillByteKOT Desktop App - Windows

Restaurant billing and KOT management system for Windows.

### Features
- Offline billing
- KOT management
- Inventory tracking
- Reports and analytics

### Installation
1. Download `BillByteKOT-Setup.exe`
2. Run the installer
3. Follow the setup wizard

### System Requirements
- Windows 10 or later
- 4GB RAM minimum
- 500MB disk space
```

6. **Upload file**: Drag `RestoBill-Setup-1.3.0-win.exe` to the upload area
7. Click **"Publish release"**

### 3. Get the Download URL
After publishing, right-click on the file and copy link. It will be:
```
https://github.com/shivshankar9/restro-ai/releases/download/v1.3.0/RestoBill-Setup-1.3.0-win.exe
```

### 4. Update Your Code
I'll update the download links to use GitHub releases.

## Alternative: Keep Repo Private

If you want to keep the repo private, you have these options:

### Option A: Dropbox
1. Upload to Dropbox
2. Get shareable link
3. Change URL format:
   - From: `www.dropbox.com/...?dl=0`
   - To: `dl.dropboxusercontent.com/...?dl=1`

### Option B: Your Own Server
Upload to your backend and serve via:
```
https://your-backend.com/downloads/BillByteKOT-Setup.exe
```

### Option C: Accept Google Drive Warning
Keep current setup - users just click "Download anyway"

## Recommended: GitHub Releases

It's the most professional solution and what most software companies use.
