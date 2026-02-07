# 🔧 QR Banner Not Showing - Quick Fix

## Why the Banner is Hidden

The QRPromotionalBanner has two conditions that hide it:

```javascript
if (isDismissed || isQREnabled) return null;
```

The banner is hidden if:
1. **Previously dismissed**: User clicked the X button (stored in localStorage)
2. **QR already enabled**: `selfOrderEnabled` is `true`

## 🚀 Quick Fix - Clear localStorage

### Option 1: Browser Console (Easiest)
1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Run this command:
```javascript
localStorage.removeItem('qr-banner-dismissed');
location.reload();
```

### Option 2: Application Tab
1. Open Developer Tools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Expand **Local Storage**
4. Find the key `qr-banner-dismissed`
5. Right-click and delete it
6. Refresh the page (F5)

### Option 3: Clear All Site Data
1. Open Developer Tools (F12)
2. Go to **Application** tab
3. Click "Clear site data" button
4. Refresh the page

## 🧪 Test the Banner

After clearing localStorage, visit:
```
http://localhost:3000/tables
```

You should now see the QR Promotional Banner with:
- ✅ Purple gradient background
- ✅ Pulsing QR icon
- ✅ Rotating benefits (4s intervals)
- ✅ Animated "How It Works" steps (3s intervals)
- ✅ Twinkling sparkles
- ✅ Progress indicator dots

## 🎯 Force Banner to Always Show (For Testing)

If you want the banner to always show during development, temporarily comment out the condition:

```javascript
// Temporarily disable for testing
// if (isDismissed || isQREnabled) return null;
```

**Remember to uncomment this before production!**

## 📝 Check QR Status

The banner also checks if QR ordering is enabled. To verify:

1. Open browser console
2. Check the value:
```javascript
localStorage.getItem('qr-banner-dismissed')
// Should return: null (to show banner) or "true" (hidden)
```

## ✅ Verification Checklist

After clearing localStorage, you should see:

- [ ] Banner appears at top of Tables page
- [ ] Purple gradient background with sparkles
- [ ] QR icon pulses continuously
- [ ] Benefits rotate every 4 seconds
- [ ] "How It Works" steps rotate every 3 seconds
- [ ] Progress dots animate
- [ ] Close button (X) in top-right corner
- [ ] "Enable Now" button on the right

If you still don't see it, check:
- [ ] Browser console for errors
- [ ] Network tab for failed requests
- [ ] React DevTools for component rendering

## 🐛 Common Issues

### Issue 1: Banner dismissed previously
**Solution**: Clear localStorage (see above)

### Issue 2: QR ordering already enabled
**Solution**: Check `selfOrderEnabled` state in React DevTools

### Issue 3: Component not rendering
**Solution**: Check browser console for errors

### Issue 4: Styles not loading
**Solution**: Restart dev server (`npm start`)

## 🔄 Reset Everything

To completely reset and see the banner:

```javascript
// Run in browser console
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Then visit: `http://localhost:3000/tables`

The banner should now be visible! 🎉
