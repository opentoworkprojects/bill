# AndroidManifest.xml Attributes Documentation

**File Location:** `frontend/billbytekot/app/src/main/AndroidManifest.xml`  
**Documentation Date:** 2024  
**Purpose:** Comprehensive documentation of all attributes and their current values in the BillByteKOT TWA AndroidManifest.xml

---

## Manifest Root Element

### `<manifest>` Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `xmlns:android` | `http://schemas.android.com/apk/res/android` | Android namespace declaration |
| `xmlns:tools` | `http://schemas.android.com/tools` | Tools namespace for build-time directives |
| `package` | `in.billbytekot.twa` | Application package identifier (rewritten by Gradle with applicationId) |

---

## Permissions

### `<uses-permission>` Elements

| Permission | Description |
|------------|-------------|
| `android.permission.POST_NOTIFICATIONS` | Allows app to post notifications (Android 13+) |

---

## Screen Support Configuration

### `<supports-screens>` Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:smallScreens` | `true` | Supports small screen devices |
| `android:normalScreens` | `true` | Supports normal screen devices (phones) |
| `android:largeScreens` | `true` | Supports large screen devices (7" tablets) |
| `android:xlargeScreens` | `true` | Supports extra-large screen devices (10" tablets) |
| `android:anyDensity` | `true` | Supports all screen densities |
| `android:resizeable` | `true` | App can be resized (for multi-window, foldables) |

---

## Application Configuration

### `<application>` Attributes

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `Application` | Custom Application class name |
| `android:allowBackup` | `true` | Allows app data backup |
| `android:icon` | `@mipmap/ic_launcher` | App launcher icon resource |
| `android:label` | `@string/appName` | App display name |
| `android:manageSpaceActivity` | `com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity` | Activity for managing app storage |
| `android:supportsRtl` | `true` | Supports right-to-left layouts |
| `android:theme` | `@android:style/Theme.Translucent.NoTitleBar` | Default app theme |
| `android:resizeableActivity` | `true` | Activities can be resized (multi-window support) |

### Application-Level `<meta-data>` Elements

| Name | Value/Resource | Description |
|------|----------------|-------------|
| `asset_statements` | `@string/assetStatements` | Digital Asset Links for TWA verification |
| `web_manifest_url` | `@string/webManifestUrl` | URL to web app manifest |
| `twa_generator` | `@string/generatorApp` | Tool used to generate TWA |

---

## Activities

### 1. ManageDataLauncherActivity

**Purpose:** Manages app data and storage settings

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity` | Fully qualified class name |
| `android:exported` | `false` | Not accessible to other apps |
| `android:enabled` | `true` | Activity is enabled |
| `android:excludeFromRecents` | `true` | Hidden from recent apps list |

#### Meta-data

| Name | Value | Description |
|------|-------|-------------|
| `android.support.customtabs.trusted.MANAGE_SPACE_URL` | `@string/launchUrl` | URL for managing storage |

#### Intent Filters

- **Action:** `android.intent.action.APPLICATION_PREFERENCES`
- **Category:** `android.intent.category.DEFAULT`

---

### 2. LauncherActivity (Main Activity)

**Purpose:** Main launcher activity for the TWA

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `LauncherActivity` | Activity class name |
| `android:alwaysRetainTaskState` | `true` | Preserves task state across reboots |
| `android:label` | `@string/launcherName` | Activity display name |
| `android:exported` | `true` | Accessible to other apps (required for launcher) |
| `android:theme` | `@style/Theme.EdgeToEdge` | Edge-to-edge display theme |

#### Meta-data Elements

| Name | Value/Resource | Description |
|------|----------------|-------------|
| `android.support.customtabs.trusted.DEFAULT_URL` | `@string/launchUrl` | Default URL to load in TWA |
| `android.support.customtabs.trusted.STATUS_BAR_COLOR` | `@color/colorPrimary` | Status bar color (light mode) |
| `android.support.customtabs.trusted.LAUNCH_HANDLER_CLIENT_MODE` | `@string/launchHandlerClientMode` | Launch handler configuration |
| `android.support.customtabs.trusted.STATUS_BAR_COLOR_DARK` | `@color/colorPrimaryDark` | Status bar color (dark mode) |
| `android.support.customtabs.trusted.NAVIGATION_BAR_COLOR` | `@color/navigationColor` | Navigation bar color (light mode) |
| `android.support.customtabs.trusted.NAVIGATION_BAR_COLOR_DARK` | `@color/navigationColorDark` | Navigation bar color (dark mode) |
| `androix.browser.trusted.NAVIGATION_BAR_DIVIDER_COLOR` | `@color/navigationDividerColor` | Navigation bar divider (light mode) |
| `androix.browser.trusted.NAVIGATION_BAR_DIVIDER_COLOR_DARK` | `@color/navigationDividerColorDark` | Navigation bar divider (dark mode) |
| `android.support.customtabs.trusted.SPLASH_IMAGE_DRAWABLE` | `@drawable/splash` | Splash screen image |
| `android.support.customtabs.trusted.SPLASH_SCREEN_BACKGROUND_COLOR` | `@color/backgroundColor` | Splash screen background color |
| `android.support.customtabs.trusted.SPLASH_SCREEN_FADE_OUT_DURATION` | `@integer/splashScreenFadeOutDuration` | Splash fade duration (ms) |
| `android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY` | `@string/providerAuthority` | File provider authority |
| `android.app.shortcuts` | `@xml/shortcuts` | App shortcuts configuration |
| `android.support.customtabs.trusted.FALLBACK_STRATEGY` | `@string/fallbackType` | Fallback strategy when TWA unavailable |
| `android.support.customtabs.trusted.SCREEN_ORIENTATION` | `default` | Screen orientation setting |
| `android.supports_size_changes` | `true` | Supports size changes (Android 16+, foldables) |

#### Intent Filters

**Filter 1: Launcher Intent**
- **Action:** `android.intent.action.MAIN`
- **Category:** `android.intent.category.LAUNCHER`

**Filter 2: Deep Link Intent**
- **Attribute:** `android:autoVerify="true"` (enables App Links verification)
- **Action:** `android.intent.action.VIEW`
- **Categories:**
  - `android.intent.category.DEFAULT`
  - `android.intent.category.BROWSABLE`
- **Data:**
  - `android:scheme="https"`
  - `android:host="@string/hostName"`

---

### 3. FocusActivity

**Purpose:** Handles focus-related TWA functionality

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `com.google.androidbrowserhelper.trusted.FocusActivity` | Fully qualified class name |

---

### 4. CustomWebViewFallbackActivity

**Purpose:** Fallback activity when TWA is unavailable

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `.CustomWebViewFallbackActivity` | Relative class name |
| `android:configChanges` | `orientation\|screenSize` | Handles config changes without restart |
| `android:theme` | `@style/Theme.EdgeToEdge` | Edge-to-edge display theme |

---

### 5. NotificationPermissionRequestActivity

**Purpose:** Requests notification permissions

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `com.google.androidbrowserhelper.trusted.NotificationPermissionRequestActivity` | Fully qualified class name |

---

### 6. PermissionRequestActivity

**Purpose:** Handles location permission requests

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `com.google.androidbrowserhelper.locationdelegation.PermissionRequestActivity` | Fully qualified class name |

---

## Content Provider

### FileProvider Configuration

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `androidx.core.content.FileProvider` | FileProvider class |
| `android:authorities` | `@string/providerAuthority` | Provider authority identifier |
| `android:grantUriPermissions` | `true` | Allows granting URI permissions |
| `android:exported` | `false` | Not accessible to other apps |

#### Meta-data

| Name | Value | Description |
|------|-------|-------------|
| `android.support.FILE_PROVIDER_PATHS` | `@xml/filepaths` | File paths configuration |

---

## Service

### DelegationService

**Purpose:** Handles TWA delegation (notifications, etc.)

| Attribute | Value | Description |
|-----------|-------|-------------|
| `android:name` | `.DelegationService` | Relative class name |
| `android:enabled` | `@bool/enableNotification` | Enabled based on notification setting |
| `android:exported` | `@bool/enableNotification` | Exported based on notification setting |

#### Meta-data

| Name | Value | Description |
|------|-------|-------------|
| `android.support.customtabs.trusted.SMALL_ICON` | `@drawable/ic_notification_icon` | Notification icon |

#### Intent Filter

- **Action:** `android.support.customtabs.trusted.TRUSTED_WEB_ACTIVITY_SERVICE`
- **Category:** `android.intent.category.DEFAULT`

---

## Summary Statistics

- **Total Activities:** 6
- **Total Services:** 1
- **Total Providers:** 1
- **Total Permissions:** 1
- **Total Meta-data Elements:** 24
- **Total Intent Filters:** 4

---

## Compatibility Notes

### ✅ Modern Android Compatibility Features

1. **Large Screen Support:** Properly configured with `supports-screens` element
2. **Resizability:** `android:resizeableActivity="true"` at application level
3. **Size Changes Support:** `android.supports_size_changes` meta-data for Android 16+
4. **Edge-to-Edge Theme:** Using `@style/Theme.EdgeToEdge`
5. **Flexible Orientation:** `SCREEN_ORIENTATION` set to `default`

### 📋 Key Configuration Highlights

- **TWA Architecture:** Uses Google's androidbrowserhelper library
- **Digital Asset Links:** Configured via `asset_statements` meta-data
- **App Links:** Auto-verify enabled for deep linking
- **Notifications:** POST_NOTIFICATIONS permission for Android 13+
- **Multi-window:** Full support via resizeableActivity
- **RTL Support:** Enabled for international markets

---

## Resource References

The manifest references the following resource types that are defined elsewhere:

### Strings (`@string/`)
- `appName`, `launcherName`, `hostName`
- `launchUrl`, `webManifestUrl`, `providerAuthority`
- `assetStatements`, `generatorApp`, `fallbackType`
- `launchHandlerClientMode`

### Colors (`@color/`)
- `colorPrimary`, `colorPrimaryDark`
- `navigationColor`, `navigationColorDark`
- `navigationDividerColor`, `navigationDividerColorDark`
- `backgroundColor`

### Drawables (`@drawable/`)
- `splash`, `ic_notification_icon`

### Mipmaps (`@mipmap/`)
- `ic_launcher`

### XML Resources (`@xml/`)
- `shortcuts`, `filepaths`

### Integers (`@integer/`)
- `splashScreenFadeOutDuration`

### Booleans (`@bool/`)
- `enableNotification`

---

## Notes

1. The `package` attribute in the manifest root is rewritten by Gradle with the `applicationId` value from build.gradle
2. All activities use relative or fully qualified class names based on the package structure
3. The manifest is optimized for TWA (Trusted Web Activity) architecture
4. Modern Android compatibility features are properly implemented
5. No deprecated attributes or restrictions that would cause Play Store warnings
