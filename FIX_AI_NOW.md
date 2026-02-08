# Fix AI Assistant NOW - Quick Guide

## 🚨 Problem
Your Gemini API key is **LEAKED and BLOCKED** by Google.

## ⚡ Quick Fix (2 Steps)

### 1. Get New Key (2 min)
👉 https://makersuite.google.com/app/apikey
- Click "Create API Key"
- Copy the key

### 2. Update .env (1 min)
Edit `backend/.env` line 73:
```bash
GEMINI_API_KEY=YOUR_NEW_KEY_HERE
```

### 3. Restart Server
```bash
# Stop server (Ctrl+C)
# Start again:
cd backend
python server.py
```

## ✅ Test It
```bash
cd backend
python test_gemini_direct.py
```

Should see: `✅ Response: Hello from Gemini!`

---

## 🔒 Important!

**Delete the old key** from Google Console to prevent further issues:
👉 https://makersuite.google.com/app/apikey

---

## 📚 Full Guide
See `AI_KEY_LEAKED_FIX.md` for complete details.

---

**Time:** 3 minutes  
**Difficulty:** Easy  
**Status:** 🔴 URGENT - AI not working
