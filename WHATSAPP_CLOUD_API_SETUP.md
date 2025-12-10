# 📱 WhatsApp Cloud API Integration - Complete Setup Guide

## ✨ What's New

Users can now receive receipts and order updates directly on WhatsApp **without logging in**! The system sends messages automatically using Meta's official WhatsApp Business Cloud API.

---

## 🎯 Features

✅ **Automated Receipt Delivery** - Send bills directly to customer WhatsApp
✅ **Order Status Updates** - Real-time notifications (preparing, ready, completed)
✅ **OTP via WhatsApp** - Login verification through WhatsApp
✅ **No User Login Required** - Fully automated, server-side sending
✅ **Professional Formatting** - Beautiful receipt templates with emojis
✅ **Order Tracking Links** - Include tracking URLs in messages
✅ **Multi-language Support** - Send in any language

---

## 📋 Prerequisites

1. **Meta Business Account** - Free to create
2. **WhatsApp Business Account** - Linked to Meta
3. **Phone Number** - For WhatsApp Business (can be new number)
4. **Facebook Developer Account** - Free

---

## 🚀 Step-by-Step Setup

### Step 1: Create Meta App

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"**
3. Select **"Business"** as app type
4. Fill in app details:
   - **App Name:** BillByteKOT (or your restaurant name)
   - **Contact Email:** Your email
   - **Business Account:** Select or create one
5. Click **"Create App"**

### Step 2: Add WhatsApp Product

1. In your app dashboard, find **"Add Products"**
2. Click **"Set Up"** on **WhatsApp**
3. Select **"Business Account"** or create new one
4. Complete the setup wizard

### Step 3: Get Phone Number

**Option A: Use Test Number (Free, for testing)**
1. In WhatsApp settings, you'll see a test number
2. Add your personal number to test recipients
3. Use this for development

**Option B: Add Your Own Number (Production)**
1. Click **"Add Phone Number"**
2. Verify your business phone number
3. Complete verification (SMS/Call)
4. This number will send messages to customers

### Step 4: Get API Credentials

1. In WhatsApp settings, go to **"API Setup"**
2. Copy these values:

   **Phone Number ID:**
   ```
   Example: 123456789012345
   ```
   
   **Temporary Access Token:**
   ```
   Example: EAABsbCS1iHgBO7ZC8wc...
   ```
   
   **WhatsApp Business Account ID:**
   ```
   Example: 987654321098765
   ```

### Step 5: Generate Permanent Access Token

**Important:** Temporary tokens expire in 24 hours!

1. Go to **"System Users"** in Business Settings
2. Create a new system user:
   - Name: BillByteKOT API
   - Role: Admin
3. Click **"Generate New Token"**
4. Select your app
5. Select permissions:
   - ✅ `whatsapp_business_messaging`
   - ✅ `whatsapp_business_management`
6. Copy the **permanent token** (save it securely!)

### Step 6: Configure Backend

Update `backend/.env` file:

```env
# WhatsApp Cloud API Configuration
WHATSAPP_PHONE_NUMBER_ID=15550051489

WHATSAPP_ACCESS_TOKEN=EAAQ7puWfLQsBQJmfBDVLzsIJR0WXVY4yi7YApQw4WDouKzWHEGEc1ZAn2SaZCWV3IZBKPRVRnDIoBbMcPmZAVcGzY4kAVewnEVFcmwqG0Q744WAWQCsXbB6qpReBb6HxEZBgBQElahPlg8LTGEhcPZAj4xYGNqZAhO1u2FfTR0d7Ea54OopMZAkq0xbl7nwnHdWIYH3leAjps8h3p9lNovcz03fbr72elPDJ2hpkpmRA

WHATSAPP_BUSINESS_ACCOUNT_ID=61584672189701
WHATSAPP_API_VERSION=v18.0
```

### Step 7: Restart Backend

```bash
cd backend
# If using Render, push to git
git add .
git commit -m "Add WhatsApp Cloud API credentials"
git push origin main

# If running locally
python server.py
```

### Step 8: Test Connection

1. Login to BillByteKOT as admin
2. Go to Settings → WhatsApp
3. Click **"Test Connection"**
4. You should see: ✅ "WhatsApp Cloud API connected"

---

## 🧪 Testing

### Test 1: Send Receipt

1. Create a test order
2. Go to billing page
3. Enter customer phone number (with country code)
4. Click **"Send via WhatsApp"**
5. Customer receives receipt on WhatsApp instantly!

### Test 2: Order Status Updates

1. Create order with customer phone
2. Update order status (preparing → ready)
3. Customer receives automatic WhatsApp notification

### Test 3: OTP Login

1. Go to login page
2. Select "Login with WhatsApp"
3. Enter phone number
4. Receive OTP on WhatsApp
5. Enter OTP to login

---

## 📱 Phone Number Format

**Correct formats:**
- `+919876543210` (with country code)
- `919876543210` (without + sign)
- `9876543210` (system adds +91 for India)

**System automatically:**
- Removes spaces, dashes, brackets
- Adds country code if missing
- Validates format

---

## 💬 Message Templates

### Receipt Message
```
🧾 *Restaurant Name*
━━━━━━━━━━━━━━━━━━━━

📋 Order #ABC12345
📅 09 Dec 2024, 02:30 PM

🍽️ *Items:*
  2× Margherita Pizza - ₹598.00
  1× Coke - ₹50.00

💰 *Bill Summary:*
Subtotal: ₹648.00
Tax: ₹32.40
━━━━━━━━━━━━━━━━━━━━
*Total: ₹680.40*

✨ Thank you for dining with us!
🌐 billbytekot.in
📞 +91-XXXXXXXXXX

_Powered by BillByteKOT_
```

### Status Update Message
```
👨‍🍳 *Restaurant Name*

Your order is being prepared!

📋 Order #ABC12345
🕐 02:35 PM

🔗 Track your order:
https://billbytekot.in/track/xyz789

_Powered by BillByteKOT_
```

### OTP Message
```
🔐 *BillByteKOT*

Your verification code is:

*123456*

Valid for 5 minutes.
Do not share this code with anyone.

_Powered by BillByteKOT_
```

---

## 🔧 API Endpoints

### Send Receipt
```http
POST /api/whatsapp/cloud/send-receipt/{order_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "phone_number": "+919876543210",
  "customer_name": "John Doe"
}
```

### Send Status Update
```http
POST /api/whatsapp/cloud/send-status
Authorization: Bearer {token}
Content-Type: application/json

{
  "order_id": "abc123",
  "status": "preparing",
  "phone_number": "+919876543210"
}
```

### Test Connection
```http
GET /api/whatsapp/cloud/test
Authorization: Bearer {token}
```

### Check Status
```http
GET /api/whatsapp/cloud/status
```

---

## ⚙️ Configuration Options

### In Business Settings:

```javascript
{
  "whatsapp_enabled": true,
  "whatsapp_auto_notify": true,
  "whatsapp_notify_on_placed": true,
  "whatsapp_notify_on_preparing": true,
  "whatsapp_notify_on_ready": true,
  "whatsapp_notify_on_completed": true,
  "whatsapp_message_template": "Custom template...",
  "frontend_url": "https://billbytekot.in"
}
```

---

## 🎨 Customization

### Custom Message Template

Variables available:
- `{restaurant_name}` - Your restaurant name
- `{order_id}` - Order ID
- `{customer_name}` - Customer name
- `{total}` - Total amount
- `{currency}` - Currency symbol
- `{subtotal}` - Subtotal amount
- `{tax}` - Tax amount
- `{table_number}` - Table number
- `{waiter_name}` - Waiter name
- `{items}` - Itemized list

Example:
```
Hello {customer_name}! 

Your order #{order_id} at {restaurant_name} is ready!

Total: {currency}{total}

Thank you! 🙏
```

---

## 💰 Pricing

**WhatsApp Cloud API Pricing:**
- First 1,000 conversations/month: **FREE**
- After that: ~₹0.50 per conversation
- A conversation = 24-hour window with customer

**For most restaurants:**
- 100 orders/day = 3,000 messages/month
- Cost: ~₹1,000/month (after free tier)
- Much cheaper than SMS!

---

## 🔒 Security

✅ **Permanent tokens** - Stored securely in environment variables
✅ **HTTPS only** - All API calls encrypted
✅ **Rate limiting** - Prevents abuse
✅ **Phone validation** - Ensures valid numbers
✅ **Admin only** - Configuration restricted to admins

---

## 🐛 Troubleshooting

### Issue: "WhatsApp Cloud API not configured"

**Solution:**
1. Check `.env` file has all credentials
2. Restart backend server
3. Verify credentials are correct

### Issue: "Failed to send message"

**Possible causes:**
1. **Invalid phone number** - Check format
2. **Token expired** - Generate new permanent token
3. **Number not verified** - Add to test recipients
4. **Rate limit** - Wait a few minutes

**Check:**
```bash
# Test API connection
curl -X GET https://your-backend.com/api/whatsapp/cloud/status
```

### Issue: "Message not received"

**Check:**
1. Phone number is correct
2. Customer has WhatsApp installed
3. Number is not blocked
4. Check Meta Business Suite for delivery status

### Issue: "Template not approved"

**Solution:**
- Use text messages (no template needed)
- Or submit template for approval in Meta Business Suite
- Approval takes 1-2 business days

---

## 📊 Monitoring

### Check Message Status

1. Go to **Meta Business Suite**
2. Select your WhatsApp account
3. View **"Insights"** → **"Messages"**
4. See delivery rates, read rates, etc.

### Backend Logs

```bash
# Check if messages are being sent
tail -f backend/logs/whatsapp.log

# Or in Render dashboard
# Go to Logs tab
```

---

## 🚀 Going Live

### Checklist:

- [ ] Meta App created
- [ ] WhatsApp Business verified
- [ ] Phone number added and verified
- [ ] Permanent access token generated
- [ ] Credentials added to `.env`
- [ ] Backend restarted
- [ ] Test connection successful
- [ ] Test message sent and received
- [ ] Business settings configured
- [ ] Staff trained on feature

### Production Tips:

1. **Use dedicated number** - Don't use personal WhatsApp
2. **Monitor usage** - Check Meta Business Suite regularly
3. **Set up billing** - Add payment method for after free tier
4. **Enable auto-notify** - For better customer experience
5. **Customize templates** - Match your brand voice

---

## 📚 Resources

- **Meta Developers:** https://developers.facebook.com/docs/whatsapp
- **WhatsApp Business API:** https://business.whatsapp.com/
- **API Reference:** https://developers.facebook.com/docs/whatsapp/cloud-api
- **Business Manager:** https://business.facebook.com/

---

## 🆘 Support

**Need help?**
- Email: support@billbytekot.in
- WhatsApp: +91-XXXXXXXXXX
- Documentation: https://billbytekot.in/docs

---

## 🎉 Success!

Once configured, your customers will receive:
- ✅ Instant receipt on WhatsApp
- ✅ Real-time order updates
- ✅ Professional formatted messages
- ✅ Order tracking links
- ✅ No app download needed!

**Your restaurant just got a lot smarter! 🚀**

---

**Last Updated:** December 9, 2025
**Version:** 1.0
**Status:** Production Ready ✅
