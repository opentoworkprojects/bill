# 🔧 Fix "Failed to get AI response" Error

## Quick Diagnosis

Run this command to check your setup:
```bash
cd backend
python check_ai_setup.py
```

## Common Issues & Fixes

### Issue 1: Package Not Installed
**Error**: `google-generativeai NOT installed`

**Fix**:
```bash
pip install google-generativeai
```

### Issue 2: API Key Not Set
**Error**: `GEMINI_API_KEY: ❌ Not set`

**Fix**: Check your `.env` file has:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA
```

### Issue 3: Wrong Provider Selected
**Error**: Provider mismatch

**Fix**: Make sure `.env` has:
```env
AI_PROVIDER=gemini
```

## Step-by-Step Fix

### Step 1: Check Setup
```bash
cd backend
python check_ai_setup.py
```

### Step 2: Install Missing Packages
```bash
pip install google-generativeai
```

### Step 3: Verify .env File
Open `backend/.env` and ensure it has:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA
GEMINI_MODEL=gemini-1.5-flash
```

### Step 4: Restart Server
```bash
# Stop the server (Ctrl+C)
# Then start again:
python server.py
```

### Step 5: Test
```bash
curl -X POST http://localhost:10000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

## Still Not Working?

### Check Server Logs
Look for these messages when server starts:
```
✅ AI Service imported successfully
   Provider: gemini
   Model: gemini-1.5-flash
```

If you see:
```
❌ AI Service import failed
```

Then run:
```bash
python check_ai_setup.py
```

And follow the recommendations.

## Quick Test

After fixing, test with:
```bash
cd backend
python test_ai.py
```

This will test all AI features.

## Need Help?

1. Run: `python check_ai_setup.py`
2. Check the output for ❌ marks
3. Follow the recommendations
4. Restart server
5. Test again

---

**Most Common Fix**: Just install the package!
```bash
pip install google-generativeai
```

Then restart the server! 🚀
