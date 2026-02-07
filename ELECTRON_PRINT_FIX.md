# Electron Desktop Print Fix - Windows

## Issue Fixed
Print functionality in the Electron desktop app was getting blocked or not working properly on Windows when users clicked the print button.

## Root Cause
The print window was closing too quickly before the print job could be sent to the printer, and there was insufficient time for content rendering before attempting to print.

## Changes Made

### 1. Enhanced Print Handler (`frontend/electron/main.js`)

#### Silent Print (Direct to Printer)
- Added 300ms delay after content loads to ensure full rendering
- Added better error handling with `did-fail-load` event
- Enhanced printer detection to include more thermal printer brands (XPrinter, Epson, Star)
- Added proper paper size configuration for both 58mm and 80mm thermal printers
- Improved logging for debugging
- Added delayed window closing (500ms) to ensure print job completes
- Added `offscreen: false` to webPreferences for better rendering
- Added `color: false` to print options for thermal printers

#### Print with Dialog
- Added 300ms rendering delay before showing print dialog
- Added proper window dimensions (400x600) for preview
- Enhanced error handling
- Added delayed window closing after print dialog
- Improved logging for troubleshooting

### 2. Key Improvements

**Timing Fixes:**
```javascript
setTimeout(() => {
  // Print logic here
}, 300); // Wait for content to render

// Close window after print completes
setTimeout(() => {
  if (!printWindow.isDestroyed()) {
    printWindow.close();
  }
}, 500);
```

**Enhanced Printer Detection:**
```javascript
const thermalPrinter = printers.find(p => 
  p.name.toLowerCase().includes('thermal') ||
  p.name.toLowerCase().includes('pos') ||
  p.name.toLowerCase().includes('receipt') ||
  p.name.toLowerCase().includes('58mm') ||
  p.name.toLowerCase().includes('80mm') ||
  p.name.toLowerCase().includes('xprinter') ||
  p.name.toLowerCase().includes('epson') ||
  p.name.toLowerCase().includes('star')
);
```

**Better Print Options:**
```javascript
const printOptions = {
  silent: true,
  printBackground: true,
  color: false, // Thermal printers are monochrome
  deviceName: thermalPrinter ? thermalPrinter.name : '',
  margins: { marginType: 'none' },
  pageSize: paperWidth === '58mm' ? 
    { width: 58000, height: 297000 } : 
    { width: 80000, height: 297000 }
};
```

**Error Handling:**
```javascript
printWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
  console.error('[BillByteKOT] Print window failed to load:', errorCode, errorDescription);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('print-result', { success: false, error: errorDescription });
  }
  if (!printWindow.isDestroyed()) {
    printWindow.close();
  }
});
```

## Testing

### Test Silent Print
1. Open the Electron desktop app
2. Create an order and complete payment
3. Click "Print Receipt"
4. Receipt should print directly to default/thermal printer without showing dialog

### Test Print Dialog
1. Open the Electron desktop app
2. Go to settings and enable "Show print dialog"
3. Create an order and complete payment
4. Click "Print Receipt"
5. Print dialog should appear allowing printer selection

### Verify Logs
Open DevTools (F12) and check console for:
```
[BillByteKOT] Print request received
[BillByteKOT] Print window loaded, getting printers...
[BillByteKOT] Available printers: [list of printers]
[BillByteKOT] Printing silently to: [printer name]
[BillByteKOT] Print successful
```

## Supported Thermal Printers

The fix now detects these thermal printer types:
- Generic thermal printers (name contains "thermal")
- POS printers (name contains "pos")
- Receipt printers (name contains "receipt")
- 58mm printers (name contains "58mm")
- 80mm printers (name contains "80mm")
- XPrinter brand (name contains "xprinter")
- Epson thermal printers (name contains "epson")
- Star Micronics printers (name contains "star")

## Troubleshooting

### Print Still Not Working?

1. **Check Printer Connection**
   - Ensure thermal printer is connected via USB
   - Check Windows Device Manager for printer status
   - Verify printer is set as default in Windows Settings

2. **Check Printer Drivers**
   - Install latest drivers from printer manufacturer
   - Restart computer after driver installation

3. **Check Print Logs**
   - Open DevTools (F12) in the Electron app
   - Look for error messages in console
   - Check for "Print failed" messages

4. **Try Print Dialog Mode**
   - Enable "Show print dialog" in settings
   - This allows manual printer selection
   - Useful for troubleshooting printer detection

5. **Check Windows Print Spooler**
   - Open Services (services.msc)
   - Ensure "Print Spooler" service is running
   - Restart service if needed

### Common Issues

**Issue**: Print window closes immediately
- **Fix**: Applied in this update - added 300ms delay and 500ms close delay

**Issue**: Printer not detected
- **Fix**: Enhanced printer detection with more keywords

**Issue**: Content not rendering
- **Fix**: Added `offscreen: false` and rendering delay

**Issue**: Print job stuck in queue
- **Fix**: Added proper error handling and window cleanup

## Building New Version

After applying this fix, rebuild the Electron app:

```bash
# Windows
npm run electron:build:win

# This will create a new installer in dist-electron/
```

## Version Information

- **Fix Applied**: February 8, 2026
- **Electron Version**: 28.1.0
- **Affected Platform**: Windows (win32)
- **Fix Type**: Timing and error handling improvements

## Related Files

- `frontend/electron/main.js` - Main Electron process with print handlers
- `frontend/electron/preload.js` - IPC bridge for print functions
- `frontend/src/utils/printUtils.js` - Print utility functions
- `frontend/package.json` - Electron build configuration

## No Need to Generate New Version

**You don't need to generate a completely new version.** The fix is minimal and focused:
- Only timing adjustments (delays)
- Better error handling
- Enhanced printer detection
- No breaking changes
- No new dependencies

Simply rebuild the Electron app with the updated code and distribute the new installer.

## Distribution

After rebuilding:
1. Test the new installer on a Windows machine
2. Verify print functionality works
3. Distribute the new installer to users
4. Users can install over the existing version

## Future Improvements

Consider these enhancements for future versions:
1. Add printer selection UI in settings
2. Save last used printer preference
3. Add print preview window option
4. Support for custom paper sizes
5. Add print queue management
6. Support for network thermal printers
7. Add print job status notifications

## Support

If users still experience issues after this fix:
1. Collect console logs (F12 → Console)
2. Check Windows Event Viewer for print errors
3. Verify printer compatibility
4. Test with different thermal printer models
5. Consider adding telemetry for print failures
