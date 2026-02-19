# Tasks: Play Store Release - Android Compatibility

## 1. AndroidManifest.xml Validation and Fixes

### 1.1 Locate and analyze AndroidManifest.xml
- [x] Find AndroidManifest.xml in frontend/billbytekot/app/src/main/
- [x] Read current manifest configuration
- [x] Document all current attributes and their values

### 1.2 Remove deprecated edge-to-edge parameters
- [x] Scan for deprecated window configuration parameters
- [x] Remove android:windowLayoutInDisplayCutoutMode if present
- [x] Remove any other deprecated edge-to-edge attributes
- [x] Verify manifest is still valid XML after changes

### 1.3 Remove resizability restrictions
- [x] Search for resizeableActivity attributes
- [x] Remove resizeableActivity="false" from all activities
- [x] Ensure no other resizability restrictions exist

### 1.4 Remove orientation locks
- [x] Search for screenOrientation attributes
- [x] Remove fixed orientation values (portrait, landscape, etc.)
- [x] Set to "unspecified" or remove attribute entirely
- [x] Document any activities that legitimately need orientation locks

### 1.5 Add large screen support declarations
- [x] Add supports-screens element if not present
- [x] Configure support for all screen sizes (small, normal, large, xlarge)
- [x] Set anyDensity="true"
- [x] Verify configuration matches Play Store requirements

## 2. Build Configuration Updates

### 2.1 Update build.gradle for compatibility
- [x] Verify targetSdkVersion is 34 or higher (Android 14+)
- [x] Verify compileSdkVersion matches targetSdkVersion
- [x] Check for any deprecated build configuration parameters
- [x] Update dependencies if needed for compatibility

### 2.2 Validate TWA configuration
- [x] Verify assetlinks.json is properly configured
- [x] Check twa-manifest.json for correct settings
- [x] Ensure hostName matches production domain
- [x] Verify launchUrl points to correct PWA entry point

## 3. Create Manifest Validator Script

### 3.1 Create manifest_validator.py
- [x] Create scripts directory if not exists
- [x] Implement XML parsing for AndroidManifest.xml
- [x] Create validation functions for each check type

### 3.2 Implement edge-to-edge validation
- [x] Scan for deprecated edge-to-edge parameters
- [x] Return list of deprecated attributes found
- [x] Provide remediation guidance for each issue

### 3.3 Implement large screen validation
- [x] Check for resizeableActivity restrictions
- [x] Check for fixed screenOrientation values
- [x] Verify supports-screens configuration
- [x] Generate detailed validation report

### 3.4 Implement automated fix suggestions
- [-] Generate XML snippets for fixes
- [-] Create backup before applying fixes
- [-] Implement safe XML modification
- [-] Verify XML validity after changes

## 4. Testing and Verification

### 4.1 Create unit tests for manifest validator
- [ ] Test detection of deprecated attributes
- [ ] Test detection of resizability restrictions
- [ ] Test detection of orientation locks
- [ ] Test XML parsing edge cases

### 4.2 Create property-based tests
- [ ] Property: Validator detects all deprecated attributes
- [ ] Property: Validator correctly identifies resizability issues
- [ ] Property: Validator correctly identifies orientation locks
- [ ] Property: Fixed manifest passes all validations

### 4.3 Manual testing on devices
- [ ] Build APK with updated manifest
- [ ] Test on phone (portrait and landscape)
- [ ] Test on tablet (all orientations)
- [ ] Test on foldable device (if available)
- [ ] Verify edge-to-edge display on Android 15+

### 4.4 Play Store validation
- [ ] Upload AAB to Play Console (internal testing track)
- [ ] Verify no warnings about edge-to-edge APIs
- [ ] Verify no warnings about resizability
- [ ] Verify no warnings about orientation restrictions
- [ ] Check release stability score

## 5. Documentation and Release

### 5.1 Update release documentation
- [ ] Document manifest changes made
- [ ] Update BUILD_AND_UPLOAD_GUIDE.md
- [ ] Create migration guide for future updates
- [ ] Document validation script usage

### 5.2 Update version and build
- [ ] Increment versionCode to 30
- [ ] Update versionName to match
- [ ] Build signed AAB
- [ ] Build signed APK
- [ ] Verify signatures

### 5.3 Create release checklist
- [ ] Generate comprehensive release checklist
- [ ] Include all validation steps
- [ ] Include manual testing steps
- [ ] Include Play Store submission steps

### 5.4 Final verification
- [ ] Run all automated validations
- [ ] Verify all tests pass
- [ ] Review all changes
- [ ] Prepare release notes

## 6. Integration with Release Pipeline

### 6.1 Update release.py script
- [ ] Add manifest validation to pipeline
- [ ] Integrate with existing validation steps
- [ ] Add command-line option for manifest validation
- [ ] Update help documentation

### 6.2 Add to CI/CD (if applicable)
- [ ] Add manifest validation to build pipeline
- [ ] Fail build if validation errors found
- [ ] Generate validation reports
- [ ] Archive validation results

## Notes

- All manifest changes should be tested thoroughly before production release
- Keep backup of original AndroidManifest.xml
- Test on multiple device types and Android versions
- Monitor Play Console for any new warnings after release
- Edge-to-edge for TWA is primarily handled by web content CSS
