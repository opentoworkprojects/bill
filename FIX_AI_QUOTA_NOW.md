# Fix AI Quota Issue - Quick Guide

## 🚨 Problem
Gemini API quota exceeded: **0 requests remaining**

## ⚡ Quick Fix: Switch to OpenAI (5 min)

### 1. Get OpenAI Key (2 min)
👉 https://platform.openai.com/api-keys
- Sign up (get $5 free credit = ~33,000 requests!)
- Click "Create new secret key"
- Copy the key (starts with `sk-`)

### 2. Update .env (1 min)
Edit `backend/.env` lines 60-62:
```bash
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Restart Server (1 min)
```bash
# Stop server (Ctrl+C)
cd backend
python server.py
```

### 4. Test (1 min)
```bash
cd backend
python test_ai.py
```

Should see: `✅ Response: [AI response]`

---

## ✅ Done!

AI assistant will now work with OpenAI GPT-4o-mini.

**Free tier:** $5 credit = ~33,000 AI requests  
**Quality:** Excellent  
**Speed:** Fast

---

## 🔄 Alternative: Wait for Gemini

Gemini quota resets at **midnight UTC**.  
Check current time: https://time.is/UTC

---

## 📚 Full Guide
See `AI_QUOTA_EXCEEDED_SOLUTION.md` for all options.

---

**Time:** 5 minutes  
**Cost:** Free ($5 credit)  
**Difficulty:** Easy
