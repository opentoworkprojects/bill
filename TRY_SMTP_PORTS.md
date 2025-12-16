# 🔧 Try SMTP with Multiple Ports

## What Changed

Updated the SMTP email function to automatically try multiple ports:
1. **Port 465 (SSL)** - Most likely to work on Render
2. **Port 587 (TLS)** - Original configuration
3. **Port 25** - Fallback option

The system will try each port automatically until one works.

---

## Update Render Environment Variables

Go to: https://dashboard.render.com → Your Service → Environment

### Option 1: Try Port 465 (SSL) - RECOMMENDED

**UPDATE this variable:**
```
SMTP_PORT
465
```

**KEEP all other variables the same:**
- EMAIL_PROVIDER = smtp
- SMTP_HOST = smtpout.secureserver.net
- SMTP_USER = shiv@billbytekot.in
- SMTP_PASSWORD = n7_$l_w047
- SMTP_FROM_EMAIL = shiv@billbytekot.in
- SMTP_FROM_NAME = BillByteKOT
- DEBUG_MODE = false

Click "Save Changes" and wait 2-3 minutes.

### Option 2: Try Port 2525 (Alternative)

Some providers use port 2525 as an alternative to 587.

**UPDATE:**
```
SMTP_PORT
2525
```

### Option 3: Use GoDaddy's Alternative SMTP Server

GoDaddy has multiple SMTP servers:

**UPDATE these:**
```
SMTP_HOST
relay-hosting.secureserver.net

SMTP_PORT
25
```

---

## Test After Each Change

### Test 1: Check Render Logs
1. Go to Render Dashboard → Logs
2. Try to register or reset password
3. Look for:

**SUCCESS:**
```
✅ Email sent successfully via SMTP SSL (port 465)
```

**FAILURE:**
```
❌ SMTP port 465 failed: Connection timed out
❌ SMTP port 587 failed: Connection timed out
❌ SMTP port 25 failed: Connection timed out
```

### Test 2: Try Registration
1. Go to: https://billbytekot.in/login
2. Click "Register"
3. Fill in details
4. Check email for OTP

---

## All Port Options to Try

| Port | Type | Command | Likely to Work? |
|------|------|---------|-----------------|
| 465 | SSL | Direct SSL | ⭐⭐⭐ High |
| 587 | TLS | STARTTLS | ⭐ Low (blocked) |
| 2525 | TLS | Alternative | ⭐⭐ Medium |
| 25 | Plain | Basic SMTP | ⭐ Low |

---

## GoDaddy SMTP Servers to Try

Try these SMTP hosts one by one:

1. **smtpout.secureserver.net** (current)
   - Port 465, 587, 25, 2525

2. **relay-hosting.secureserver.net**
   - Port 25, 465

3. **smtpout.asia.secureserver.net** (if in Asia)
   - Port 465, 587

4. **smtpout.europe.secureserver.net** (if in Europe)
   - Port 465, 587

---

## Quick Test Script

Update Render variables and test:

```bash
# Test 1: Port 465
SMTP_PORT=465

# Wait 2-3 minutes for redeploy
# Then test registration

# If fails, try Test 2: Port 2525
SMTP_PORT=2525

# If fails, try Test 3: Alternative host
SMTP_HOST=relay-hosting.secureserver.net
SMTP_PORT=25
```

---

## If All Ports Fail

Render might be blocking ALL outbound SMTP connections.

### Alternative Solutions:

#### 1. Use SendGrid (RECOMMENDED)
- Free tier: 100 emails/day
- Uses HTTPS (not blocked)
- Setup time: 5 minutes
- See: `QUICK_FIX_GUIDE.md`

#### 2. Use Mailgun
- Free tier available
- Uses HTTPS API
- Setup time: 10 minutes

#### 3. Use AWS SES
- Pay as you go ($0.10 per 1000 emails)
- Very reliable
- Requires AWS account

#### 4. Use Resend
- Free tier: 100 emails/day
- Modern API
- Easy setup

---

## Current Status

**Code Updated:** ✅ 
- Now tries ports 465, 587, 25 automatically
- Better error messages
- SSL support added

**Next Step:** 
1. Update SMTP_PORT to 465 in Render
2. Save and wait for redeploy
3. Test registration
4. Check logs

---

## Expected Behavior

### If Port 465 Works:
```
✅ Email sent successfully via SMTP SSL (port 465)
OTP sent via SMTP (port 465)
```

### If All Ports Blocked:
```
❌ SMTP port 465 failed: Connection timed out
❌ SMTP port 587 failed: Connection timed out
❌ SMTP port 25 failed: Connection timed out
All SMTP ports failed
```

If all ports fail, you MUST use SendGrid or another API-based service.

---

## Priority Order

1. **Try port 465** (2 min) - Most likely to work
2. **Try port 2525** (2 min) - Alternative
3. **Try relay-hosting.secureserver.net** (2 min) - Different server
4. **Switch to SendGrid** (5 min) - Guaranteed to work

---

**Total Time:** 5-10 minutes to try all options

**If nothing works:** Render is blocking all SMTP → Must use SendGrid
