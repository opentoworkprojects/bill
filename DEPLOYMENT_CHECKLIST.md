# APK Deployment Checklist - Version 12

## Pre-Build Checklist

- [x] SHA256 fingerprint updated in assetlinks.json files
- [x] Version incremented to 12 in build.gradle
- [x] Build scripts created (build-apk.bat and build-apk.sh)
- [ ] Website assetlinks.json deployed and accessible

## Build Checklist

### Step 1: Verify Website Deployment
```bash
curl https://billbytekot.in/.well-known/assetlinks.json
```
- [ ] Returns correct JSON with SHA256: 3A:B4:A6:42:B5:C0:7E:C8:1C:7F:E4:6A:19:2D:AF:D4:3A:4C:1C:12:52:54:F5:89:DB:C6:09:4E:66:40:34:97
- [ ] No 404 error
- [ ] Proper JSON format

### Step 2: Build the AAB

**Windows:**
```cmd
build-apk.bat
```

**Linux/Mac:**
```bash
chmod +x build-apk.sh
./build-apk.sh
```

**Manual:**
```bash
cd frontend/billbytekot
./gradlew clean bundleRelease
```

- [ ] Build completed successfully
- [ ] No errors in console
- [ ] AAB file generated at: `app/build/outputs/bundle/release/app-release.aab`
- [ ] File size is reasonable (typically 5-20 MB)

### Step 3: Verify AAB File
- [ ] File exists at correct location
- [ ] File size > 0 bytes
- [ ] File is recent (check timestamp)

## Upload Checklist

### Step 1: Access Play Console
- [ ] Go to https://play.google.com/console
- [ ] Login with correct Google account
- [ ] Select BillByteKOT app

### Step 2: Create Release
- [ ] Navigate to Production (or Internal testing for first test)
- [ ] Click "Create new release"
- [ ] Upload app-release.aab
- [ ] Wait for upload to complete (may take 1-5 minutes)

### Step 3: Review Release Details
- [ ] Version shows as 12 (versionCode 12)
- [ ] No critical errors or warnings
- [ ] App bundle explorer shows correct files
- [ ] Size is reasonable

### Step 4: Add Release Notes (Optional)
Example:
```
Version 12 - December 2025
- Fixed Digital Asset Links for seamless app experience
- Updated security certificates
- Performance improvements
```

### Step 5: Submit
- [ ] Click "Review release"
- [ ] Review all details
- [ ] Click "Start rollout to Production" (or Internal testing)
- [ ] Confirm submission

## Post-Upload Checklist

### Step 1: Verify Submission
- [ ] Release status shows "In review" or "Pending publication"
- [ ] No errors in Play Console
- [ ] Email confirmation received from Google

### Step 2: Monitor Review Process
- [ ] Check Play Console daily for status updates
- [ ] Respond to any review feedback promptly
- [ ] Typical review time: 1-3 days

### Step 3: After Approval
- [ ] Release status shows "Available"
- [ ] App version 12 visible in Play Store
- [ ] Download and test on real device

## Testing Checklist (After Approval)

### Step 1: Download from Play Store
- [ ] Search for BillByteKOT in Play Store
- [ ] Download and install
- [ ] Version shows as 12

### Step 2: Test TWA Functionality
- [ ] App opens without URL bar (full screen)
- [ ] No browser chrome visible
- [ ] Looks like native app
- [ ] Status bar color matches theme

### Step 3: Test Core Features
- [ ] Login works
- [ ] Dashboard loads
- [ ] Menu management works
- [ ] Order creation works
- [ ] Billing works
- [ ] Reports load
- [ ] Settings accessible

### Step 4: Test Digital Asset Links
- [ ] Open external link to billbytekot.in
- [ ] Should open in the app (not browser)
- [ ] Deep linking works correctly

## Troubleshooting Checklist

### If URL Bar Still Shows:
- [ ] Clear app data: Settings → Apps → BillByteKOT → Storage → Clear data
- [ ] Uninstall and reinstall from Play Store
- [ ] Wait 24-48 hours for Google verification
- [ ] Verify assetlinks.json is accessible
- [ ] Check SHA256 matches in Play Console

### If Build Fails:
- [ ] Check Java/JDK installed (java -version)
- [ ] Check Android SDK installed
- [ ] Run: ./gradlew --refresh-dependencies
- [ ] Check error messages
- [ ] Try: ./gradlew clean
- [ ] Check internet connection (downloads dependencies)

### If Upload Fails:
- [ ] Check file size (must be < 150 MB)
- [ ] Check version code is higher than previous
- [ ] Check package name matches (in.billbytekot.twa)
- [ ] Check signing key matches previous releases
- [ ] Try uploading again (may be temporary issue)

### If Review Rejected:
- [ ] Read rejection reason carefully
- [ ] Fix issues mentioned
- [ ] Increment version to 13
- [ ] Rebuild and resubmit
- [ ] Respond to reviewer if needed

## Important Notes

⚠️ **CRITICAL:**
1. Always deploy assetlinks.json to website BEFORE uploading app
2. Never change package name after first release
3. Keep signing key secure and backed up
4. Test on Internal Testing track first if unsure
5. Digital Asset Links verification can take 24-48 hours

✅ **BEST PRACTICES:**
1. Use AAB format (not APK) for Play Store
2. Test thoroughly before production release
3. Add meaningful release notes
4. Monitor crash reports after release
5. Respond to user reviews promptly

## Quick Reference

**Package Name:** in.billbytekot.twa
**Version Code:** 12
**Version Name:** "12"
**SHA256:** 3A:B4:A6:42:B5:C0:7E:C8:1C:7F:E4:6A:19:2D:AF:D4:3A:4C:1C:12:52:54:F5:89:DB:C6:09:4E:66:40:34:97

**Build Command:**
```bash
cd frontend/billbytekot && ./gradlew clean bundleRelease
```

**AAB Location:**
```
frontend/billbytekot/app/build/outputs/bundle/release/app-release.aab
```

**Verify Website:**
```bash
curl https://billbytekot.in/.well-known/assetlinks.json
```

**Play Console:**
https://play.google.com/console

## Status Tracking

| Task | Status | Date | Notes |
|------|--------|------|-------|
| Update assetlinks.json | ✅ Done | 2025-12-15 | Both files updated |
| Increment version | ✅ Done | 2025-12-15 | Version 12 |
| Create build scripts | ✅ Done | 2025-12-15 | .bat and .sh |
| Deploy website | ⏳ Pending | - | Deploy to production |
| Build AAB | ⏳ Pending | - | Run build script |
| Upload to Play Console | ⏳ Pending | - | Upload AAB |
| Submit for review | ⏳ Pending | - | Start rollout |
| Approval | ⏳ Pending | - | Wait 1-3 days |
| Test on device | ⏳ Pending | - | After approval |

## Next Action

🎯 **IMMEDIATE NEXT STEP:**
1. Deploy the updated assetlinks.json to your website
2. Verify it's accessible at: https://billbytekot.in/.well-known/assetlinks.json
3. Run the build script: `build-apk.bat` (Windows) or `./build-apk.sh` (Linux/Mac)
4. Upload the generated AAB to Play Console

---

**Last Updated:** December 15, 2025
**Version:** 12
**Status:** Ready for deployment
