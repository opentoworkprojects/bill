#!/usr/bin/env python3
"""
Test script to verify print settings save functionality
"""
import requests
import json
import sys

def test_print_settings_save():
    """Test the print settings save functionality"""
    base_url = "http://localhost:8000/api"
    
    # Test data - using existing test credentials
    test_credentials = {
        "username": "shivshankarkumar281@gmail.com",
        "password": "shiv@123"
    }
    
    print("🧪 Testing Print Settings Save Functionality")
    print("=" * 50)
    
    try:
        # Step 1: Login to get token
        print("1. Logging in...")
        login_response = requests.post(
            f"{base_url}/auth/login",
            json=test_credentials,
            timeout=10
        )
        
        if login_response.status_code != 200:
            print(f"❌ Login failed: {login_response.status_code}")
            print(f"Response: {login_response.text}")
            return False
            
        login_data = login_response.json()
        print(f"Login response: {json.dumps(login_data, indent=2)}")
        token = login_data.get("token")  # Changed from access_token to token
        
        if not token:
            print("❌ No access token received")
            return False
            
        print("✅ Login successful")
        
        # Step 2: Get current business settings
        print("\n2. Getting current business settings...")
        headers = {"Authorization": f"Bearer {token}"}
        
        get_response = requests.get(
            f"{base_url}/business/settings",
            headers=headers,
            timeout=10
        )
        
        if get_response.status_code != 200:
            print(f"❌ Failed to get settings: {get_response.status_code}")
            print(f"Response: {get_response.text}")
            return False
            
        current_data = get_response.json()
        current_settings = current_data.get("business_settings", {})
        print("✅ Current settings retrieved")
        print(f"Current print_customization: {current_settings.get('print_customization', 'None')}")
        
        # Step 3: Prepare updated settings with print customization
        print("\n3. Preparing updated print settings...")
        
        # Test print customization settings
        test_print_customization = {
            "paper_width": "80mm",
            "font_size": "medium",
            "header_style": "centered",
            "show_logo": True,
            "logo_size": "medium",
            "show_address": True,
            "show_phone": True,
            "show_email": False,
            "show_website": False,
            "show_gstin": True,
            "show_fssai": False,
            "show_tagline": True,
            "show_customer_name": True,
            "show_waiter_name": True,
            "show_table_number": True,
            "show_order_time": True,
            "show_item_notes": True,
            "border_style": "single",
            "separator_style": "dashes",
            "footer_style": "simple",
            "qr_code_enabled": True,
            "auto_print": False,
            "print_copies": 2,  # Changed from 1 to test
            "kot_auto_print": True,
            "kot_font_size": "large",
            "kot_show_time": True,
            "kot_highlight_notes": True
        }
        
        # Merge with existing settings
        updated_settings = {**current_settings}
        updated_settings["print_customization"] = test_print_customization
        
        print("✅ Test settings prepared")
        print(f"Test print_copies: {test_print_customization['print_copies']}")
        
        # Step 4: Save updated settings
        print("\n4. Saving updated print settings...")
        
        save_response = requests.put(
            f"{base_url}/business/settings",
            headers={
                **headers,
                "Content-Type": "application/json"
            },
            json=updated_settings,
            timeout=10
        )
        
        if save_response.status_code != 200:
            print(f"❌ Failed to save settings: {save_response.status_code}")
            print(f"Response: {save_response.text}")
            
            # Try to parse error details
            try:
                error_data = save_response.json()
                print(f"Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
            return False
            
        save_data = save_response.json()
        print("✅ Settings saved successfully")
        print(f"Response: {save_data.get('message', 'No message')}")
        
        # Step 5: Verify settings were saved
        print("\n5. Verifying saved settings...")
        
        verify_response = requests.get(
            f"{base_url}/business/settings",
            headers=headers,
            timeout=10
        )
        
        if verify_response.status_code != 200:
            print(f"❌ Failed to verify settings: {verify_response.status_code}")
            return False
            
        verify_data = verify_response.json()
        verify_settings = verify_data.get("business_settings", {})
        verify_print_settings = verify_settings.get("print_customization", {})
        
        # Check if our test value was saved
        saved_print_copies = verify_print_settings.get("print_copies")
        expected_print_copies = test_print_customization["print_copies"]
        
        if saved_print_copies == expected_print_copies:
            print("✅ Settings verified successfully")
            print(f"Saved print_copies: {saved_print_copies} (expected: {expected_print_copies})")
            return True
        else:
            print("❌ Settings verification failed")
            print(f"Saved print_copies: {saved_print_copies} (expected: {expected_print_copies})")
            print(f"Full saved print settings: {json.dumps(verify_print_settings, indent=2)}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_print_settings_save()
    if success:
        print("\n🎉 Print settings save functionality is working correctly!")
        sys.exit(0)
    else:
        print("\n💥 Print settings save functionality has issues!")
        sys.exit(1)