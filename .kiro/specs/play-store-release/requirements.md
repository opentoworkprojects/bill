# Requirements Document

## Introduction

This specification defines the requirements for updating the BillByteKOT Android application version and preparing it for Play Store release. The system shall automate version management, build generation, and ensure all Play Store submission requirements are met.

## Glossary

- **Version_Manager**: The system component responsible for incrementing version codes and names
- **Build_System**: The Gradle-based Android build system that compiles and packages the application
- **Release_Builder**: The component that generates signed APK and AAB files for distribution
- **Asset_Validator**: The component that verifies Play Store asset requirements (icons, graphics, metadata)
- **Play_Store**: Google Play Store distribution platform
- **APK**: Android Package Kit - the legacy Android app distribution format
- **AAB**: Android App Bundle - the modern Android app distribution format preferred by Play Store
- **Signing_Configuration**: The cryptographic signing setup using keystore for app authentication
- **TWA**: Trusted Web Activity - the app architecture used by BillByteKOT

## Requirements

### Requirement 1: Version Management

**User Story:** As a developer, I want to increment the app version automatically, so that each release has a unique identifier for Play Store submission.

#### Acceptance Criteria

1. WHEN a new release is initiated, THE Version_Manager SHALL increment versionCode by 1 from the current value
2. WHEN versionCode is incremented, THE Version_Manager SHALL update versionName to match the new versionCode
3. THE Version_Manager SHALL update the build.gradle file with the new version values
4. WHEN version values are updated, THE Version_Manager SHALL preserve all other build configuration settings
5. THE Version_Manager SHALL validate that versionCode is a positive integer greater than the previous version

### Requirement 2: Build Configuration Validation

**User Story:** As a developer, I want to validate the build configuration before building, so that I can catch configuration errors early.

#### Acceptance Criteria

1. WHEN preparing a release build, THE Build_System SHALL verify that signing configuration exists
2. WHEN validating configuration, THE Build_System SHALL confirm the keystore file is accessible
3. THE Build_System SHALL verify that targetSdkVersion meets Play Store minimum requirements
4. THE Build_System SHALL confirm that minSdkVersion is set appropriately for the target audience
5. WHEN configuration validation fails, THE Build_System SHALL report specific errors with remediation guidance

### Requirement 3: Release Build Generation

**User Story:** As a developer, I want to generate both APK and AAB files, so that I have flexibility in distribution methods.

#### Acceptance Criteria

1. WHEN building for release, THE Release_Builder SHALL generate a signed AAB file
2. WHEN building for release, THE Release_Builder SHALL generate a signed APK file
3. THE Release_Builder SHALL apply ProGuard/R8 minification when minifyEnabled is true
4. WHEN builds complete successfully, THE Release_Builder SHALL output files to a predictable location
5. THE Release_Builder SHALL verify that generated files are properly signed before completion

### Requirement 4: App Icon Validation

**User Story:** As a developer, I want to validate app icons meet Play Store requirements, so that my submission is not rejected for icon issues.

#### Acceptance Criteria

1. THE Asset_Validator SHALL verify that launcher icons exist in all required density folders (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
2. THE Asset_Validator SHALL confirm that adaptive icons (mipmap-anydpi-v26) are properly configured
3. WHEN validating icons, THE Asset_Validator SHALL check that foreground and background layers exist for adaptive icons
4. THE Asset_Validator SHALL verify that icon dimensions match Play Store requirements for each density
5. WHEN icon validation fails, THE Asset_Validator SHALL report which densities or formats are missing

### Requirement 5: Play Store Asset Preparation

**User Story:** As a developer, I want to prepare all required Play Store assets, so that I can complete the submission process without delays.

#### Acceptance Criteria

1. THE Asset_Validator SHALL verify that a feature graphic (1024x500) exists or provide guidance for creation
2. THE Asset_Validator SHALL confirm that app screenshots exist for required device types
3. WHEN preparing assets, THE Asset_Validator SHALL check that privacy policy URL is configured if required
4. THE Asset_Validator SHALL verify that app description and short description are within character limits
5. WHEN assets are incomplete, THE Asset_Validator SHALL generate a checklist of missing items

### Requirement 6: Signing Configuration Management

**User Story:** As a developer, I want to verify signing configuration, so that my release builds are properly authenticated.

#### Acceptance Criteria

1. THE Signing_Configuration SHALL verify that the keystore file exists at the expected path
2. WHEN validating signing, THE Signing_Configuration SHALL confirm that key alias is configured
3. THE Signing_Configuration SHALL verify that signing credentials are available (via environment variables or secure storage)
4. WHEN signing configuration is invalid, THE Signing_Configuration SHALL provide clear error messages
5. THE Signing_Configuration SHALL never log or expose sensitive credential information

### Requirement 7: Build Output Verification

**User Story:** As a developer, I want to verify build outputs are valid, so that I can confidently submit to Play Store.

#### Acceptance Criteria

1. WHEN builds complete, THE Release_Builder SHALL verify that AAB file size is reasonable (not corrupted)
2. WHEN builds complete, THE Release_Builder SHALL verify that APK file size is reasonable (not corrupted)
3. THE Release_Builder SHALL confirm that version information in built artifacts matches build.gradle
4. THE Release_Builder SHALL verify that the application ID in built artifacts is correct
5. WHEN verification fails, THE Release_Builder SHALL report specific issues found

### Requirement 8: Release Checklist Generation

**User Story:** As a developer, I want a comprehensive release checklist, so that I don't miss any submission requirements.

#### Acceptance Criteria

1. WHEN preparing for release, THE Build_System SHALL generate a checklist of all required steps
2. THE Build_System SHALL include version verification in the checklist
3. THE Build_System SHALL include build generation steps in the checklist
4. THE Build_System SHALL include asset validation steps in the checklist
5. THE Build_System SHALL include Play Store submission steps in the checklist with links to Play Console

### Requirement 9: TWA-Specific Configuration

**User Story:** As a developer, I want to validate TWA-specific settings, so that the web app integration works correctly.

#### Acceptance Criteria

1. THE Build_System SHALL verify that assetlinks.json is properly configured for the domain
2. THE Build_System SHALL confirm that the hostName in twaManifest matches the production domain
3. THE Build_System SHALL verify that launchUrl points to the correct PWA entry point
4. WHEN TWA configuration is invalid, THE Build_System SHALL report specific configuration errors
5. THE Build_System SHALL verify that Digital Asset Links are properly set up on the web server

### Requirement 10: Version History Tracking

**User Story:** As a developer, I want to track version history, so that I can reference previous releases and changes.

#### Acceptance Criteria

1. WHEN a version is incremented, THE Version_Manager SHALL record the version change with timestamp
2. THE Version_Manager SHALL maintain a version history log in the project
3. WHEN recording version changes, THE Version_Manager SHALL include the previous and new version numbers
4. THE Version_Manager SHALL allow querying the current version without modifying files
5. THE Version_Manager SHALL support rollback to a previous version if needed

### Requirement 11: Edge-to-Edge Display Compatibility

**User Story:** As a developer, I want to implement modern edge-to-edge display support, so that the app displays correctly on all Android devices and avoids Play Store warnings.

#### Acceptance Criteria

1. THE Build_System SHALL configure the app to use modern edge-to-edge APIs (WindowCompat.setDecorFitsSystemWindows)
2. THE Build_System SHALL remove deprecated edge-to-edge configuration parameters from AndroidManifest.xml
3. WHEN edge-to-edge is enabled, THE Build_System SHALL ensure proper window insets handling
4. THE Build_System SHALL validate that no deprecated edge-to-edge APIs are used in the configuration
5. WHEN validation detects deprecated APIs, THE Build_System SHALL report specific deprecated parameters and provide migration guidance

### Requirement 12: Large Screen Device Support

**User Story:** As a developer, I want to support large screen devices (tablets, foldables, ChromeOS), so that the app provides optimal user experience across all device types and meets Play Store requirements.

#### Acceptance Criteria

1. THE Build_System SHALL remove resizability restrictions from AndroidManifest.xml to allow the app to resize on large screens
2. THE Build_System SHALL remove fixed orientation restrictions (portrait/landscape locks) to support device rotation
3. THE Build_System SHALL configure the app to support all screen sizes and orientations
4. WHEN validating manifest, THE Build_System SHALL detect and flag any resizability or orientation restrictions
5. THE Build_System SHALL verify that the app declares support for large screens in the manifest

### Requirement 13: Android Manifest Validation

**User Story:** As a developer, I want to validate AndroidManifest.xml for Play Store compliance, so that I can identify and fix configuration issues before submission.

#### Acceptance Criteria

1. THE Build_System SHALL scan AndroidManifest.xml for deprecated attributes and parameters
2. WHEN scanning manifest, THE Build_System SHALL identify resizability restrictions (resizeableActivity="false")
3. THE Build_System SHALL identify orientation locks (screenOrientation with fixed values)
4. THE Build_System SHALL identify deprecated edge-to-edge parameters
5. WHEN issues are found, THE Build_System SHALL generate a detailed report with file locations and remediation steps
