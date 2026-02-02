#!/usr/bin/env python3
"""
Fix script for staff organization assignment issues
"""

import requests
import json

# Production API configuration
API_BASE = "https://billbytekot-backend.onrender.com"

def diagnose_staff_organization_issue():
    """Diagnose staff organization assignment issues"""
    
    print("🔍 Diagnosing Staff Organization Assignment Issues")
    print("=" * 60)
    
    # Admin login credentials
    admin_login_data = {
        "email": "admin@example.com",  # Update with actual admin email
        "password": "admin123"         # Update with actual admin password
    }
    
    try:
        print("🔐 Logging in as admin...")
        admin_login_response = requests.post(f"{API_BASE}/auth/login", json=admin_login_data, timeout=10)
        
        if admin_login_response.status_code != 200:
            print(f"❌ Admin login failed: {admin_login_response.status_code}")
            print("💡 Update the admin login credentials in this script")
            return False
        
        admin_token = admin_login_response.json().get("access_token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        admin_user = admin_login_response.json().get("user", {})
        
        print("✅ Admin login successful")
        print(f"📊 Admin Details:")
        print(f"   ID: {admin_user.get('id')}")
        print(f"   Username: {admin_user.get('username')}")
        print(f"   Email: {admin_user.get('email')}")
        print(f"   Role: {admin_user.get('role')}")
        print(f"   Organization ID: {admin_user.get('organization_id')}")
        
        # Get admin's staff list
        print("\n📋 Getting admin's staff list...")
        staff_response = requests.get(f"{API_BASE}/staff", headers=admin_headers, timeout=15)
        
        if staff_response.status_code == 200:
            staff_list = staff_response.json()
            print(f"✅ Found {len(staff_list)} staff members")
            
            for staff in staff_list:
                print(f"   - {staff.get('username')} ({staff.get('email')})")
                print(f"     Role: {staff.get('role')}")
                print(f"     Organization ID: {staff.get('organization_id')}")
                print(f"     Match Admin Org: {'✅' if staff.get('organization_id') == admin_user.get('organization_id') else '❌'}")
                print()
        else:
            print(f"❌ Failed to get staff list: {staff_response.status_code}")
            return False
        
        # Test staff login if we have staff members
        if staff_list:
            print("\n🔐 Testing staff login...")
            staff_member = staff_list[0]  # Test with first staff member
            
            # This would require knowing the staff password
            print(f"💡 To test staff login for {staff_member.get('username')}:")
            print("   1. Use the staff member's login credentials")
            print("   2. Check if they see the same organization data as admin")
            print("   3. Verify they don't get prompted to create new business")
        
        # Check business settings
        print("\n🏢 Checking business settings...")
        business_response = requests.get(f"{API_BASE}/business/settings", headers=admin_headers, timeout=15)
        
        if business_response.status_code == 200:
            business_data = business_response.json()
            print("✅ Business settings found")
            print(f"   Business Name: {business_data.get('business_settings', {}).get('business_name', 'Not set')}")
        else:
            print(f"⚠️ Business settings not found: {business_response.status_code}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_resend_email_config():
    """Test Resend email configuration"""
    
    print("\n📧 Testing Resend Email Configuration")
    print("=" * 40)
    
    print("📋 Current Configuration Issues:")
    print("   1. RESEND_API_KEY=re_123456789 (This looks like a placeholder)")
    print("   2. Need to get actual Resend API key from https://resend.com")
    print("   3. Need to verify domain or use resend.dev for testing")
    
    print("\n🔧 To Fix Email Issues:")
    print("   1. Sign up at https://resend.com")
    print("   2. Get your API key")
    print("   3. Update RESEND_API_KEY in backend/.env")
    print("   4. For production: verify your domain (billbytekot.in)")
    print("   5. For testing: use resend.dev domain")

def create_organization_fix():
    """Create a fix for organization assignment issues"""
    
    print("\n🔧 Organization Assignment Fix")
    print("=" * 40)
    
    fix_script = '''
# Fix for organization assignment issues

1. **Check Admin Organization ID**:
   - Admin should have organization_id = admin.id
   - If not set, run migration endpoint

2. **Staff Creation Process**:
   - Staff gets admin's organization_id
   - Staff should NOT create new business
   - Staff should see admin's business data

3. **Login Process Check**:
   - Staff login should use existing organization
   - No business setup prompt for staff
   - Redirect to appropriate dashboard based on role

4. **Database Verification**:
   - Check users collection
   - Verify organization_id consistency
   - Ensure staff have correct organization_id
'''
    
    print(fix_script)

if __name__ == "__main__":
    print("🔧 Staff Organization Assignment Diagnostic")
    print("This will diagnose staff organization assignment issues")
    print()
    print("⚠️ IMPORTANT: Update the admin login credentials in this script")
    print()
    
    response = input("Continue with diagnosis? (y/n): ").lower().strip()
    if response == 'y':
        success = diagnose_staff_organization_issue()
        test_resend_email_config()
        create_organization_fix()
        
        if success:
            print("\n📊 Diagnosis completed!")
            print("Check the results above for organization assignment issues.")
        else:
            print("\n⚠️ Diagnosis failed. Check the output above for details.")
    else:
        print("Diagnosis cancelled")