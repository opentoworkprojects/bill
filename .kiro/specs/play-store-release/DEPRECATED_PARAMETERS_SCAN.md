# Deprecated Window Configuration Parameters Scan Report

**Date:** 2024
**Task:** 1.2 - Remove deprecated edge-to-edge parameters
**Spec:** play-store-release

## Executive Summary

Scan completed for deprecated window configuration parameters in the BillByteKOT Android application. Found **1 deprecated parameter** used in theme files that may cause Play Store warnings.

## Scan Results

### ✅ AndroidManifest.xml
**Location:** `frontend/billbytekot/app/src/main/AndroidManifest.xml`

**Status:** CLEAN - No deprecated window configuration parameters found directly in manifest

**Analysis:**
- No `android:windowLayoutInDisplayCutoutMode` attribute in `<application>` or `<activity>` tags
- Uses theme reference: `android:theme="@style/Theme.EdgeToEdge"` (lines 95, 184)
- Properly configured `android:resizeableActivity="true"` for large screen support (line 60)
- Includes `supports-screens` configuration for multi-device support (lines 38-44)

### ⚠️ Theme Files - DEPRECATED PARAMETERS FOUND

#### 1. Base Theme (All Android Versions)
**Location:** `frontend/billbytekot/app/src/main/res/values/themes.xml`

**Deprecated Parameter Found:**
```xml
<item name="android:windowLayoutInDisplayCutoutMode" tools:targetApi="p">shortEdges</item>
```

**Line:** 7
**Severity:** WARNING
**Impact:** May cause Play Store warnings about deprecated edge-to-edge APIs

#### 2. Android 15+ Theme
**Location:** `frontend/billbytekot/app/src/main/res/values-v35/themes.xml`

**Deprecated Parameter Found:**
```xml
<item name="android:windowLayoutInDisplayCutoutMode">always</item>
```

**Line:** 7
**Severity:** WARNING
**Impact:** May cause Play Store warnings about deprecated edge-to-edge APIs

## Detailed Findings

### Deprecated Parameter: `android:windowLayoutInDisplayCutoutMode`

**What it is:**
- A window configuration parameter introduced in Android P (API 28)
- Controls how the app window interacts with display cutouts (notches)
- Values: `default`, `shortEdges`, `never`, `always`

**Why it's deprecated:**
- Android 15+ (API 35) introduced native edge-to-edge enforcement
- Modern apps should use `WindowCompat.setDecorFitsSystemWindows()` in code
- The parameter is being phased out in favor of programmatic control
- Play Store may flag this as using deprecated APIs

**Current Usage:**
1. **Base theme** (`values/themes.xml`): Uses `shortEdges` value
2. **Android 15+ theme** (`values-v35/themes.xml`): Uses `always` value

### Other Window Parameters (Not Deprecated)

The following parameters found in theme files are **NOT deprecated** and are acceptable:

✅ `android:statusBarColor` - Still valid for controlling status bar color
✅ `android:navigationBarColor` - Still valid for controlling navigation bar color
✅ `android:enforceNavigationBarContrast` - Still valid for contrast enforcement
✅ `android:enforceStatusBarContrast` - Still valid for contrast enforcement
✅ `android:windowOptOutEdgeToEdgeEnforcement` - New Android 15+ parameter (not deprecated)

## Recommendations

### Option 1: Remove Deprecated Parameter (Recommended)

**For TWA apps**, edge-to-edge is primarily handled by the web content using CSS:
```css
viewport-fit=cover
```

**Action:**
1. Remove `android:windowLayoutInDisplayCutoutMode` from both theme files
2. Keep other window parameters (statusBarColor, navigationBarColor, etc.)
3. Rely on web content CSS for edge-to-edge handling
4. Test on devices with display cutouts to ensure proper rendering

**Files to modify:**
- `frontend/billbytekot/app/src/main/res/values/themes.xml` (remove line 7)
- `frontend/billbytekot/app/src/main/res/values-v35/themes.xml` (remove line 7)

### Option 2: Use Modern Programmatic Approach

If custom native UI requires edge-to-edge control:

**Action:**
1. Remove `android:windowLayoutInDisplayCutoutMode` from theme files
2. Add programmatic control in `LauncherActivity`:
```kotlin
import androidx.core.view.WindowCompat

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // Modern edge-to-edge API
    WindowCompat.setDecorFitsSystemWindows(window, false)
}
```

### Option 3: Keep for Backward Compatibility (Not Recommended)

**Risk:** May continue to generate Play Store warnings
**Benefit:** Ensures consistent behavior on older Android versions

## Impact Assessment

### Play Store Submission
- **Current Risk:** LOW to MEDIUM
- **Warning Likelihood:** Possible warning about deprecated APIs
- **Rejection Likelihood:** LOW (warnings typically don't block submission)
- **Future Risk:** MEDIUM (Google may enforce stricter policies)

### App Functionality
- **Removing Parameter Impact:** MINIMAL
- **Reason:** TWA apps rely on web content for edge-to-edge
- **Testing Required:** Verify on devices with display cutouts (notches)

### Device Compatibility
- **Android 15+ (API 35):** Native edge-to-edge handling works regardless
- **Android 9-14 (API 28-34):** May need testing after removal
- **Android 8 and below (API 27-):** Parameter not used anyway

## Testing Checklist

After removing deprecated parameters:

- [ ] Build APK/AAB successfully
- [ ] Test on phone with notch (Android 9-14)
- [ ] Test on phone without notch
- [ ] Test on Android 15+ device
- [ ] Verify web content displays edge-to-edge correctly
- [ ] Check status bar and navigation bar transparency
- [ ] Upload to Play Console internal testing track
- [ ] Verify no warnings about deprecated APIs

## Next Steps

1. **Review this report** with the development team
2. **Decide on approach** (Option 1 recommended for TWA apps)
3. **Proceed to subtask 1.2.2**: Remove `android:windowLayoutInDisplayCutoutMode`
4. **Test thoroughly** on multiple devices and Android versions
5. **Verify manifest validity** after changes
6. **Update documentation** with changes made

## References

- [Android Edge-to-Edge Documentation](https://developer.android.com/develop/ui/views/layout/edge-to-edge)
- [Display Cutout Support](https://developer.android.com/develop/ui/views/layout/display-cutout)
- [WindowCompat API](https://developer.android.com/reference/androidx/core/view/WindowCompat)
- Play Store Release Spec: `.kiro/specs/play-store-release/`

## Scan Metadata

- **Scan Method:** Manual XML parsing and grep search
- **Files Scanned:** 3 (AndroidManifest.xml, 2 theme files)
- **Deprecated Parameters Found:** 1 type (`windowLayoutInDisplayCutoutMode`)
- **Occurrences:** 2 (one in each theme file)
- **Severity:** WARNING (not blocking, but should be addressed)
