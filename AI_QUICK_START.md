# 🚀 AI Quick Start Guide

## ⚡ 3-Step Setup

### Step 1: Install Dependencies
```bash
cd backend
pip install google-generativeai
```

### Step 2: Test AI
```bash
python test_ai.py
```

### Step 3: Start Server
```bash
python server.py
```

## ✅ That's It!

Your AI is now running with **Google Gemini** (FREE)!

## 🧪 Quick Tests

### Test Chat (No Auth Required)
```bash
curl -X POST http://localhost:10000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Test in Browser
1. Open: http://localhost:10000
2. Login to dashboard
3. Look for "AI Assistant" panel
4. Start chatting!

## 📊 Features Available

✅ AI Chat Assistant
✅ Menu Recommendations  
✅ Sales Forecasting
✅ Inventory Insights

## 💰 Cost

**FREE** - 15 requests/minute with Gemini!

## 🆘 Issues?

1. Check `.env` has: `AI_PROVIDER=gemini`
2. Verify API key is set
3. Run: `python test_ai.py`
4. Check logs for errors

## 📚 Full Documentation

- `GEMINI_AI_READY.md` - Complete setup guide
- `backend/AI_SETUP_GUIDE.md` - Detailed instructions
- `AI_INTEGRATION_COMPLETE.md` - Feature overview

---

**🎉 Your AI is ready! Start using it now!** 🚀
