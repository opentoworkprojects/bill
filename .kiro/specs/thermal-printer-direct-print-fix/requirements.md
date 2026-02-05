# Requirements Document

## Introduction

This specification addresses critical issues with thermal printer functionality in the BillByteKOT application. Currently, when users attempt to print receipts or KOT (Kitchen Order Tickets) to thermal printers, the system falls back to browser print dialogs or save dialogs instead of directly printing to thermal printers. This creates friction in the point-of-sale workflow and defeats the purpose of having thermal printer support.

The system has existing infrastructure for thermal printing including Bluetooth printer support, Electron IPC handlers, and ESC/POS command generation, but the web fallback implementation (`trueSilentPrint` and related functions) does not actually print - it only prepares content and shows toast messages.

## Glossary

- **Thermal_Printer**: A specialized point-of-sale printer that uses heat-sensitive paper (typically 58mm or 80mm width) to print receipts without ink
- **ESC/POS**: A command language used by most thermal printers for formatting and printing
- **Silent_Print**: Printing directly to a printer without showing any browser dialogs or user prompts
- **Electron_App**: The desktop application version built with Electron framework
- **Web_App**: The browser-based version of the application
- **Mobile_App**: The mobile web application accessed via mobile browsers
- **Bluetooth_Printer**: A thermal printer that connects via Bluetooth (common for mobile POS)
- **IPC_Handler**: Inter-Process Communication handler in Electron for communication between renderer and main process
- **KOT**: Kitchen Order Ticket - a print format for kitchen staff showing items to prepare
- **Print_Fallback_Chain**: The sequence of print methods attempted: Electron native → Bluetooth → Browser print

## Requirements

### Requirement 1: Fix Silent Printing for Desktop Electron App

**User Story:** As a restaurant staff member using the desktop app, I want receipts to print directly to my thermal printer without any dialogs, so that I can quickly serve customers without interruption.

#### Acceptance Criteria

1. WHEN a user clicks print in the Electron desktop app, THE System SHALL send the print job directly to the default thermal printer without showing any dialog
2. WHEN the Electron app detects multiple printers, THE System SHALL prioritize thermal printers (containing keywords: "thermal", "pos", "receipt", "58mm", "80mm") over regular printers
3. WHEN the print job is sent, THE System SHALL use the existing `print-receipt` IPC handler with `silent: true` option
4. WHEN the print completes successfully, THE System SHALL show a success toast notification
5. IF the silent print fails, THEN THE System SHALL log the error and show an error toast with the failure reason

### Requirement 2: Implement Bluetooth Thermal Printer as Primary Method for Mobile

**User Story:** As a restaurant staff member using a mobile device, I want to print receipts to my Bluetooth thermal printer as the primary option, so that I can process orders efficiently from anywhere in the restaurant.

#### Acceptance Criteria

1. WHEN a user clicks print on a mobile device, THE System SHALL check if a Bluetooth thermal printer is connected
2. IF a Bluetooth printer is connected, THEN THE System SHALL print directly via Bluetooth without showing any dialog
3. IF no Bluetooth printer is connected, THEN THE System SHALL show the mobile print options modal with Bluetooth as the first option
4. WHEN a user selects "Bluetooth Printer" from the modal, THE System SHALL initiate Bluetooth printer connection if not already connected
5. WHEN Bluetooth printing succeeds, THE System SHALL show a success toast and close any open modals

### Requirement 3: Implement Proper Print Fallback Chain

**User Story:** As a system administrator, I want the application to intelligently try different print methods in order of preference, so that printing works reliably across all platforms and configurations.

#### Acceptance Criteria

1. THE System SHALL attempt print methods in this order: Electron native print → Bluetooth printer → Browser print dialog
2. WHEN the Electron native print method is available, THE System SHALL use it and skip other methods
3. WHEN Electron native print is not available AND a Bluetooth printer is connected, THE System SHALL use Bluetooth printing
4. WHEN neither Electron nor Bluetooth printing is available, THE System SHALL fall back to browser print dialog with thermal printer formatting
5. WHEN each print method fails, THE System SHALL log the failure reason and attempt the next method in the chain

### Requirement 4: Remove Non-Functional Silent Print Methods

**User Story:** As a developer maintaining the codebase, I want to remove or fix non-functional print methods, so that the code is maintainable and doesn't mislead future developers.

#### Acceptance Criteria

1. THE System SHALL remove or completely rewrite the `trueSilentPrint` function that currently only shows toast messages
2. THE System SHALL remove or completely rewrite the `backgroundPrint` function that doesn't actually print
3. THE System SHALL remove or completely rewrite the `cssOnlyPrint` function that doesn't trigger actual printing
4. THE System SHALL remove or completely rewrite the `silentThermalPrint` function that doesn't print silently
5. THE System SHALL ensure all print functions either successfully print or explicitly show a dialog when silent printing is not possible

### Requirement 5: Support Both 58mm and 80mm Thermal Paper Sizes

**User Story:** As a restaurant owner, I want the system to properly format receipts for both 58mm and 80mm thermal printers, so that I can use whichever printer size fits my business needs.

#### Acceptance Criteria

1. WHEN printing to a 58mm thermal printer, THE System SHALL use compact formatting with appropriate font sizes and margins
2. WHEN printing to an 80mm thermal printer, THE System SHALL use standard formatting with larger fonts and more spacing
3. THE System SHALL read the paper width setting from user preferences (stored in `print_customization.paper_width`)
4. WHEN sending print jobs to Electron, THE System SHALL include the paper width in the print options
5. THE System SHALL apply the correct `@page` size CSS rule based on the selected paper width

### Requirement 6: Maintain Existing Print Customization Settings

**User Story:** As a restaurant owner, I want my custom print settings (themes, fonts, logos) to continue working after the fix, so that my receipts maintain their branded appearance.

#### Acceptance Criteria

1. THE System SHALL preserve all existing print customization settings including themes, fonts, logo display, and footer messages
2. WHEN printing receipts, THE System SHALL apply the selected print theme (default, professional, modern, etc.)
3. WHEN printing KOTs, THE System SHALL apply the selected KOT theme (classic, modern, compact, etc.)
4. THE System SHALL continue to use the cached settings system to avoid repeated localStorage reads
5. THE System SHALL maintain backward compatibility with existing print customization configurations

### Requirement 7: Add Printer Detection and Selection

**User Story:** As a restaurant with multiple printers, I want the system to detect and prioritize thermal printers, so that receipts go to the correct printer automatically.

#### Acceptance Criteria

1. WHEN the Electron app starts, THE System SHALL query available printers using `getPrintersAsync()`
2. THE System SHALL identify thermal printers by checking for keywords in printer names: "thermal", "pos", "receipt", "58mm", "80mm", "epson", "star", "bixolon"
3. WHEN multiple thermal printers are detected, THE System SHALL use the first detected thermal printer as default
4. WHEN no thermal printer is detected, THE System SHALL use the system default printer
5. THE System SHALL log all detected printers and the selected printer to the console for debugging

### Requirement 8: Implement Manual Print with Printer Selection

**User Story:** As a restaurant staff member, I want to manually trigger printing with printer selection when automatic printing fails, so that I have a backup option to print receipts.

#### Acceptance Criteria

1. THE System SHALL provide a `manualPrintReceipt` function that shows the print dialog
2. WHEN a user calls manual print, THE System SHALL show the browser/system print dialog allowing printer selection
3. THE System SHALL format the receipt for thermal printers even when showing the dialog
4. WHEN manual print is triggered from Electron, THE System SHALL use the `print-receipt-dialog` IPC handler
5. THE System SHALL maintain the same receipt formatting and styling for manual prints as automatic prints

### Requirement 9: Test with Common Thermal Printer Brands

**User Story:** As a quality assurance tester, I want to verify that the system works with common thermal printer brands, so that we can confidently support our customers' hardware.

#### Acceptance Criteria

1. THE System SHALL be tested with Epson thermal printers (TM-T20, TM-T82, TM-m30 series)
2. THE System SHALL be tested with Star Micronics thermal printers (TSP100, TSP650, TSP700 series)
3. THE System SHALL be tested with Bixolon thermal printers (SRP-350, SRP-275 series)
4. THE System SHALL be tested with generic ESC/POS compatible thermal printers
5. THE System SHALL document any brand-specific issues or workarounds in the codebase

### Requirement 10: Implement Web Serial API for Direct Thermal Printer Communication

**User Story:** As a web app user with a USB thermal printer, I want the browser to communicate directly with my printer using Web Serial API, so that I can print without installing the desktop app.

#### Acceptance Criteria

1. WHEN the browser supports Web Serial API, THE System SHALL attempt to use it for direct printer communication
2. WHEN a user first attempts Web Serial printing, THE System SHALL request user permission to access serial devices
3. WHEN permission is granted, THE System SHALL connect to the thermal printer at the appropriate baud rate (9600 or 19200)
4. WHEN sending print data via Web Serial, THE System SHALL convert HTML content to ESC/POS commands
5. IF Web Serial API is not supported or permission is denied, THEN THE System SHALL fall back to the next method in the fallback chain

### Requirement 11: Enhance ESC/POS Command Generation

**User Story:** As a developer, I want robust ESC/POS command generation from HTML content, so that thermal printers receive properly formatted print jobs.

#### Acceptance Criteria

1. THE System SHALL convert HTML receipt content to ESC/POS commands preserving text formatting (bold, alignment, size)
2. WHEN converting HTML to ESC/POS, THE System SHALL handle text alignment (left, center, right) using ESC/POS alignment commands
3. WHEN converting HTML to ESC/POS, THE System SHALL handle bold text using ESC/POS emphasis commands
4. WHEN converting HTML to ESC/POS, THE System SHALL handle separators (lines, dashes) using appropriate characters
5. THE System SHALL append paper cut command (GS V 0) at the end of each print job

### Requirement 12: Add Print Status Feedback

**User Story:** As a restaurant staff member, I want clear feedback about print status, so that I know whether my receipt printed successfully or if I need to retry.

#### Acceptance Criteria

1. WHEN a print job starts, THE System SHALL show a toast notification indicating "Printing..."
2. WHEN a print job completes successfully, THE System SHALL show a success toast with "Receipt printed successfully!"
3. WHEN a print job fails, THE System SHALL show an error toast with the specific failure reason
4. WHEN using Bluetooth printing, THE System SHALL show connection status ("Connecting to printer...", "Connected to [Printer Name]")
5. THE System SHALL log all print attempts, successes, and failures to the browser console for debugging
