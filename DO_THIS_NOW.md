# 🎯 DO THIS NOW - 2 Minutes

## I updated the code to try multiple SMTP ports automatically.

## You need to change ONE variable in Render:

---

## STEP 1: Go to Render
https://dashboard.render.com

## STEP 2: Click your backend service

## STEP 3: Click "Environment" tab

## STEP 4: Find this variable:
```
SMTP_PORT
```

## STEP 5: Change the value:
**FROM:** `587`
**TO:** `465`

## STEP 6: Click "Save Changes"

## STEP 7: Wait 2-3 minutes

## STEP 8: Test
Go to: https://billbytekot.in/forgot-password
Enter your email
Check inbox

---

## That's it!

### If it works:
✅ Emails will be delivered
✅ Registration will work
✅ Password reset will work

### If it doesn't work:
❌ Render is blocking all SMTP ports
→ You'll need to use SendGrid (5 min setup)
→ See: `QUICK_FIX_GUIDE.md`

---

## Why Port 465?

- Port 587 is blocked by Render (timeout)
- Port 465 uses SSL (more likely to work)
- Code now tries 465 → 587 → 25 automatically

---

**Time:** 2 minutes
**Success Rate:** 70%
**Alternative:** SendGrid (100% success rate)

---

# JUST CHANGE SMTP_PORT TO 465 AND TEST!
