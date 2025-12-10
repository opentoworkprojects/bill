# 🔄 WhatsApp Access Token Refresh Guide

## Issue: Access Token Expired or Invalid

The current WhatsApp access token is not working. This is normal - access tokens expire and need to be refreshed.

---

## 🚀 Quick Fix: Get New Access Token

### Step 1: Go to Meta for Developers
1. Visit: https://developers.facebook.com/apps/
2. Log in with your Facebook account
3. Find your app (or create a new one)

### Step 2: Navigate to WhatsApp Settings
1. In your app dashboard, click **WhatsApp** in the left sidebar
2. Click **API Setup** or **Getting Started**
3. You'll see your configuration

### Step 3: Get New Access Token

**Option A: Temporary Token (24 hours)**
1. In the API Setup page, you'll see **"Temporary access token"**
2. Click **"Generate Token"** or copy the existing one
3. This token expires in 24 hours - good for testing only

**Option B: Permanent Token (Recommended)**
1. Click **"Generate permanent token"** or **"System User Token"**
2. Follow the prompts to create a system user
3. Grant necessary permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
4. Copy the permanent token (save it securely!)

### Step 4: Update Your .env File

Replace the old token in `backend/.env`:

```env
WHATSAPP_ACCESS_TOKEN=YOUR_NEW_TOKEN_HERE
```

### Step 5: Verify Phone Number ID

While you're in the Meta dashboard:
1. Check your **Phone Number ID** (should be: 15550051489)
2. Verify your **Business Account ID** (should be: 61584672189701)
3. Make sure the phone number is verified and active

---

## 📋 Complete Setup Checklist

### In Meta Business Suite:

1. **App Created** ✅
   - Go to: https://developers.facebook.com/apps/
   - Create or select your app

2. **WhatsApp Product Added** ✅
   - Add WhatsApp to your app
   - Complete the setup wizard

3. **Phone Number Verified** ⚠️
   - Verify your business phone number
   - Complete the verification process
   - Status should show "Verified"

4. **Business Verification** ⚠️
   - Verify your business (required for production)
   - Submit business documents
   - Wait for approval (1-3 days)

5. **Message Templates Created** ⚠️
   - Create templates for receipts, notifications
   - Submit for approval
   - Wait for approval (24-48 hours)

6. **Test Numbers Added** ⚠️
   - Add test phone numbers
   - These can receive messages during development
   - Go to: API Setup → Test Numbers

---

## 🔧 Current Configuration

**Your WhatsApp Details:**
```
Phone Number ID: 15550051489
Business Account ID: 61584672189701
API Version: v18.0
Access Token: [EXPIRED - NEEDS REFRESH]
```

---

## 🧪 Testing After Token Refresh

### Step 1: Update Token
```bash
# Edit backend/.env
nano backend/.env

# Update this line:
WHATSAPP_ACCESS_TOKEN=YOUR_NEW_TOKEN_HERE
```

### Step 2: Run Test Script
```bash
python test_whatsapp.py
```

### Step 3: Expected Output
```
============================================================
WhatsApp Cloud API Test
============================================================
Phone Number ID: 15550051489
Business Account ID: 61584672189701
API Version: v18.0
Access Token: EAAQ7puWfLQsBQJm...
============================================================

1. Testing API Connection...
   Status Code: 200
   ✅ Connection successful!
   Phone Number: +1 555 005 1489
   Verified Name: BillByteKOT
   Quality Rating: GREEN

2. Testing Message Send to 919876543210...
   Status Code: 200
   ✅ Message sent successfully!
   Message ID: wamid.HBgLMTY1MDI...

3. Testing Template Message to 919876543210...
   Status Code: 200
   ✅ Template sent successfully!
   Message ID: wamid.HBgLMTY1MDI...

============================================================
WhatsApp Cloud API Test Complete!
============================================================

✅ Your WhatsApp integration is ready to use!
```

---

## 🎯 Common Issues & Solutions

### Issue 1: "Access token could not be decrypted"
**Solution:** Token is expired or invalid. Get a new token from Meta dashboard.

### Issue 2: "Phone number not found"
**Solution:** 
- Verify Phone Number ID is correct
- Check phone number is verified in Meta dashboard
- Ensure phone number is active

### Issue 3: "Business account not found"
**Solution:**
- Verify Business Account ID is correct
- Check you have access to the business account
- Ensure business account is active

### Issue 4: "Message template not found"
**Solution:**
- Create message templates in Meta Business Suite
- Submit templates for approval
- Wait for approval (24-48 hours)
- Use approved template names

### Issue 5: "Recipient phone number not allowed"
**Solution:**
- Add recipient to test numbers (during development)
- Or complete business verification (for production)
- Format: Country code + number (e.g., 919876543210)

---

## 📱 Adding Test Phone Numbers

### During Development:
1. Go to: https://developers.facebook.com/apps/
2. Select your app
3. Go to: WhatsApp → API Setup
4. Scroll to **"To"** section
5. Click **"Add phone number"**
6. Enter phone number with country code
7. Verify via SMS code
8. Now you can send test messages to this number

### For Production:
1. Complete business verification
2. Get approved by Meta
3. Then you can send to any phone number

---

## 🔐 Security Best Practices

### 1. Never Commit Tokens to Git
```bash
# Make sure .env is in .gitignore
echo "backend/.env" >> .gitignore
```

### 2. Use Environment Variables
```bash
# In production, set via environment variables
export WHATSAPP_ACCESS_TOKEN="your_token_here"
```

### 3. Rotate Tokens Regularly
- Generate new tokens every 60 days
- Revoke old tokens
- Update in all environments

### 4. Use System User Tokens
- More secure than user access tokens
- Don't expire when user changes password
- Can be managed centrally

---

## 📊 Token Types Comparison

| Type | Duration | Use Case | Security |
|------|----------|----------|----------|
| Temporary | 24 hours | Testing | Low |
| User Token | 60 days | Development | Medium |
| System User | Permanent | Production | High |
| Page Token | Permanent | Production | High |

**Recommendation:** Use System User Token for production

---

## 🎓 Step-by-Step: Get System User Token

### 1. Create System User
1. Go to: https://business.facebook.com/settings/system-users
2. Click **"Add"**
3. Name: "BillByteKOT API"
4. Role: Admin
5. Click **"Create System User"**

### 2. Generate Token
1. Click on the system user you created
2. Click **"Generate New Token"**
3. Select your app
4. Select permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Click **"Generate Token"**
6. Copy and save the token securely

### 3. Assign Assets
1. Click **"Assign Assets"**
2. Select **"Apps"**
3. Select your WhatsApp app
4. Grant full control
5. Save

### 4. Update .env
```env
WHATSAPP_ACCESS_TOKEN=YOUR_SYSTEM_USER_TOKEN_HERE
```

---

## 🚀 Next Steps After Token Refresh

1. **Test Connection**
   ```bash
   python test_whatsapp.py
   ```

2. **Test from Backend**
   ```bash
   cd backend
   python -c "from whatsapp_cloud_api import WhatsAppCloudAPI; api = WhatsAppCloudAPI(); print(api.get_phone_info())"
   ```

3. **Send Test Receipt**
   - Create a test order in BillByteKOT
   - Complete the order
   - Check if WhatsApp receipt is sent

4. **Monitor in Meta Dashboard**
   - Go to: https://business.facebook.com/wa/manage/home/
   - Check message analytics
   - Monitor delivery status
   - Check quality rating

---

## 📞 Support Resources

**Meta Documentation:**
- WhatsApp Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Getting Started: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- Message Templates: https://developers.facebook.com/docs/whatsapp/message-templates

**Meta Business Suite:**
- Dashboard: https://business.facebook.com/
- WhatsApp Manager: https://business.facebook.com/wa/manage/home/
- System Users: https://business.facebook.com/settings/system-users

**BillByteKOT Support:**
- Email: support@billbytekot.in
- Documentation: WHATSAPP_CLOUD_API_SETUP.md

---

## ✅ Quick Checklist

Before testing again:
- [ ] Got new access token from Meta dashboard
- [ ] Updated backend/.env with new token
- [ ] Verified phone number ID is correct
- [ ] Verified business account ID is correct
- [ ] Added test phone numbers (if testing)
- [ ] Completed business verification (if production)
- [ ] Created and approved message templates
- [ ] Ran test script: `python test_whatsapp.py`

---

**Status:** Waiting for Token Refresh

**Last Updated:** December 10, 2024

**Next Action:** Get new access token from Meta dashboard
