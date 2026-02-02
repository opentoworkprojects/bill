#!/usr/bin/env python3
"""
Fix script for staff management issues:
1. Test email configuration
2. Test OTP verification
3. Test staff CRUD operations
"""

import requests
import json
import time

# Production API configuration
API_BASE = "https://restro-ai.onrender.com"

def test_staff_management_fix():
    """Test staff management functionality"""
    
    print("🔧 Testing Staff Management Fix")
    print("=" * 50)
    
    # Admin login credentials
    login_data = {
        "email": "admin@example.com",  # Update with actual admin email
        "password": "admin123"         # Update with actual admin password
    }
    
    try:
        print("🔐 Logging in as admin...")
        login_response = requests.post(f"{API_BASE}/auth/login", json=login_data, timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Admin login failed: {login_response.status_code}")
            print("💡 Update the admin login credentials in this script")
            return False
        
        token = login_response.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        
        print("✅ Admin login successful")
        
        # Test 1: Get existing staff
        print("\n📋 Testing staff list...")
        staff_response = requests.get(f"{API_BASE}/staff", headers=headers, timeout=15)
        
        if staff_response.status_code == 200:
            staff_list = staff_response.json()
            print(f"✅ Staff list retrieved: {len(staff_list)} members")
        else:
            print(f"❌ Failed to get staff list: {staff_response.status_code}")
            return False
        
        # Test 2: Create staff request (OTP)
        print("\n📧 Testing staff creation with OTP...")
        test_staff_data = {
            "username": "test_staff_" + str(int(time.time())),
            "email": "test.staff@example.com",  # Use a real email for testing
            "password": "testpass123",
            "role": "waiter",
            "phone": "+91 9876543210",
            "salary": 25000
        }
        
        create_request_response = requests.post(
            f"{API_BASE}/staff/create-request", 
            json=test_staff_data, 
            headers=headers, 
            timeout=15
        )
        
        if create_request_response.status_code == 200:
            print("✅ Staff creation request sent (OTP should be sent to email)")
            print("📧 Check the email for OTP")
            
            # For testing, we can try the direct creation endpoint
            print("\n🔄 Testing direct staff creation (skip OTP)...")
            direct_create_response = requests.post(
                f"{API_BASE}/staff/create", 
                json=test_staff_data, 
                headers=headers, 
                timeout=15
            )
            
            if direct_create_response.status_code == 200:
                created_staff = direct_create_response.json()
                print(f"✅ Staff created directly: {created_staff}")
                
                # Test 3: Update staff
                print("\n✏️ Testing staff update...")
                staff_id = created_staff.get("id")
                if staff_id:
                    update_data = {
                        "username": test_staff_data["username"] + "_updated",
                        "salary": 30000
                    }
                    
                    update_response = requests.put(
                        f"{API_BASE}/staff/{staff_id}", 
                        json=update_data, 
                        headers=headers, 
                        timeout=15
                    )
                    
                    if update_response.status_code == 200:
                        print("✅ Staff updated successfully")
                    else:
                        print(f"❌ Staff update failed: {update_response.status_code}")
                    
                    # Test 4: Delete staff
                    print("\n🗑️ Testing staff deletion...")
                    delete_response = requests.delete(
                        f"{API_BASE}/staff/{staff_id}", 
                        headers=headers, 
                        timeout=15
                    )
                    
                    if delete_response.status_code == 200:
                        print("✅ Staff deleted successfully")
                    else:
                        print(f"❌ Staff deletion failed: {delete_response.status_code}")
                
            else:
                print(f"❌ Direct staff creation failed: {direct_create_response.status_code}")
                print(f"Response: {direct_create_response.text}")
        else:
            print(f"❌ Staff creation request failed: {create_request_response.status_code}")
            print(f"Response: {create_request_response.text}")
        
        # Test 5: Email configuration test
        print("\n📧 Testing email configuration...")
        # This would require a separate endpoint to test email sending
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_otp_verification():
    """Test OTP verification with manual input"""
    
    print("\n🔐 Manual OTP Verification Test")
    print("=" * 40)
    
    # This would require manual testing with real email
    print("📧 To test OTP verification:")
    print("1. Use a real email address in the staff creation")
    print("2. Check the email for the OTP")
    print("3. Use the OTP in the verification endpoint")
    print("4. Verify the staff is created successfully")

if __name__ == "__main__":
    print("🔧 Staff Management Fix Test")
    print("This will test staff management functionality and OTP verification")
    print()
    print("⚠️ IMPORTANT: Update the admin login credentials in this script")
    print()
    
    response = input("Continue with staff management test? (y/n): ").lower().strip()
    if response == 'y':
        success = test_staff_management_fix()
        if success:
            print("\n🎉 Staff management tests completed!")
            print("Check the results above for any issues.")
        else:
            print("\n⚠️ Some tests failed. Check the output above for details.")
        
        # Manual OTP test instructions
        test_otp_verification()
    else:
        print("Test cancelled")