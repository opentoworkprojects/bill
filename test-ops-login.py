#!/usr/bin/env python3
"""
Quick test for ops/super admin login
"""

import sys
import os
sys.path.append('backend')

def test_credentials():
    """Test if credentials are set correctly"""
    
    print("🔐 Testing Super Admin Credentials")
    print("=" * 40)
    
    # Check .env file
    env_path = os.path.join('backend', '.env')
    if not os.path.exists(env_path):
        print("❌ .env file not found")
        return False
    
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for credentials
        if 'SUPER_ADMIN_USERNAME=shiv@123' in content:
            print("✅ Username set correctly: shiva123")
        else:
            print("❌ Username not set correctly")
            return False
            
        if 'SUPER_ADMIN_PASSWORD=shiv' in content:
            print("✅ Password set correctly: shiv")
        else:
            print("❌ Password not set correctly")
            return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error reading .env: {e}")
        return False

def test_super_admin_module():
    """Test if super admin module loads correctly"""
    
    print("\n🔧 Testing Super Admin Module")
    print("=" * 40)
    
    try:
        from super_admin import SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD, verify_super_admin
        
        print(f"✅ Module loaded successfully")
        print(f"   Username from module: {SUPER_ADMIN_USERNAME}")
        print(f"   Password from module: {'*' * len(SUPER_ADMIN_PASSWORD)}")
        
        # Test verification function
        if verify_super_admin("shiva123", "shiv"):
            print("✅ Credential verification works")
            return True
        else:
            print("❌ Credential verification failed")
            return False
            
    except Exception as e:
        print(f"❌ Error loading super admin module: {e}")
        return False

def main():
    """Run tests"""
    
    print("🔧 BillByteKOT Ops Login Test")
    print("Testing super admin credentials for Render deployment")
    
    env_test = test_credentials()
    module_test = test_super_admin_module()
    
    print(f"\n📊 Results:")
    print(f"   Environment file: {'✅ PASS' if env_test else '❌ FAIL'}")
    print(f"   Module loading: {'✅ PASS' if module_test else '❌ FAIL'}")
    
    if env_test and module_test:
        print(f"\n🎉 Super admin login should work!")
        print(f"\nTo test in frontend:")
        print(f"1. Go to /ops or super admin page")
        print(f"2. Use credentials:")
        print(f"   Username: shiv@123")
        print(f"   Password: shiv")
        print(f"3. Should successfully log in")
    else:
        print(f"\n⚠️  Issues found with super admin setup")
    
    return env_test and module_test

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)