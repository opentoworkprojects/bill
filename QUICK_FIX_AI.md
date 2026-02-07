# 🔧 Quick Fix for AI Not Working

## The Problem
AI is not responding in the dashboard.

## The Solution (3 Steps)

### Step 1: Install AI Package
**Windows:**
```bash
cd backend
install_ai.bat
```

**Mac/Linux:**
```bash
cd backend
chmod +x install_ai.sh
./install_ai.sh
```

**Or manually:**
```bash
cd backend
pip install google-generativeai
```

### Step 2: Verify Installation
```bash
python check_ai_setup.py
```

You should see:
```
✅ google-generativeai installed
✅ Gemini configured
```

### Step 3: Restart Server
Stop your server (Ctrl+C) and start again:
```bash
python server.py
```

## Test It Works

### Quick Test
```bash
python test_ai.py
```

### Test in Browser
1. Open your dashboard
2. Look for "AI Assistant" section
3. Type: "Hello"
4. You should get a response!

## Still Not Working?

### Check 1: Is the package installed?
```bash
pip list | grep google-generativeai
```

Should show: `google-generativeai  x.x.x`

### Check 2: Is the API key set?
Open `backend/.env` and verify:
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA
```

### Check 3: Run diagnostic
```bash
cd backend
python check_ai_setup.py
```

Fix any ❌ marks shown.

## Common Errors

### Error: "ModuleNotFoundError: No module named 'google.generativeai'"
**Fix**: Run `pip install google-generativeai`

### Error: "AI assistant is temporarily unavailable"
**Fix**: 
1. Check `.env` has `GEMINI_API_KEY`
2. Restart server
3. Run `python check_ai_setup.py`

### Error: "Failed to get AI response"
**Fix**:
1. Install package: `pip install google-generativeai`
2. Restart server
3. Clear browser cache
4. Try again

## Need More Help?

Run the diagnostic tool:
```bash
cd backend
python check_ai_setup.py
```

It will tell you exactly what's wrong!

---

**Most Common Fix**: Just install the package!
```bash
pip install google-generativeai
```

Then restart! 🚀
