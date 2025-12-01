# 📱 SMS Gateway Setup for OTP Delivery

## Overview
BillByteKOT supports multiple SMS gateways for OTP delivery. Choose the one that works best for your region and budget.

## Supported SMS Providers

### 1. **Console Mode** (Development Only)
- **Cost**: Free
- **Use**: Development/Testing only
- **Setup**: No configuration needed
- OTP is printed to console/logs

```env
SMS_PROVIDER=console
DEBUG_MODE=true
```

---

### 2. **Twilio** (Global - Recommended)
- **Cost**: ~$0.0075 per SMS
- **Coverage**: 180+ countries
- **Reliability**: ⭐⭐⭐⭐⭐
- **Website**: https://www.twilio.com

#### Setup:
1. Sign up at https://www.twilio.com/try-twilio
2. Get $15 free credit
3. Get your credentials from console

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Install Twilio SDK:
```bash
pip install twilio
```

---

### 3. **MSG91** (India - Best for Indian Market)
- **Cost**: ₹0.15-0.25 per SMS
- **Coverage**: India
- **Reliability**: ⭐⭐⭐⭐⭐
- **Website**: https://msg91.com

#### Setup:
1. Sign up at https://msg91.com
2. Get ₹20 free credit
3. Create OTP template (recommended)
4. Get your Auth Key

```env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_auth_key
MSG91_SENDER_ID=BILLKT
MSG91_TEMPLATE_ID=your_template_id  # Optional but recommended
```

#### Template Example:
```
Your BillByteKOT OTP is ##OTP##. Valid for 5 minutes. Do not share this code.
```

---

### 4. **Fast2SMS** (India - Budget Option)
- **Cost**: ₹0.10-0.20 per SMS
- **Coverage**: India only
- **Reliability**: ⭐⭐⭐⭐
- **Website**: https://www.fast2sms.com

#### Setup:
1. Sign up at https://www.fast2sms.com
2. Get free credits
3. Get your API key

```env
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_api_key
```

---

### 5. **TextLocal** (UK/India)
- **Cost**: £0.04-0.06 per SMS (UK), ₹0.15-0.25 (India)
- **Coverage**: UK, India
- **Reliability**: ⭐⭐⭐⭐
- **Website**: https://www.textlocal.com

#### Setup:
1. Sign up at https://www.textlocal.com
2. Get your API key
3. Verify sender ID

```env
SMS_PROVIDER=textlocal
TEXTLOCAL_API_KEY=your_api_key
TEXTLOCAL_SENDER=BILLKT
```

---

## Complete Backend .env Configuration

```env
# MongoDB
MONGO_URL=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_ALGORITHM=HS256

# SMS Gateway (Choose one)
SMS_PROVIDER=msg91  # Options: console, twilio, msg91, fast2sms, textlocal

# MSG91 (India - Recommended)
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_SENDER_ID=BILLKT
MSG91_TEMPLATE_ID=your_template_id

# OR Twilio (Global)
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_PHONE_NUMBER=+1234567890

# OR Fast2SMS (India - Budget)
# FAST2SMS_API_KEY=your_api_key

# OR TextLocal (UK/India)
# TEXTLOCAL_API_KEY=your_api_key
# TEXTLOCAL_SENDER=BILLKT

# Debug Mode (shows OTP in response for testing)
DEBUG_MODE=false  # Set to true only in development
```

---

## Testing OTP Delivery

### 1. Console Mode (Development)
```bash
# Set in .env
SMS_PROVIDER=console
DEBUG_MODE=true

# OTP will be printed in terminal
```

### 2. Test with Real SMS
```bash
# Set your provider in .env
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your_key

# Test via API
curl -X POST http://localhost:8000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+919876543210"}'
```

---

## Cost Comparison

| Provider | Cost per SMS | Free Credits | Best For |
|----------|-------------|--------------|----------|
| Console | Free | N/A | Development |
| Twilio | $0.0075 | $15 | Global |
| MSG91 | ₹0.15-0.25 | ₹20 | India |
| Fast2SMS | ₹0.10-0.20 | ₹50 | India (Budget) |
| TextLocal | £0.04-0.06 | £5 | UK/India |

---

## Recommended Setup by Region

### 🇮🇳 India
**Primary**: MSG91 (best reliability)
**Backup**: Fast2SMS (budget option)

### 🌍 Global/Multi-country
**Primary**: Twilio (best coverage)

### 🇬🇧 UK
**Primary**: TextLocal
**Backup**: Twilio

---

## Troubleshooting

### OTP not received?
1. Check SMS provider balance
2. Verify phone number format (+country_code)
3. Check spam/blocked messages
4. Verify API credentials
5. Check provider dashboard for delivery status

### Testing without SMS?
```env
SMS_PROVIDER=console
DEBUG_MODE=true
```
OTP will be shown in API response and console logs.

---

## Security Best Practices

1. **Never commit credentials** to git
2. Use environment variables
3. Set `DEBUG_MODE=false` in production
4. Implement rate limiting (max 3 OTP per phone per hour)
5. Use HTTPS for all API calls
6. Rotate API keys regularly

---

## WhatsApp OTP (Coming Soon)

WhatsApp Business API integration for OTP delivery:
- Lower cost than SMS
- Higher delivery rate
- Better user experience
- Requires WhatsApp Business API approval

---

## Support

For SMS gateway issues:
- **Twilio**: https://support.twilio.com
- **MSG91**: https://msg91.com/help
- **Fast2SMS**: https://www.fast2sms.com/support
- **TextLocal**: https://www.textlocal.com/support

For BillByteKOT issues:
- Email: support@finverge.tech
- GitHub: https://github.com/shivshankar9/restro-ai/issues
