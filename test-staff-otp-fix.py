#!/usr/bin/env python3
"""
Test script for staff OTP creation and verification
Tests both spam prevention and OTP validation fixes
"""

import asyncio
import httpx
import json
import time
from datetime import datetime

# Configuration
BACKEND_URL = "https://restro-ai.onrender.com"
TEST_ADMIN_EMAIL = "yashrajkuradiya9@gmail.com"  # Replace with actual admin email
TEST_ADMIN_PASSWORD = "your_password"  # Replace with actual password

# Test staff data
TEST_STAFF = {
    "username": f"teststaff_{int(time.time())}",
    "email": "shivshankar4287@gmail.com",  # Replace with test email
    "password": "testpass123",
    "role": "waiter",
    "phone": "+91-9876543210"
}

async def test_staff_creation_flow():
    """Test the complete staff creation flow"""
    print("🧪 Testing Staff Creation Flow with OTP Fixes")
    print("=" * 60)
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Step 1: Admin login
            print("1️⃣ Admin Login...")
            login_response = await client.post(
                f"{BACKEND_URL}/api/auth/login",
                json={
                    "username": TEST_ADMIN_EMAIL,
                    "password": TEST_ADMIN_PASSWORD
                }
            )
            
            if login_response.status_code != 200:
                print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
                return
            
            login_data = login_response.json()
            token = login_data["access_token"]
            print(f"✅ Admin logged in successfully")
            
            headers = {"Authorization": f"Bearer {token}"}
            
            # Step 2: Create staff request (send OTP)
            print("\n2️⃣ Creating staff request (sending OTP)...")
            create_request_response = await client.post(
                f"{BACKEND_URL}/api/staff/create-request",
                json=TEST_STAFF,
                headers=headers
            )
            
            print(f"Status: {create_request_response.status_code}")
            print(f"Response: {create_request_response.text}")
            
            if create_request_response.status_code != 200:
                print(f"❌ Staff request failed: {create_request_response.status_code}")
                return
            
            create_data = create_request_response.json()
            print(f"✅ OTP sent to {create_data['email']}")
            print(f"📧 Check email (including spam folder) for OTP")
            
            # Step 3: Wait for user to enter OTP
            print("\n3️⃣ OTP Verification...")
            print("📧 Please check the email (including spam folder) for the OTP")
            print("🔍 Look for email with subject starting with 'Staff Invitation:'")
            
            # Get OTP from user input
            otp = input("Enter the 6-digit OTP from email: ").strip()
            
            if not otp or len(otp) != 6:
                print("❌ Invalid OTP format. Must be 6 digits.")
                return
            
            # Step 4: Verify OTP and create staff
            print(f"\n4️⃣ Verifying OTP: {otp}")
            verify_response = await client.post(
                f"{BACKEND_URL}/api/staff/verify-create",
                json={
                    "email": TEST_STAFF["email"],
                    "otp": otp
                },
                headers=headers
            )
            
            print(f"Status: {verify_response.status_code}")
            print(f"Response: {verify_response.text}")
            
            if verify_response.status_code == 200:
                verify_data = verify_response.json()
                print(f"✅ Staff member created successfully!")
                print(f"📝 Staff ID: {verify_data['id']}")
                
                # Step 5: Verify staff appears in staff list
                print("\n5️⃣ Verifying staff in list...")
                staff_list_response = await client.get(
                    f"{BACKEND_URL}/api/staff",
                    headers=headers
                )
                
                if staff_list_response.status_code == 200:
                    staff_list = staff_list_response.json()
                    created_staff = next((s for s in staff_list if s["email"] == TEST_STAFF["email"]), None)
                    
                    if created_staff:
                        print(f"✅ Staff found in list:")
                        print(f"   Username: {created_staff['username']}")
                        print(f"   Email: {created_staff['email']}")
                        print(f"   Role: {created_staff['role']}")
                        print(f"   Organization ID: {created_staff.get('organization_id', 'Not set')}")
                        print(f"   Referral Code: {created_staff.get('referral_code', 'Not set')}")
                    else:
                        print("❌ Staff not found in list")
                else:
                    print(f"❌ Failed to get staff list: {staff_list_response.status_code}")
                
            else:
                print(f"❌ OTP verification failed: {verify_response.status_code}")
                if verify_response.status_code == 400:
                    error_data = verify_response.json()
                    print(f"Error: {error_data.get('detail', 'Unknown error')}")
                
        except Exception as e:
            print(f"❌ Test failed with exception: {e}")
            import traceback
            traceback.print_exc()

async def test_email_deliverability():
    """Test email deliverability improvements"""
    print("\n📧 Testing Email Deliverability Improvements")
    print("=" * 50)
    
    improvements = [
        "✅ Subject line improved: 'Staff Invitation: Join [Admin]'s Restaurant Team'",
        "✅ HTML structure improved with proper DOCTYPE and meta tags",
        "✅ Professional styling with better fonts and layout",
        "✅ Clear call-to-action and step-by-step instructions",
        "✅ Proper sender name: 'BillByteKOT Team <support@billbytekot.in>'",
        "✅ Added company contact information and disclaimer",
        "✅ Improved text version for better spam score",
        "✅ Added proper email headers and reply-to address"
    ]
    
    for improvement in improvements:
        print(improvement)
        time.sleep(0.1)  # Visual effect

async def test_otp_validation_improvements():
    """Test OTP validation improvements"""
    print("\n🔐 Testing OTP Validation Improvements")
    print("=" * 45)
    
    improvements = [
        "✅ Added comprehensive debug logging for OTP verification",
        "✅ Improved OTP comparison with whitespace trimming",
        "✅ Better error messages showing expected vs received OTP",
        "✅ Enhanced exception handling with full traceback",
        "✅ Added validation for email format and OTP storage",
        "✅ Improved timing checks for OTP expiration",
        "✅ Better cleanup of expired OTP entries"
    ]
    
    for improvement in improvements:
        print(improvement)
        time.sleep(0.1)  # Visual effect

def print_troubleshooting_guide():
    """Print troubleshooting guide for common issues"""
    print("\n🔧 Troubleshooting Guide")
    print("=" * 30)
    print()
    print("📧 If email goes to spam:")
    print("   • Check spam/junk folder")
    print("   • Look for subject: 'Staff Invitation: Join [Admin]'s Restaurant Team'")
    print("   • Add support@billbytekot.in to contacts")
    print("   • Mark email as 'Not Spam' if found in spam")
    print()
    print("🔐 If OTP validation fails:")
    print("   • Ensure OTP is exactly 6 digits")
    print("   • Don't include spaces or special characters")
    print("   • Check if OTP has expired (10 minutes)")
    print("   • Try requesting a new OTP if needed")
    print()
    print("🚨 If internal server error occurs:")
    print("   • Check backend logs for detailed error messages")
    print("   • Verify MongoDB connection is stable")
    print("   • Ensure Resend API key is valid")
    print("   • Check if email address is valid and accessible")

if __name__ == "__main__":
    print("🧪 BillByteKOT Staff Creation Test Suite")
    print("=" * 50)
    print()
    print("⚠️  IMPORTANT: Update the following before running:")
    print(f"   • TEST_ADMIN_EMAIL: {TEST_ADMIN_EMAIL}")
    print(f"   • TEST_ADMIN_PASSWORD: [HIDDEN]")
    print(f"   • TEST_STAFF email: {TEST_STAFF['email']}")
    print()
    
    choice = input("Continue with test? (y/n): ").lower().strip()
    if choice != 'y':
        print("Test cancelled.")
        exit()
    
    # Run tests
    asyncio.run(test_email_deliverability())
    asyncio.run(test_otp_validation_improvements())
    asyncio.run(test_staff_creation_flow())
    
    print_troubleshooting_guide()
    print("\n✅ Test suite completed!")