# AI Assistant - Quota Exceeded Solution

## 🚨 Current Status

Both Gemini API keys have issues:
1. **Old key:** Leaked and blocked by Google
2. **New key:** Free tier quota exceeded (0 requests remaining)

## ⚡ Immediate Solutions

### Option 1: Wait for Quota Reset (Free)
Gemini free tier quotas reset:
- **Per minute:** Resets every 60 seconds
- **Per day:** Resets at midnight UTC

**Action:** Wait until tomorrow (midnight UTC) and try again.

### Option 2: Use Different AI Provider (Recommended)

#### A. OpenAI GPT-4 (Best Performance)
```bash
# 1. Get API key: https://platform.openai.com/api-keys
# 2. Update backend/.env:
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_key_here
OPENAI_MODEL=gpt-4o-mini

# 3. Restart server
```

**Pricing:** $0.15 per 1M input tokens, $0.60 per 1M output tokens  
**Free tier:** $5 credit for new accounts

#### B. Anthropic Claude (High Quality)
```bash
# 1. Install package:
pip install anthropic

# 2. Get API key: https://console.anthropic.com/
# 3. Update backend/.env:
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# 4. Restart server
```

**Pricing:** $3 per 1M input tokens, $15 per 1M output tokens  
**Free tier:** $5 credit for new accounts

### Option 3: Upgrade Gemini to Paid Plan

1. Go to: https://ai.google.dev/pricing
2. Enable billing in Google Cloud Console
3. Upgrade to paid tier
4. Much higher quotas available

---

## 🔧 Quick Fix: Switch to OpenAI

This is the fastest solution:

### Step 1: Get OpenAI API Key
1. Go to: https://platform.openai.com/api-keys
2. Sign up (get $5 free credit)
3. Create new API key
4. Copy the key

### Step 2: Update .env
Edit `backend/.env`:
```bash
# Change these lines:
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
```

### Step 3: Restart Server
```bash
cd backend
python server.py
```

### Step 4: Test
```bash
cd backend
python test_ai.py
```

---

## 📊 Comparison

| Provider | Free Tier | Quality | Speed | Cost (Paid) |
|----------|-----------|---------|-------|-------------|
| **Gemini** | 1500 req/day | Good | Fast | $0.075/1M |
| **OpenAI** | $5 credit | Excellent | Fast | $0.15/1M |
| **Claude** | $5 credit | Excellent | Medium | $3/1M |

---

## 🎯 Recommended Approach

### For Development/Testing
Use **OpenAI GPT-4o-mini**:
- $5 free credit = ~33,000 requests
- Excellent quality
- Fast responses
- Easy setup

### For Production
Consider **Gemini Paid**:
- Lowest cost ($0.075/1M tokens)
- Good quality
- Fast responses
- Already integrated

---

## 🔄 Update AI Service for Multiple Providers

Your `ai_service.py` already supports all three providers! Just update the `.env` file.

### Current Configuration
```python
# backend/ai_service.py supports:
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google Gemini

# Switch by changing AI_PROVIDER in .env
```

---

## 🧪 Testing Each Provider

### Test OpenAI
```bash
# Update .env:
AI_PROVIDER=openai
OPENAI_API_KEY=your_key

# Test:
python test_ai.py
```

### Test Anthropic
```bash
# Install first:
pip install anthropic

# Update .env:
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key

# Test:
python test_ai.py
```

### Test Gemini (when quota resets)
```bash
# Update .env:
AI_PROVIDER=gemini
GEMINI_API_KEY=your_key

# Test:
python test_ai.py
```

---

## 💡 Cost Optimization Tips

### 1. Use Shorter Prompts
Current prompts are optimized (150 words max)

### 2. Cache Responses
Implement caching for common queries

### 3. Rate Limiting
Limit AI requests per user/hour

### 4. Fallback Strategy
```python
# Try Gemini first (cheapest)
# Fall back to OpenAI if quota exceeded
# Fall back to Claude if both fail
```

---

## 🚀 Quick Start: OpenAI Setup

### 1-Minute Setup
```bash
# 1. Get key from: https://platform.openai.com/api-keys

# 2. Edit backend/.env (lines 60-62):
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini

# 3. Restart:
cd backend
python server.py

# 4. Test in app - AI should work!
```

---

## 📞 Support

### If OpenAI Doesn't Work
1. Check API key is valid
2. Verify you have credits: https://platform.openai.com/usage
3. Check server logs for errors

### If Anthropic Doesn't Work
1. Ensure `anthropic` package installed: `pip install anthropic`
2. Check API key is valid
3. Verify credits available

### If Gemini Still Doesn't Work
1. Wait for quota reset (midnight UTC)
2. Check quota usage: https://ai.dev/rate-limit
3. Consider upgrading to paid plan

---

## ✅ Success Checklist

After switching providers:

- [ ] API key added to `.env`
- [ ] `AI_PROVIDER` updated
- [ ] Server restarted
- [ ] Test script passes
- [ ] AI chat works in app
- [ ] Recommendations generate
- [ ] Sales insights appear

---

## 🎉 Recommended Action

**Switch to OpenAI now** (5 minutes):
1. Get free $5 credit
2. Update 3 lines in `.env`
3. Restart server
4. AI works immediately!

Then later, when Gemini quota resets or you upgrade, you can switch back.

---

**Priority:** 🔴 HIGH  
**Time to Fix:** 5 minutes (OpenAI)  
**Cost:** Free ($5 credit)  
**Difficulty:** 🟢 Easy
