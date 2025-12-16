# 🔧 Fix Production Issues - Complete Guide

## Issues Identified

1. ❌ **OTP emails not delivered** - SMTP timeout (port 587 blocked)
2. ❌ **Settings not saving** - API/backend errors
3. ❌ **Failed to fetch subscription** - API connection issues
4. ❌ **Data not visible** - Backend/database issues

---

## SOLUTION 1: Fix Email Delivery (CRITICAL)

### Problem
```
Email service error: [Errno 110] Connection timed out
```

Render blocks SMTP port 587. You MUST switch to SendGrid.

### Quick Fix (10 minutes)

#### Step 1: Sign Up for SendGrid
1. Go to: https://signup.sendgrid.com
2. Sign up (FREE - 100 emails/day)
3. Verify your email

#### Step 2: Get API Key
1. Go to: https://app.sendgrid.com/settings/api_keys
2. Click **"Create API Key"**
3. Name: `BillByteKOT Production`
4. Permissions: **Full Access**
5. Click **"Create & View"**
6. **COPY THE KEY** (starts with `SG.`)

#### Step 3: Verify Sender Email
1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **"Create New Sender"**
3. Fill in:
   - From Name: `BillByteKOT`
   - From Email: `shiv@billbytekot.in`
   - Reply To: `shiv@billbytekot.in`
4. Click **"Create"**
5. **Check email** (shiv@billbytekot.in) for verification
6. **Click verification link**

#### Step 4: Update Render Environment Variables

Go to: https://dashboard.render.com → Your Service → Environment

**REMOVE these:**
- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASSWORD

**ADD/UPDATE these:**
```
EMAIL_PROVIDER
sendgrid

SENDGRID_API_KEY
SG.your-actual-api-key-here

SMTP_FROM_EMAIL
shiv@billbytekot.in

SMTP_FROM_NAME
BillByteKOT

DEBUG_MODE
false
```

#### Step 5: Save & Wait
1. Click **"Save Changes"**
2. Wait 2-3 minutes for redeploy
3. Watch logs for: `✅ OTP sent via SendGrid`

### Test Email
1. Go to: https://billbytekot.in/forgot-password
2. Enter your email
3. Should receive OTP in 10-30 seconds

---

## SOLUTION 2: Fix Settings Not Saving

### Check Render Logs

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Go to **"Logs"** tab
4. Look for errors when saving settings

### Common Issues

#### Issue A: MongoDB Connection
**Symptom:** "Failed to connect to database"

**Fix:**
1. Check MongoDB Atlas is running
2. Verify IP whitelist (0.0.0.0/0 for all IPs)
3. Check connection string in Render env vars

#### Issue B: CORS Errors
**Symptom:** "CORS policy blocked"

**Fix:** Already configured for billbytekot.in

#### Issue C: Authentication Errors
**Symptom:** "Unauthorized" or "Invalid token"

**Fix:**
1. Clear browser cache
2. Logout and login again
3. Check token in localStorage

### Manual Test Settings API

```bash
# Get current settings
curl https://restro-ai.onrender.com/api/business/settings \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update settings
curl -X PUT https://restro-ai.onrender.com/api/business/settings \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"restaurant_name": "Test Restaurant"}'
```

---

## SOLUTION 3: Fix Subscription Fetch

### Problem
"Failed to fetch subscription" error

### Causes
1. Backend not responding
2. API endpoint missing
3. Database query failing
4. CORS issue

### Fix Steps

#### Step 1: Check Backend Health
```bash
curl https://restro-ai.onrender.com/health
```

Should return: `{"status": "healthy"}`

#### Step 2: Check Subscription Endpoint
```bash
curl https://restro-ai.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Should return user data with subscription info.

#### Step 3: Check Render Logs
Look for errors related to:
- `/api/auth/me`
- `/api/subscription`
- Database queries

---

## SOLUTION 4: Fix Data Not Visible

### Possible Causes
1. Backend sleeping (Render free tier)
2. Database connection lost
3. API timeout
4. Frontend cache issue

### Quick Fixes

#### Fix A: Wake Up Backend
```bash
# Ping backend to wake it up
curl https://restro-ai.onrender.com/health
```

Render free tier sleeps after 15 minutes of inactivity.

#### Fix B: Clear Browser Cache
1. Open DevTools (F12)
2. Go to Application tab
3. Clear Storage → Clear site data
4. Refresh page

#### Fix C: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for failed requests (red)
5. Click failed request to see error

#### Fix D: Force Reload
1. Press `Ctrl + Shift + R` (Windows)
2. Or `Cmd + Shift + R` (Mac)
3. This bypasses cache

---

## SOLUTION 5: Keep Backend Awake

### Problem
Render free tier sleeps after 15 minutes, causing first request to be slow.

### Fix: Use Keep-Alive Service

Already configured in `.github/workflows/keep-alive.yml`

**Verify it's running:**
1. Go to: https://github.com/shivshankar9/restro-ai/actions
2. Check "Keep Render Service Alive" workflow
3. Should run every 14 minutes

**If not working:**
1. Go to repository Settings → Actions
2. Enable workflows
3. Manually trigger workflow

---

## COMPLETE CHECKLIST

### Email (CRITICAL - Do This First)

- [ ] Sign up for SendGrid
- [ ] Get API key
- [ ] Verify sender email (shiv@billbytekot.in)
- [ ] Update Render environment variables
- [ ] Remove SMTP variables
- [ ] Add SendGrid variables
- [ ] Save and wait for redeploy
- [ ] Test registration email
- [ ] Test password reset email

### Backend Health

- [ ] Check Render service is running
- [ ] Check logs for errors
- [ ] Test health endpoint
- [ ] Verify MongoDB connection
- [ ] Check environment variables are set

### Frontend

- [ ] Clear browser cache
- [ ] Test login
- [ ] Test settings save
- [ ] Test subscription fetch
- [ ] Check console for errors

### Database

- [ ] MongoDB Atlas is running
- [ ] IP whitelist includes 0.0.0.0/0
- [ ] Connection string is correct
- [ ] Database has data

---

## Quick Diagnostic Commands

### Test Backend
```bash
# Health check
curl https://restro-ai.onrender.com/health

# Test API
curl https://restro-ai.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Render Status
1. Go to: https://dashboard.render.com
2. Check service status (should be "Live")
3. Check logs for errors
4. Check environment variables

### Check Frontend
1. Open: https://billbytekot.in
2. Open DevTools (F12)
3. Go to Console tab
4. Look for errors (red text)
5. Go to Network tab
6. Look for failed requests (red)

---

## Expected Behavior After Fixes

### Email
- ✅ Registration OTP arrives in 10-30 seconds
- ✅ Password reset OTP arrives in 10-30 seconds
- ✅ Welcome email sent after registration
- ✅ No timeout errors in logs

### Settings
- ✅ Business settings save successfully
- ✅ Changes reflect immediately
- ✅ No "Failed to save" errors
- ✅ Toast notification shows success

### Subscription
- ✅ Subscription status loads on dashboard
- ✅ Trial banner shows correct days remaining
- ✅ No "Failed to fetch" errors

### Data
- ✅ Dashboard loads quickly
- ✅ Menu items visible
- ✅ Orders display correctly
- ✅ Reports generate successfully

---

## Priority Order

**Do these in order:**

1. **FIX EMAIL FIRST** (SendGrid setup) - 10 minutes
2. Check Render logs for errors - 2 minutes
3. Test all features - 5 minutes
4. Clear browser cache if issues persist - 1 minute
5. Check MongoDB connection - 2 minutes

---

## Support

### If Still Having Issues

**Check Render Logs:**
```
https://dashboard.render.com → Your Service → Logs
```

**Check Browser Console:**
```
F12 → Console tab → Look for errors
```

**Test API Directly:**
```bash
curl https://restro-ai.onrender.com/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Common Error Messages:**

| Error | Cause | Fix |
|-------|-------|-----|
| Connection timeout | SMTP blocked | Use SendGrid |
| Failed to fetch | Backend sleeping | Wait 30s, retry |
| CORS error | Wrong origin | Already fixed |
| Unauthorized | Invalid token | Logout, login again |
| Database error | MongoDB issue | Check Atlas |

---

**Estimated Total Fix Time:** 15-20 minutes
**Priority:** HIGH - Production is broken
**Status:** Waiting for SendGrid setup

## NEXT STEPS

1. **RIGHT NOW:** Set up SendGrid (10 min)
2. **THEN:** Update Render env vars (2 min)
3. **FINALLY:** Test everything (5 min)

**Once SendGrid is configured, ALL issues should be resolved.**
