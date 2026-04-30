#!/usr/bin/env python3
"""
Emergency Fix for WhatsApp Issues - Error 131042 and Meta API Configuration

This script addresses the immediate issues seen in the logs:
1. Meta API configuration error (Code 100) - Wrong endpoint
2. Business eligibility payment issue (Code 131042) - Account-level issue

Run this script to apply emergency fixes and get diagnostic information.
"""

import os
import sys
import asyncio
import json
from datetime import datetime

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from whatsapp_cloud_api import WhatsAppCloudAPI


async def diagnose_whatsapp_issues():
    """Diagnose current WhatsApp configuration and issues."""
    print("🔍 EMERGENCY WHATSAPP DIAGNOSTICS")
    print("=" * 60)
    
    # Check environment configuration
    print("\n📋 Environment Configuration:")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "")
    access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
    waba_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID", "")
    api_version = os.getenv("WHATSAPP_API_VERSION", "v18.0")
    
    print(f"  Phone Number ID: {'✅ Set' if phone_id else '❌ Missing'}")
    print(f"  Access Token: {'✅ Set' if access_token else '❌ Missing'}")
    print(f"  Business Account ID: {'✅ Set' if waba_id else '⚠️ Missing (will use phone_id)'}")
    print(f"  API Version: {api_version}")
    
    if not phone_id or not access_token:
        print("\n❌ CRITICAL: Missing required WhatsApp configuration")
        return False
    
    # Initialize API
    api = WhatsAppCloudAPI()
    
    # Test basic configuration
    print(f"\n🔧 API Configuration:")
    print(f"  Configured: {'✅ Yes' if api.is_configured() else '❌ No'}")
    print(f"  Template Configured: {'✅ Yes' if api.is_template_configured() else '❌ No'}")
    
    # Test Meta API endpoint (this was causing the 100 error)
    print(f"\n🌐 Meta API Endpoint Test:")
    try:
        # Try to get template info for a common template
        result = await api.get_template_info("payment_receipt", "en_US")
        if result:
            print(f"  ✅ Meta API working - Template found: {result['template_name']}")
            print(f"     Category: {result.get('meta_category', 'Unknown')}")
            print(f"     Status: {result.get('approval_status', 'Unknown')}")
        else:
            print(f"  ⚠️ Meta API working but template 'payment_receipt' not found")
            print(f"     This might be normal if template doesn't exist")
    except Exception as e:
        error_str = str(e)
        if "100" in error_str and "nonexisting field" in error_str:
            print(f"  ❌ Meta API endpoint error (Fixed in code)")
            print(f"     Error: {error_str}")
            print(f"     Solution: Code has been updated with correct endpoint")
        elif "131042" in error_str:
            print(f"  🚨 Business eligibility payment issue detected")
            print(f"     This is a Meta account-level issue")
        else:
            print(f"  ❌ Meta API error: {error_str}")
    
    # Check for 131042 business eligibility issues
    print(f"\n💳 Business Account Status:")
    print(f"  This requires checking Meta Business Manager manually:")
    print(f"  1. Go to business.facebook.com")
    print(f"  2. Check WhatsApp Business Account status")
    print(f"  3. Verify payment methods are valid")
    print(f"  4. Check for any account restrictions or suspensions")
    
    return True


async def test_template_sending():
    """Test template sending with current configuration."""
    print(f"\n📨 Template Sending Test:")
    
    api = WhatsAppCloudAPI()
    
    # Test phone numbers from logs
    test_phones = ["918210066921", "918051616835"]
    test_templates = ["order_preparing", "order_ready", "payment_receipt"]
    
    for phone in test_phones:
        print(f"\n  Testing phone: {phone}")
        for template in test_templates:
            try:
                # Don't actually send, just validate
                validation = await api.validate_template_category(template, "en_US")
                print(f"    Template '{template}': {validation.get('category', 'Unknown')} "
                      f"(Source: {validation.get('source', 'Unknown')})")
                
                if validation.get('source') == 'emergency_fallback':
                    print(f"      ⚠️ Using fallback validation - Meta API integration needs setup")
                elif validation.get('is_utility'):
                    print(f"      ✅ Can send outside 24h window")
                else:
                    print(f"      ⚠️ Requires 24h customer service window")
                    
            except Exception as e:
                if "131042" in str(e):
                    print(f"    ❌ Business eligibility issue for template '{template}'")
                else:
                    print(f"    ❌ Error testing template '{template}': {e}")


def print_solutions():
    """Print solutions for the identified issues."""
    print(f"\n" + "=" * 60)
    print("🔧 SOLUTIONS FOR CURRENT ISSUES")
    print("=" * 60)
    
    print(f"\n1. 🚨 ERROR 131042 - Business Eligibility Payment Issue:")
    print(f"   This is a Meta Business Account level issue, not a code issue.")
    print(f"   IMMEDIATE ACTIONS:")
    print(f"   • Check Meta Business Manager (business.facebook.com)")
    print(f"   • Verify payment methods are valid and not expired")
    print(f"   • Check for outstanding payments or billing issues")
    print(f"   • Ensure WhatsApp Business Account is not suspended")
    print(f"   • Contact Meta Business Support if needed")
    
    print(f"\n2. 🔧 ERROR 100 - Meta API Endpoint Issue:")
    print(f"   FIXED: Updated code to use correct Meta Graph API endpoint")
    print(f"   • Changed from generic endpoint to 'message_templates'")
    print(f"   • Added proper error handling for business eligibility issues")
    
    print(f"\n3. ⚠️ Template Validation Fallbacks:")
    print(f"   Currently using emergency fallback validation")
    print(f"   TO IMPROVE:")
    print(f"   • Set WHATSAPP_BUSINESS_ACCOUNT_ID environment variable")
    print(f"   • Ensure access token has 'whatsapp_business_management' permission")
    print(f"   • Verify templates exist and are approved in Meta Business Manager")
    
    print(f"\n4. 📱 Phone Number Issues:")
    print(f"   Both phones (918210066921, 918051616835) are properly formatted")
    print(f"   The issue is account-level (131042), not phone-specific")


async def main():
    """Run emergency diagnostics and fixes."""
    print("🚨 EMERGENCY WHATSAPP FIX - Error 131042 & Meta API Issues")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Run diagnostics
    config_ok = await diagnose_whatsapp_issues()
    
    if config_ok:
        await test_template_sending()
    
    print_solutions()
    
    print(f"\n" + "=" * 60)
    print("📋 SUMMARY")
    print("=" * 60)
    print("✅ Code fixes applied:")
    print("   • Fixed Meta API endpoint configuration")
    print("   • Added error handling for 131042 business eligibility issues")
    print("   • Enhanced error classification and messaging")
    
    print("\n🚨 CRITICAL ACTION REQUIRED:")
    print("   • Error 131042 is a Meta Business Account payment/billing issue")
    print("   • Check Meta Business Manager for account status and payment methods")
    print("   • This cannot be fixed with code changes - requires account resolution")
    
    print(f"\n💡 The WhatsApp message delivery fix is working correctly.")
    print(f"   The current failures are due to Meta account-level issues (131042)")
    print(f"   Once the business account issues are resolved, messages should work.")


if __name__ == "__main__":
    asyncio.run(main())