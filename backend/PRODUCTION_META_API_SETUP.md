# Production Meta Business Manager API Setup Guide

## Overview

This guide helps you configure the production Meta Business Manager API access token for real template validation in the WhatsApp message delivery fix.

## Current Status

✅ **Meta API Integration Code**: Fully implemented and tested  
✅ **Database Schema**: WhatsApp template tracking collection created  
✅ **Fallback System**: Conservative validation with safe defaults  
⚠️ **Production Token**: Currently using test tokens - needs production setup  

## Step 1: Meta Business Manager Setup

### 1.1 Access Meta Business Manager
1. Go to [business.facebook.com](https://business.facebook.com)
2. Select your business account that contains your WhatsApp Business API
3. Navigate to **WhatsApp** → **API Setup**

### 1.2 Get Your Business Account ID (WABA ID)
1. In Meta Business Manager, go to **WhatsApp** → **Getting Started**
2. Copy your **WhatsApp Business Account ID** (starts with numbers, e.g., `102290129340398`)
3. This is your `WHATSAPP_BUSINESS_ACCOUNT_ID`

### 1.3 Verify Template Access Permissions
1. Go to **WhatsApp** → **Message Templates**
2. Ensure you can see all your approved templates
3. Note the exact template names and their categories (UTILITY vs MARKETING)

## Step 2: Access Token Configuration

### 2.1 Current Token Verification
Your current access token should already have these permissions:
- `whatsapp_business_messaging` (for sending messages)
- `whatsapp_business_management` (for template queries)

### 2.2 Test Token Permissions
Run this command to verify your token has template access:

```bash
cd backend
python -c "
import asyncio
from whatsapp_cloud_api import WhatsAppCloudAPI

async def test_token():
    api = WhatsAppCloudAPI()
    if api.is_configured():
        print('✅ WhatsApp API configured')
        try:
            # Test template query
            result = await api.get_template_info('payment_receipt', 'en_US')
            print('✅ Template API access working')
            print(f'Result: {result}')
        except Exception as e:
            print(f'❌ Template API access failed: {e}')
            print('Need to configure WHATSAPP_BUSINESS_ACCOUNT_ID')
    else:
        print('❌ WhatsApp API not configured')

asyncio.run(test_token())
"
```

### 2.3 Add Business Account ID
Add this to your `.env` file:

```bash
# Add this line to your .env file
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id_here

# Your existing variables (keep these)
WHATSAPP_PHONE_NUMBER_ID=894660290402588
WHATSAPP_ACCESS_TOKEN=your_existing_token
WHATSAPP_API_VERSION=v18.0
```

## Step 3: Template Category Verification

### 3.1 Check Your Templates in Meta Business Manager
1. Go to **WhatsApp** → **Message Templates**
2. For each template, verify the **Category**:
   - ✅ **UTILITY**: Can send outside 24-hour window
   - ⚠️ **MARKETING**: Requires 24-hour customer service window

### 3.2 Current Template Status
Based on the fix analysis, here's what we found:

| Template Name | Current Behavior | Recommended Action |
|---------------|------------------|-------------------|
| `bill_confirmation` | ⚠️ Potentially MARKETING | Verify category in Meta Business Manager |
| `payment_receipt` | ✅ UTILITY (safe fallback) | Keep as primary receipt template |
| `order_preparing` | ✅ UTILITY | Good for status updates |
| `order_ready` | ✅ UTILITY | Good for status updates |
| `order_completed` | ✅ UTILITY | Good for completion notifications |

### 3.3 Template Category Best Practices

**UTILITY Templates** (can send anytime):
- Order confirmations
- Payment receipts  
- Delivery status updates
- Account notifications
- Appointment reminders

**MARKETING Templates** (need 24-hour window):
- Promotional offers
- New product announcements
- General business updates
- Marketing campaigns

## Step 4: Production Deployment

### 4.1 Environment Variables
Ensure these are set in production:

```bash
# Required for Meta API integration
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
WHATSAPP_PHONE_NUMBER_ID=894660290402588
WHATSAPP_ACCESS_TOKEN=your_production_token
WHATSAPP_API_VERSION=v18.0

# Optional: Template cache TTL (default: 24 hours)
WHATSAPP_TEMPLATE_CACHE_TTL_HOURS=24
```

### 4.2 Test Production Setup
Run the comprehensive test:

```bash
cd backend
python test_whatsapp_templates.py
```

Look for these success indicators:
- ✅ API Configuration shows your production values
- ✅ Template validation uses `meta_api` source (not `emergency_fallback`)
- ✅ All templates show correct categories

### 4.3 Monitor Template Validation
After deployment, monitor logs for:

```
🏷️ Template category: UTILITY (status: APPROVED)
🔍 Validation source: meta_api
✅ Can send outside window: True
```

If you see `emergency_fallback`, the Meta API integration needs attention.

## Step 5: Troubleshooting

### 5.1 Common Issues

**Issue**: `Invalid OAuth access token`
**Solution**: 
1. Verify token has `whatsapp_business_management` permission
2. Check token hasn't expired
3. Ensure token is for the correct business account

**Issue**: `Template not found`
**Solution**:
1. Verify template name exactly matches Meta Business Manager
2. Check template is approved (not pending/rejected)
3. Ensure template exists for the specified language

**Issue**: `WABA ID not found`
**Solution**:
1. Double-check the Business Account ID format
2. Ensure the access token has access to this WABA
3. Verify the WABA is active and not suspended

### 5.2 Debug Commands

Test specific template:
```bash
python -c "
import asyncio
from whatsapp_cloud_api import WhatsAppCloudAPI

async def test_template():
    api = WhatsAppCloudAPI()
    result = await api.validate_template_category('payment_receipt', 'en_US')
    print(f'Template validation: {result}')

asyncio.run(test_template())
"
```

## Step 6: Verification Checklist

Before going live, verify:

- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` is set correctly
- [ ] Access token has template management permissions  
- [ ] All templates show correct categories in Meta Business Manager
- [ ] Test template validation returns `meta_api` source
- [ ] Phone number 8051616835 can receive messages with proper templates
- [ ] Fallback system works when Meta API is unavailable
- [ ] Logs show template validation details

## Benefits After Setup

1. **Accurate Validation**: Real Meta approval status instead of name guessing
2. **Fewer Failures**: Prevents 131047/131026 errors before they happen
3. **Better Debugging**: Clear error messages with template category context
4. **Automatic Fallbacks**: Safe template substitution when needed
5. **Performance**: Cached results reduce API calls

## Support

If you encounter issues:
1. Check the logs for specific error messages
2. Verify template names match exactly in Meta Business Manager
3. Test with a known UTILITY template first
4. Use the fallback system while troubleshooting

The fix is designed to work safely even if Meta API setup is incomplete - it will use conservative fallbacks to prevent message failures.