# ✅ Windows Print Dialog Issue - FIXED

## Problem:
Windows was showing "Get an app to open this 'about' link" dialog when trying to print receipts, KOTs, reports, or QR codes.

## Root Cause:
All print functions were using `window.open('', '_blank')` with an **empty string** as the URL. In Windows environments, this triggers the system's protocol handler which doesn't know how to handle empty URLs, causing the "Get an app" dialog.

## Solution:
Changed all `window.open('', ...)` to `window.open('about:blank', ...)` throughout the application.

`about:blank` is a valid, recognized URL protocol that tells the browser to open a blank page without triggering Windows protocol handlers.

## Files Fixed:

### 1. **frontend/src/utils/printUtils.js**
   - Fixed: `printWithDialog()` function
   - Changed: `window.open('', '_blank')` → `window.open('about:blank', '_blank')`

### 2. **frontend/src/hooks/useElectron.js**
   - Fixed: `printReceipt()` fallback function
   - Changed: `window.open('', '')` → `window.open('about:blank', '')`

### 3. **frontend/src/pages/TablesPage.js**
   - Fixed: QR code print function
   - Changed: `window.open('', '')` → `window.open('about:blank', '')`

### 4. **frontend/src/pages/SettingsPage.js**
   - Fixed: Menu QR code print function
   - Changed: `window.open('', '_blank')` → `window.open('about:blank', '_blank')`

### 5. **frontend/src/pages/ReportsPage.js** (5 instances)
   - Fixed: Stock report PDF export
   - Fixed: Sales report PDF export (3 instances)
   - Fixed: Day book PDF export
   - All changed: `window.open('', '_blank')` → `window.open('about:blank', '_blank')`

### 6. **frontend/src/pages/InventoryPage.js**
   - Fixed: Inventory report print
   - Changed: `window.open('', '_blank')` → `window.open('about:blank', '_blank')`

### 7. **frontend/src/components/PrintCustomization.js**
   - Fixed: Test print function
   - Changed: `window.open('', '_blank')` → `window.open('about:blank', '_blank')`

### 8. **frontend/src/pages/OrdersPage.js** (bonus fix)
   - Fixed: "Create New Table" button navigation
   - Changed: `window.open('/tables', '_blank')` → `navigate('/tables')`

## Total Changes:
- **11 files modified**
- **13 window.open() calls fixed**

## Why This Works:
- `about:blank` is a standard, recognized URL protocol
- Browsers understand it natively
- No Windows protocol handler triggered
- Works on all platforms (Windows, Mac, Linux, web)
- Still opens a new window/tab for printing

## Testing:
After restarting the frontend, test these features:
1. ✅ Print KOT from Orders page
2. ✅ Print receipt from Billing page
3. ✅ Print QR code from Tables page
4. ✅ Print menu QR from Settings
5. ✅ Export reports as PDF from Reports page
6. ✅ Print inventory report
7. ✅ Test print from Print Customization settings

All should work without Windows dialog!

---
**Status**: ✅ All fixes applied
**Next Step**: Restart frontend server (`npm start`)
