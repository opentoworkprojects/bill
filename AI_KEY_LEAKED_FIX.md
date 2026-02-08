# AI Assistant Not Working - API Key Leaked

## 🚨 Problem Identified

Your Gemini API key has been reported as leaked and blocked by Google:
```
403 Your API key was reported as leaked. Please use another API key.
```

## 🔧 Quick Fix (5 minutes)

### Step 1: Get New Gemini API Key

1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the new key

### Step 2: Update .env File

Edit `backend/.env` and replace the old key:

```bash
# OLD (LEAKED - DO NOT USE)
GEMINI_API_KEY=AIzaSyDvYvO5zdeaSPFGA7XDlonlpZvsZuJy4QA

# NEW (Replace with your new key)
GEMINI_API_KEY=your_new_api_key_here
```

### Step 3: Restart Backend Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd backend
python server.py
```

### Step 4: Test AI

```bash
cd backend
python test_gemini_direct.py
```

Should see:
```
✅ Response: Hello from Gemini!
🎉 Gemini is working correctly!
```

---

## 🔒 Security Best Practices

### Why Did This Happen?

API keys can be leaked when:
- Committed to public GitHub repositories
- Shared in documentation
- Exposed in logs or error messages
- Posted in public forums

### How to Prevent Future Leaks

1. **Never commit .env files**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.production
   ```

2. **Use environment variables**
   - Store keys in server environment
   - Use secrets management (AWS Secrets Manager, etc.)

3. **Rotate keys regularly**
   - Generate new keys every 3-6 months
   - Delete old keys immediately

4. **Restrict API key usage**
   - Set IP restrictions in Google Cloud Console
   - Limit to specific APIs only
   - Set usage quotas

---

## 🎯 Alternative: Use Different AI Provider

If you can't get a new Gemini key immediately, switch to OpenAI or Anthropic:

### Option A: OpenAI (GPT-4)

1. Get API key: https://platform.openai.com/api-keys
2. Update `.env`:
   ```bash
   AI_PROVIDER=openai
   OPENAI_API_KEY=your_openai_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

### Option B: Anthropic Claude

1. Get API key: https://console.anthropic.com/
2. Install package:
   ```bash
   pip install anthropic
   ```
3. Update `.env`:
   ```bash
   AI_PROVIDER=anthropic
   ANTHROPIC_API_KEY=your_anthropic_key_here
   ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
   ```

---

## 📋 Verification Checklist

After fixing:

- [ ] New API key generated
- [ ] `.env` file updated
- [ ] Old key deleted from Google Console
- [ ] Server restarted
- [ ] Test script passes
- [ ] AI chat works in app
- [ ] `.env` added to `.gitignore`

---

## 🧪 Testing Commands

### Test Gemini Directly
```bash
cd backend
python test_gemini_direct.py
```

### Test AI Service
```bash
cd backend
python test_ai.py
```

### Test in App
1. Open app
2. Go to Dashboard
3. Click "AI Assistant" or "Get Recommendations"
4. Should see AI responses

---

## 🆘 Still Not Working?

### Check 1: API Key Format
```bash
# Should start with: AIzaSy...
# Length: ~39 characters
```

### Check 2: Environment Variables Loaded
```bash
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('GEMINI_API_KEY'))"
```

### Check 3: Package Installed
```bash
pip list | grep google-generativeai
# Should show: google-generativeai x.x.x
```

### Check 4: Server Logs
Look for errors when server starts:
```
AI Service initialization issue
```

---

## 📞 Support

If you continue having issues:

1. Check server logs for detailed errors
2. Verify API key is active in Google Console
3. Try a different AI provider temporarily
4. Contact support with error logs

---

## 🎉 Success!

Once fixed, you should see:
- ✅ AI chat responses in app
- ✅ Business recommendations working
- ✅ Sales insights generating
- ✅ Menu recommendations appearing

---

**Priority:** 🔴 HIGH - AI features are currently non-functional  
**Time to Fix:** ~5 minutes  
**Difficulty:** 🟢 Easy - Just need new API key
