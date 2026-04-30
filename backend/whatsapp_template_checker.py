#!/usr/bin/env python3
"""
WhatsApp Template Emergency Checker

Quick utility to check which templates are safe to use outside 24-hour window.
Run this to identify which templates will work for business-initiated messaging.
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from whatsapp_cloud_api import WhatsAppCloudAPI


def check_templates():
    """Check all configured templates for UTILITY category compatibility."""
    
    # Set dummy environment variables for testing
    os.environ.setdefault('WHATSAPP_PHONE_NUMBER_ID', 'test')
    os.environ.setdefault('WHATSAPP_ACCESS_TOKEN', 'test')
    
    api = WhatsAppCloudAPI()
    
    # Get all configured templates
    templates_to_check = [
        api.template_bill_confirmation,
        api.template_status_pending,
        api.template_status_preparing, 
        api.template_status_ready,
        api.template_status_completed,
        api.template_status_cancelled
    ]
    
    print("🔍 WHATSAPP TEMPLATE EMERGENCY ANALYSIS")
    print("=" * 50)
    print("Checking which templates are safe for business-initiated messaging...")
    print()
    
    safe_templates = []
    risky_templates = []
    
    for template in templates_to_check:
        if not template:  # Skip empty templates
            continue
            
        is_utility = api._is_utility_template(template)
        
        if is_utility:
            safe_templates.append(template)
            print(f"✅ SAFE: {template}")
            print(f"   Can be used outside 24-hour customer service window")
        else:
            risky_templates.append(template)
            print(f"❌ RISKY: {template}")
            print(f"   May fail outside 24-hour window (likely MARKETING category)")
        print()
    
    print("=" * 50)
    print("📋 SUMMARY:")
    print()
    
    if safe_templates:
        print("✅ SAFE TEMPLATES (use these for business-initiated messaging):")
        for template in safe_templates:
            print(f"   - {template}")
        print()
    
    if risky_templates:
        print("❌ RISKY TEMPLATES (may fail outside 24h window):")
        for template in risky_templates:
            print(f"   - {template}")
        print()
        print("💡 SOLUTIONS for risky templates:")
        print("   1. Wait for customer to message you first (opens 24h window)")
        print("   2. Check Meta Business Manager - template may be MARKETING category")
        print("   3. Use safe templates above for business-initiated messaging")
        print("   4. Remove promotional content from templates to get UTILITY approval")
    
    print("=" * 50)
    print("🚨 EMERGENCY RECOMMENDATIONS:")
    print()
    print("For phone 8051616835 (and similar issues):")
    if safe_templates:
        print(f"   - Use: {safe_templates[0]} (or other safe templates)")
    print("   - Avoid: bill_confirmation (contains marketing content)")
    print("   - Check: Meta Business Manager for actual template categories")
    print()
    print("For immediate fix:")
    print("   - Only use templates marked as SAFE above")
    print("   - Wait for customers to message you first when possible")
    print("   - Monitor logs for 131047/131026 errors")


if __name__ == "__main__":
    check_templates()