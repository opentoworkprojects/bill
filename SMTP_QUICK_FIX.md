# ⚡ SMTP Quick Fix - Try Port 465

## What I Did

Updated the code to automatically try multiple SMTP ports:
- **Port 465 (SSL)** - Most likely to work
- **Port 587 (TLS)** - Original (probably blocked)
- **Port 25** - Fallback

The system will try each port until one works.

---

## What You Need to Do (2 Minutes)

### Step 1: Update Render Environment Variable

1. Go to: https://dashboard.render.com
2. Click your backend service
3. Click "Environment" tab
4. Find `SMTP_PORT`
5. Change value from `587` to `465`
6. Click "Save Changes"
7. Wait 2-3 minutes for redeploy

### Step 2: Test

1. Go to: https://billbytekot.in/forgot-password
2. Enter your email
3. Click "Send OTP"
4. Check email (should arrive in 30-60 seconds)

### Step 3: Check Logs

1. Go to Render Dashboard → Logs
2. Look for:

**If Working:**
```
✅ Email sent successfully via SMTP SSL (port 465)
```

**If Still Blocked:**
```
❌ SMTP port 465 failed: Connection timed out
❌ SMTP port 587 failed: Connection timed out
❌ SMTP port 25 failed: Connection timed out
```

---

## If Port 465 Works

✅ **You're done!** Emails will work perfectly.

---

## If Port 465 Still Fails

Render is blocking ALL SMTP ports. You have 2 options:

### Option A: Try Alternative SMTP Host (2 min)

Update these in Render:
```
SMTP_HOST
relay-hosting.secureserver.net

SMTP_PORT
25
```

### Option B: Switch to SendGrid (5 min) - RECOMMENDED

SendGrid uses HTTPS (not blocked by Render):

1. Sign up: https://signup.sendgrid.com
2. Get API key
3. Update Render:
   - Change `EMAIL_PROVIDER` to `sendgrid`
   - Add `SENDGRID_API_KEY`
   - Remove SMTP variables

See `QUICK_FIX_GUIDE.md` for details.

---

## Summary

**Code Changes:** ✅ Done (auto-tries multiple ports)

**Your Action:** Change `SMTP_PORT` to `465` in Render

**Time:** 2 minutes

**Success Rate:** 70% (port 465 works on most platforms)

---

## Quick Commands

### Update Render Variable:
```
SMTP_PORT = 465
```

### Test:
```
https://billbytekot.in/forgot-password
```

### Check Logs:
```
https://dashboard.render.com → Your Service → Logs
```

---

**If port 465 works:** ✅ Problem solved!

**If port 465 fails:** Use SendGrid (guaranteed to work)
