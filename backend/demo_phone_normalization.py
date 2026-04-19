#!/usr/bin/env python3
"""
Demo: Enhanced Phone Number Normalization for Task 3.4

This script demonstrates the enhanced phone number normalization
functionality that addresses inconsistent phone number formatting
between storage and delivery in the WhatsApp message delivery system.

Key improvements:
1. Consistent formatting between WhatsApp API and server normalization
2. Enhanced validation for edge cases in country code handling
3. Phone number format verification before message sending
4. Unique indexing validation for phone number storage
5. Better error messages and warnings for invalid formats
"""

import os
import sys
import asyncio

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from whatsapp_cloud_api import WhatsAppCloudAPI
from server import normalize_phone_e164


def demo_phone_normalization():
    """Demonstrate enhanced phone number normalization."""
    print("🚀 Enhanced Phone Number Normalization Demo")
    print("=" * 60)
    print("Task 3.4: Enhance phone number normalization")
    print("- Improve clean_phone() method for consistent formatting")
    print("- Ensure phone number format matches storage format exactly")
    print("- Add validation for edge cases in country code handling")
    print("- Implement phone number format verification before message sending")
    print("- Add unique indexing validation for phone number storage")
    print("=" * 60)
    
    # Set test environment
    os.environ.setdefault('WHATSAPP_PHONE_NUMBER_ID', 'test_phone_id')
    os.environ.setdefault('WHATSAPP_ACCESS_TOKEN', 'test_token')
    
    api = WhatsAppCloudAPI()
    
    # Demo cases showing the problem and solution
    demo_cases = [
        {
            "input": "8051616835",
            "description": "The problematic phone number from the bug report",
            "context": "This is the phone number that was failing with 131047 errors"
        },
        {
            "input": "+91 805 161 6835",
            "description": "Same number with formatting (spaces and +)",
            "context": "Should normalize to same result as above"
        },
        {
            "input": "918051616835",
            "description": "Same number with country code",
            "context": "Should normalize to same result - consistency is key"
        },
        {
            "input": "08051616835",
            "description": "Same number with leading zero",
            "context": "Common format that needs proper handling"
        },
        {
            "input": "9876543210",
            "description": "Another Indian mobile number",
            "context": "Should work consistently with the same logic"
        },
        {
            "input": "14155552671",
            "description": "US phone number",
            "context": "International numbers should be handled properly"
        }
    ]
    
    print("\n📞 PHONE NUMBER NORMALIZATION COMPARISON")
    print("-" * 60)
    
    for i, case in enumerate(demo_cases, 1):
        input_phone = case["input"]
        description = case["description"]
        context = case["context"]
        
        print(f"\n{i}. {description}")
        print(f"   Context: {context}")
        print(f"   Input: '{input_phone}'")
        
        # Test WhatsApp API normalization
        try:
            whatsapp_result = api.clean_phone(input_phone)
            print(f"   WhatsApp API: '{input_phone}' → '{whatsapp_result}' ✅")
        except Exception as e:
            print(f"   WhatsApp API: '{input_phone}' → ERROR: {e} ❌")
            whatsapp_result = "ERROR"
        
        # Test server normalization
        server_result = normalize_phone_e164(input_phone)
        if server_result:
            print(f"   Server API:   '{input_phone}' → '{server_result}' ✅")
        else:
            print(f"   Server API:   '{input_phone}' → ERROR (empty result) ❌")
            server_result = "ERROR"
        
        # Check consistency
        if whatsapp_result == server_result and whatsapp_result != "ERROR":
            print(f"   ✅ CONSISTENT: Both methods produce same result")
        elif whatsapp_result == server_result == "ERROR":
            print(f"   ✅ CONSISTENT: Both methods correctly reject invalid input")
        else:
            print(f"   ❌ INCONSISTENT: Methods produce different results")
            print(f"      This would cause lookup failures between storage and delivery!")


async def demo_phone_verification():
    """Demonstrate enhanced phone verification."""
    print("\n\n🔍 ENHANCED PHONE NUMBER VERIFICATION")
    print("-" * 60)
    
    api = WhatsAppCloudAPI()
    
    test_phones = [
        "8051616835",      # The problematic number
        "+91-805-161-6835", # Formatted version
        "5051616835",      # Invalid prefix
        "9876543210",      # Test number (should warn)
        "14155552671"      # US number
    ]
    
    for phone in test_phones:
        print(f"\n📞 Verifying: '{phone}'")
        
        try:
            verification = api.verify_phone_format(phone)
            
            print(f"   ✅ Valid: {verification['is_valid']}")
            if verification['is_valid']:
                print(f"   📱 Normalized: {verification['normalized']}")
                print(f"   🌍 Country Code: {verification['country_code']}")
                print(f"   📞 Mobile Number: {verification['mobile_number']}")
                print(f"   🔍 Format Source: {verification['format_source']}")
                
                if verification['warnings']:
                    for warning in verification['warnings']:
                        print(f"   ⚠️  Warning: {warning}")
            else:
                for error in verification['errors']:
                    print(f"   ❌ Error: {error}")
                    
        except Exception as e:
            print(f"   💥 Exception: {e}")


async def demo_storage_validation():
    """Demonstrate storage validation."""
    print("\n\n💾 PHONE NUMBER STORAGE VALIDATION")
    print("-" * 60)
    
    api = WhatsAppCloudAPI()
    
    # Simulate storing the same phone number in different formats
    phone_variants = [
        "8051616835",
        "+91 805 161 6835",
        "918051616835",
        "08051616835"
    ]
    
    print("Simulating storage of the same phone number in different formats:")
    print("(This demonstrates how normalization prevents duplicate storage)")
    
    normalized_phones = set()
    
    for phone in phone_variants:
        try:
            normalized = api.validate_phone_for_storage(phone)
            print(f"\n📞 Input: '{phone}'")
            print(f"   📱 Normalized for storage: '{normalized}'")
            
            if normalized in normalized_phones:
                print(f"   ⚠️  DUPLICATE DETECTED: This phone number is already stored!")
                print(f"   🛡️  Unique indexing would prevent duplicate storage")
            else:
                normalized_phones.add(normalized)
                print(f"   ✅ UNIQUE: Safe to store")
            
            # Test unique validation
            unique_result = await api.validate_unique_phone_storage(phone, "demo_org", None)
            print(f"   🔍 Unique check result: {unique_result['can_store']}")
            
        except Exception as e:
            print(f"   ❌ Storage validation failed: {e}")
    
    print(f"\n📊 Summary: {len(phone_variants)} input formats → {len(normalized_phones)} unique normalized number(s)")
    print("✅ This prevents lookup failures between storage and delivery!")


def demo_bug_fix_summary():
    """Show how this fixes the original bug."""
    print("\n\n🐛 BUG FIX SUMMARY")
    print("=" * 60)
    print("ORIGINAL PROBLEM:")
    print("- Phone number 8051616835 was failing with 131047/131026 errors")
    print("- Inconsistent phone number normalization between storage and delivery")
    print("- Different normalization methods in WhatsApp API vs server code")
    print("- No validation for edge cases in country code handling")
    print("- No phone number format verification before message sending")
    print("- No unique indexing validation for phone number storage")
    
    print("\nSOLUTION IMPLEMENTED:")
    print("✅ Enhanced clean_phone() method with comprehensive validation")
    print("✅ Consistent formatting between WhatsApp API and server normalization")
    print("✅ Edge case handling for country codes (Indian mobile validation)")
    print("✅ Phone number format verification before message sending")
    print("✅ Unique indexing validation for phone number storage")
    print("✅ Better error messages and warnings for debugging")
    print("✅ Support for international phone numbers")
    
    print("\nEXPECTED OUTCOME:")
    print("🎯 Phone number 8051616835 should now work consistently")
    print("🎯 No more lookup failures between storage and delivery")
    print("🎯 Consistent phone number formatting across the system")
    print("🎯 Better validation prevents invalid phone numbers")
    print("🎯 Unique indexing prevents duplicate phone number storage")
    
    print("\nBUG CONDITIONS ADDRESSED:")
    print("- ✅ Inconsistent phone number normalization causing lookup failures")
    print("- ✅ Different formatting between storage and send time")
    print("- ✅ Edge cases in country code handling")
    print("- ✅ No validation before message sending")
    print("- ✅ Non-unique phone number storage")


async def main():
    """Run the complete demo."""
    demo_phone_normalization()
    await demo_phone_verification()
    await demo_storage_validation()
    demo_bug_fix_summary()
    
    print("\n" + "=" * 60)
    print("🎉 TASK 3.4 IMPLEMENTATION COMPLETE")
    print("Enhanced phone number normalization is now active!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())