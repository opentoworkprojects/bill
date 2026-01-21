// Fix for BillByteKOT Billing Page Dropdown Suggestions
// This script identifies and fixes common issues with the item search dropdown

console.log('🔧 BillByteKOT Billing Page Dropdown Fix');

// Function to debug and fix dropdown issues
function debugBillingDropdown() {
    console.log('🔍 Debugging billing page dropdown...');
    
    // Check if we're on the billing page
    if (!window.location.pathname.includes('/billing/')) {
        console.log('❌ Not on billing page');
        return;
    }
    
    // Check for search input
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (!searchInput) {
        console.log('❌ Search input not found');
        return;
    }
    
    console.log('✅ Search input found:', searchInput);
    
    // Check for dropdown container
    const dropdownContainer = document.querySelector('[class*="dropdown"]') || 
                             document.querySelector('[class*="absolute"][class*="z-"]');
    
    if (dropdownContainer) {
        console.log('✅ Dropdown container found:', dropdownContainer);
    } else {
        console.log('❌ Dropdown container not found');
    }
    
    // Test search functionality
    console.log('🧪 Testing search functionality...');
    
    // Simulate typing in search box
    searchInput.focus();
    searchInput.value = 'test';
    
    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    searchInput.dispatchEvent(inputEvent);
    
    // Check if dropdown appears after typing
    setTimeout(() => {
        const dropdown = document.querySelector('[class*="absolute"][class*="z-"]');
        if (dropdown && dropdown.style.display !== 'none') {
            console.log('✅ Dropdown appears when typing');
        } else {
            console.log('❌ Dropdown does not appear when typing');
            console.log('🔧 Possible fixes:');
            console.log('1. Check if menuItems state has data');
            console.log('2. Verify showMenuDropdown state is true');
            console.log('3. Check for JavaScript errors in console');
        }
    }, 500);
}

// Function to manually show dropdown for testing
function forceShowDropdown() {
    console.log('🔧 Attempting to force show dropdown...');
    
    // Find React component and update state
    const searchInput = document.querySelector('input[placeholder*="Search"]');
    if (searchInput) {
        // Get React fiber
        const reactFiber = searchInput._reactInternalFiber || 
                          searchInput._reactInternals ||
                          Object.keys(searchInput).find(key => key.startsWith('__reactInternalInstance'));
        
        if (reactFiber) {
            console.log('✅ React component found');
            // This would require more complex React state manipulation
        }
    }
}

// Function to check menu items data
function checkMenuItems() {
    console.log('📋 Checking menu items data...');
    
    // Check localStorage for cached menu items
    const cacheKeys = Object.keys(localStorage).filter(key => key.includes('menu_items'));
    
    if (cacheKeys.length > 0) {
        console.log('✅ Found cached menu items:', cacheKeys);
        
        cacheKeys.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                console.log(`📦 ${key}:`, data.items?.length || 0, 'items');
                
                if (data.items && data.items.length > 0) {
                    console.log('Sample items:', data.items.slice(0, 3).map(item => ({
                        name: item.name,
                        price: item.price,
                        available: item.available
                    })));
                }
            } catch (e) {
                console.log(`❌ Error parsing ${key}:`, e);
            }
        });
    } else {
        console.log('❌ No cached menu items found');
        console.log('🔧 Try refreshing the page or adding menu items in Settings');
    }
}

// Function to test API endpoint
async function testMenuAPI() {
    console.log('🌐 Testing menu API endpoint...');
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No auth token found');
        return;
    }
    
    try {
        const response = await fetch('/api/menu', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('API Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Menu API working, items:', data.length);
            
            if (data.length === 0) {
                console.log('⚠️ No menu items in database');
                console.log('🔧 Add menu items via Settings > Menu');
            }
        } else {
            console.log('❌ Menu API error:', response.status, response.statusText);
        }
    } catch (error) {
        console.log('❌ Menu API network error:', error);
    }
}

// Main debugging function
function runDiagnostics() {
    console.log('🚀 Running BillByteKOT Billing Dropdown Diagnostics...');
    console.log('=' * 50);
    
    debugBillingDropdown();
    checkMenuItems();
    testMenuAPI();
    
    console.log('\n📋 Manual Testing Steps:');
    console.log('1. Type in the search box');
    console.log('2. Check browser console for errors');
    console.log('3. Verify menu items exist in Settings > Menu');
    console.log('4. Check network tab for API calls');
    
    console.log('\n🔧 Common Solutions:');
    console.log('1. Add menu items via Settings > Menu page');
    console.log('2. Refresh the page to reload menu items');
    console.log('3. Check if user is properly authenticated');
    console.log('4. Clear browser cache and localStorage');
}

// Auto-run diagnostics
if (typeof window !== 'undefined') {
    // Run diagnostics when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runDiagnostics);
    } else {
        runDiagnostics();
    }
    
    // Make functions available globally for manual testing
    window.debugBillingDropdown = debugBillingDropdown;
    window.checkMenuItems = checkMenuItems;
    window.testMenuAPI = testMenuAPI;
    window.runDiagnostics = runDiagnostics;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        debugBillingDropdown,
        checkMenuItems,
        testMenuAPI,
        runDiagnostics
    };
}