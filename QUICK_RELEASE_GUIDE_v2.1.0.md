# Quick Release Guide - v2.1.0

## 🚀 One-Page Release Guide

---

## ✅ Status: READY TO RELEASE

**Version:** 2.1.0  
**Date:** February 8, 2026  
**Type:** Bug Fix Release

---

## 📝 What's Fixed

1. ✅ Electron print popup blocking
2. ✅ Performance monitor runtime errors

---

## 🎯 Quick Deploy

### 1. Build Electron (5 min)
```bash
cd frontend
npm run electron:build:win
```
**Output:** `dist-electron/BillByteKOT Setup 2.1.0.exe`

### 2. Deploy Backend (2 min)
- Push `backend/server.py` to server
- Version auto-updates to 2.1.0

### 3. Deploy Web (5 min)
```bash
cd frontend
npm run build
```
- Deploy `build/` folder to web server

### 4. Test (10 min)
- [ ] Print works in Electron
- [ ] No console errors
- [ ] Version shows 2.1.0

---

## 📦 Files Changed

| File | Change |
|------|--------|
| `frontend/package.json` | Version → 2.1.0 |
| `frontend/electron/config.js` | Version → 2.1.0 |
| `frontend/electron/main.js` | Print fix |
| `frontend/src/utils/performanceMonitor.js` | Error fix |
| `backend/server.py` | Version → 2.1.0 |

---

## 🧪 Quick Test

### Electron
```
1. Install new build
2. Click Print button
3. ✅ No "popup blocked" error
4. ✅ Print dialog appears
```

### Web
```
1. Refresh browser (F5)
2. Open console (F12)
3. ✅ No runtime errors
4. ✅ App loads normally
```

### API
```bash
curl https://your-backend.com/health
# Should return: "version": "2.1.0"
```

---

## 📢 Announce

**Short:**
```
🎉 v2.1.0 Released!
✅ Print fixes
✅ Stability improvements
Download: [link]
```

**Long:**
See `CHANGELOG_v2.1.0.md`

---

## 🔗 Docs

- `CHANGELOG_v2.1.0.md` - Full changelog
- `RELEASE_v2.1.0_READY.md` - Complete guide
- `VERSION_UPDATE_SUMMARY.md` - Version details

---

## ⚡ Emergency Rollback

```bash
git revert HEAD
git push
# Rebuild and redeploy
```

---

## ✨ That's It!

**Time:** ~20 minutes  
**Risk:** 🟢 Low  
**Impact:** 🟢 High

**GO!** 🚀
