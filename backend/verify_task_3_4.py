#!/usr/bin/env python3
"""
Verification Script for Task 3.4: Enhanced Phone Number Normalization
"""

import os
import sys

# Add backend to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from whatsapp_cloud_api import WhatsAppCloudAPI
from server import normalize_phone_e164

def main():
    """Verify Task 3.4 implementation."""
    print("🔍 VERIFYING TASK 3.4: Enhanced Phone Number Normalization")
    print("=" * 60)
    
    # Set test environment
    os.environ.setdefault('WHATSAPP_PHONE_NUMBER_ID', 'test')
    os.environ.setdefault('WHATSAPP_ACCESS_TOKEN', 'test')
    
    api = WhatsAppCloudAPI()
    
    # Test the specific phone number from the bug report
    test_phone = '8051616835'
    
    print(f"🧪 Testing the problematic phone number: {test_phone}")
    print("-" * 40)
    
    # Test WhatsApp API normalization
    whatsapp_result = api.clean_phone(test_phone)
    print(f"WhatsApp API: {test_phone} → {whatsapp_result}")
    
    # Test server normalization  
    server_result = normalize_phone_e164(test_phone)
    print(f"Server API:   {test_phone} → {server_result}")
    
    # Check consistency
    if whatsapp_result == server_result:
        print("✅ CONSISTENT: Both methods produce the same result")
        print("✅ This should fix the lookup failures between storage and delivery")
        consistency_ok = True
    else:
        print("❌ INCONSISTENT: Methods produce different results")
        consistency_ok = False
    
    # Test verification
    verification = api.verify_phone_format(test_phone)
    print(f"Verification: Valid={verification['is_valid']}, Normalized={verification['normalized']}")
    
    # Test edge cases
    print("\n🧪 Testing edge cases:")
    print("-" * 40)
    
    edge_cases = [
        "+91 805 161 6835",  # Formatted
        "918051616835",      # With country code
        "08051616835",       # With leading zero
        "5051616835",        # Invalid prefix (should fail)
    ]
    
    edge_case_ok = True
    for case in edge_cases:
        try:
            whatsapp_norm = api.clean_phone(case)
            server_norm = normalize_phone_e164(case)
            
            if case == "5051616835":
                # This should fail
                print(f"❌ {case} should have failed but got: WhatsApp={whatsapp_norm}, Server={server_norm}")
                edge_case_ok = False
            else:
                if whatsapp_norm == server_norm == "918051616835":
                    print(f"✅ {case} → {whatsapp_norm} (consistent)")
                else:
                    print(f"❌ {case} → WhatsApp={whatsapp_norm}, Server={server_norm} (inconsistent)")
                    edge_case_ok = False
        except Exception as e:
            if case == "5051616835":
                print(f"✅ {case} → Correctly rejected: {e}")
            else:
                print(f"❌ {case} → Unexpected error: {e}")
                edge_case_ok = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TASK 3.4 VERIFICATION SUMMARY")
    print("=" * 60)
    
    checks = [
        ("Phone number normalization consistency", consistency_ok),
        ("Edge case handling", edge_case_ok),
        ("Enhanced validation", verification['is_valid']),
    ]
    
    all_passed = all(check[1] for check in checks)
    
    for check_name, passed in checks:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {check_name}")
    
    print(f"\n🎯 OVERALL RESULT: {'✅ TASK 3.4 COMPLETE' if all_passed else '❌ ISSUES FOUND'}")
    
    if all_passed:
        print("\n✅ Enhanced phone number normalization is working correctly!")
        print("✅ This should resolve the inconsistent phone number formatting")
        print("✅ Phone number 8051616835 should now work consistently")
        print("✅ Lookup failures between storage and delivery should be fixed")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)