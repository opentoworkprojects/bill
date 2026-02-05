// Test file for thermal printer functionality
import { printThermal, generateReceiptHTML, printReceipt } from './printUtils';

// Mock order data for testing
const mockOrder = {
  id: 'test-123',
  order_number: 'ORD001',
  table_number: 5,
  customer_name: 'Test Customer',
  waiter_name: 'Test Waiter',
  items: [
    { name: 'Chicken Curry', quantity: 2, price: 250.00, notes: 'Extra spicy' },
    { name: 'Naan Bread', quantity: 3, price: 50.00 },
    { name: 'Rice', quantity: 1, price: 80.00 }
  ],
  subtotal: 680.00,
  tax: 68.00,
  total: 748.00,
  payment_method: 'cash',
  payment_received: 800.00,
  balance_amount: 0,
  created_at: new Date().toISOString()
};

const mockBusinessSettings = {
  restaurant_name: 'Test Restaurant',
  address: '123 Test Street, Test City',
  phone: '+91 9876543210',
  gstin: 'TEST123456789',
  fssai: 'TEST987654321',
  footer_message: 'Thank you for dining with us!'
};

// Test thermal printing functionality
console.log('🧪 Testing thermal printer functionality...');

// Test 1: Generate receipt HTML
console.log('📄 Testing receipt HTML generation...');
const receiptHTML = generateReceiptHTML(mockOrder, mockBusinessSettings);
console.log('✅ Receipt HTML generated successfully');
console.log('📏 Receipt HTML length:', receiptHTML.length, 'characters');

// Test 2: Test print thermal function (will not actually print in test environment)
console.log('🖨️ Testing printThermal function...');
try {
  const result = printThermal(receiptHTML, '80mm', false);
  console.log('✅ printThermal function executed:', result);
} catch (error) {
  console.error('❌ printThermal function failed:', error);
}

// Test 3: Test print receipt function
console.log('🧾 Testing printReceipt function...');
try {
  printReceipt(mockOrder, mockBusinessSettings).then(result => {
    console.log('✅ printReceipt function executed:', result);
  }).catch(error => {
    console.error('❌ printReceipt function failed:', error);
  });
} catch (error) {
  console.error('❌ printReceipt function failed:', error);
}

console.log('🎉 Thermal printer tests completed!');