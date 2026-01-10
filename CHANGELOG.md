# Changelog

All notable changes to BillByteKOT Desktop will be documented in this file.

## [2.0.1] - 2025-01-10

### Fixed
- **Print Format Consistency**: Fixed print formatting differences between desktop and web versions
- **Paper Width Support**: Desktop version now properly respects 58mm and 80mm paper width settings
- **CSS Styling**: All print customization options (fonts, borders, separators) now work correctly in desktop
- **Print Settings**: Print customization settings from the Settings page are now applied in desktop version

### Technical Changes
- Updated Electron main process to use dynamic CSS generation matching web version
- Enhanced print utilities to pass paper width options to Electron
- Added proper error handling for Electron print operations
- Synchronized CSS classes and styling between web and desktop platforms

### Impact
- Desktop users will now see identical receipt and KOT formats as web users
- All print customization options work consistently across platforms
- Better thermal printer support with correct paper width handling

## [2.0.0] - Previous Release
- Initial desktop application release
- WhatsApp integration
- Native printing support
- Offline capabilities