// Test script to verify print format consistency between web and desktop
// Run this in the browser console to test

const testOrder = {
  id: 'TEST123',
  order_number: 'B00001',
  table_number: 5,
  waiter_name: 'John Doe',
  customer_name: 'Test Customer',
  created_at: new Date().toISOString(),
  items: [
    { name: 'Butter Chicken', quantity: 2, price: 350, notes: 'Extra spicy' },
    { name: 'Garlic Naan', quantity: 3, price: 60 },
    { name: 'Jeera Rice', quantity: 1, price: 120 }
  ],
  subtotal: 1080,
  tax: 54,
  total: 1134,
  payment_method: 'cash',
  payment_received: 1200,
  balance_amount: 0
};

const testBusiness = {
  restaurant_name: 'Test Restaurant',
  address: '123 Test Street, Test City',
  phone: '+91 9876543210',
  gstin: '29ABCDE1234F1Z5',
  fssai: '12345678901234',
  tagline: 'Delicious Food, Great Service',
  footer_message: 'Thank you for dining with us!'
};

// Test both paper sizes
console.log('=== 80mm Receipt ===');
console.log(generateReceiptHTML(testOrder, testBusiness));

console.log('\n=== 58mm Receipt (should be more compact) ===');
// Temporarily change settings for 58mm test
const originalSettings = getPrintSettings();
localStorage.setItem('user', JSON.stringify({
  business_settings: {
    print_customization: { ...originalSettings, paper_width: '58mm' }
  }
}));
console.log(generateReceiptHTML(testOrder, testBusiness));

// Restore original settings
localStorage.setItem('user', JSON.stringify({
  business_settings: {
    print_customization: originalSettings
  }
}));

console.log('\n=== KOT Format ===');
console.log(generateKOTHTML(testOrder));

console.log('\nTest completed! Check that formats match between web and desktop versions.');