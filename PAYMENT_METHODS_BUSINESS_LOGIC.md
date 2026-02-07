# 🧠 Smart Payment Methods - Business Logic Implementation

## Overview
Payment methods are now dynamically configured based on actual restaurant business requirements, not hardcoded. The system intelligently determines which payment methods to show based on business type, settings, and capabilities.

## Business Logic Rules

### 1. Cash Payment
**Always Available** ✅
- **Logic**: Every restaurant accepts cash
- **Business Types**: All (restaurant, cafe, stall, food-truck, takeaway-only, cloud-kitchen)
- **Requirements**: None
- **Icon**: Wallet (Green #22c55e)

### 2. Card Payment
**Conditionally Available** 🏪
- **Logic**: Available for businesses with card payment infrastructure
- **Enabled For**: 
  - ✅ Restaurant
  - ✅ Cafe
  - ✅ Takeaway-only
  - ✅ Cloud-kitchen
- **Disabled For**:
  - ❌ Food-truck (typically no card machines)
  - ❌ Stall (typically no card machines)
- **Requirements**: Business type must support card infrastructure
- **Icon**: CreditCard (Blue #3b82f6)

### 3. UPI Payment
**Smart Availability** 📱
- **Logic**: Available if UPI is configured OR business is modern
- **Enabled When**:
  - UPI ID is configured in settings (`businessSettings.upi_id` exists)
  - OR business type is modern: restaurant, cafe, cloud-kitchen, takeaway-only
- **Disabled When**:
  - No UPI ID configured AND business type is stall/food-truck
- **Requirements**: 
  - UPI ID in settings (preferred)
  - OR modern business type
- **Icon**: Smartphone (Purple #8b5cf6)

### 4. Credit Payment (Pay Later)
**Table Service Logic** 🍽️
- **Logic**: Available for full-service restaurants with customer accounts
- **Enabled When**:
  - KOT mode is enabled (`businessSettings.kot_mode_enabled === true`)
  - OR business type is restaurant/cafe (full-service)
- **Disabled When**:
  - Quick-service businesses (stall, food-truck, takeaway-only)
  - KOT mode is disabled (no table service)
- **Requirements**: 
  - Table service capability (KOT mode)
  - OR full-service restaurant type
- **Icon**: FileText (Orange #f97316)
- **Special Behavior**: Automatically sets payment to ₹0 when selected

## Business Type Matrix

| Business Type | Cash | Card | UPI | Credit |
|--------------|------|------|-----|--------|
| Restaurant | ✅ | ✅ | ✅ | ✅ (if KOT enabled) |
| Cafe | ✅ | ✅ | ✅ | ✅ (if KOT enabled) |
| Cloud Kitchen | ✅ | ✅ | ✅ | ❌ |
| Takeaway Only | ✅ | ✅ | ✅ | ❌ |
| Food Truck | ✅ | ❌ | ⚠️ (if UPI configured) | ❌ |
| Stall | ✅ | ❌ | ⚠️ (if UPI configured) | ❌ |

## Implementation Details

### Dynamic Payment Method Generation
```javascript
const getAvailablePaymentMethods = useMemo(() => {
  const methods = [];
  
  // Cash - Always available
  methods.push({ id: 'cash', ... });
  
  // Card - Based on business type
  const hasCardFacility = !['food-truck', 'stall'].includes(businessType);
  if (hasCardFacility) methods.push({ id: 'card', ... });
  
  // UPI - Based on configuration or business type
  const hasUpiId = businessSettings?.upi_id?.trim().length > 0;
  const isModernBusiness = ['restaurant', 'cafe', 'cloud-kitchen', 'takeaway-only'].includes(businessType);
  if (hasUpiId || isModernBusiness) methods.push({ id: 'upi', ... });
  
  // Credit - Based on table service capability
  const hasTableService = businessSettings?.kot_mode_enabled === true;
  const isFullServiceRestaurant = ['restaurant', 'cafe'].includes(businessType);
  if (hasTableService || isFullServiceRestaurant) methods.push({ id: 'credit', ... });
  
  return methods;
}, [businessSettings]);
```

### Responsive Grid Layout
```javascript
const paymentGridCols = useMemo(() => {
  const count = getAvailablePaymentMethods.length;
  if (count === 1) return 'grid-cols-1';
  if (count === 2) return 'grid-cols-2';
  if (count === 3) return 'grid-cols-3';
  return 'grid-cols-4';
}, [getAvailablePaymentMethods]);
```

## Real-World Examples

### Example 1: Full-Service Restaurant
**Settings**:
- Business Type: Restaurant
- KOT Mode: Enabled
- UPI ID: restaurant@paytm

**Available Payment Methods**: Cash, Card, UPI, Credit (4 buttons)

### Example 2: Food Truck
**Settings**:
- Business Type: Food Truck
- KOT Mode: Disabled
- UPI ID: Not configured

**Available Payment Methods**: Cash only (1 button)

### Example 3: Cloud Kitchen
**Settings**:
- Business Type: Cloud Kitchen
- KOT Mode: Disabled
- UPI ID: kitchen@upi

**Available Payment Methods**: Cash, Card, UPI (3 buttons)

### Example 4: Cafe with Tables
**Settings**:
- Business Type: Cafe
- KOT Mode: Enabled
- UPI ID: cafe@paytm

**Available Payment Methods**: Cash, Card, UPI, Credit (4 buttons)

### Example 5: Street Stall with UPI
**Settings**:
- Business Type: Stall
- KOT Mode: Disabled
- UPI ID: 9876543210@paytm

**Available Payment Methods**: Cash, UPI (2 buttons)

## Benefits

### 1. Business-Appropriate Options
- Food trucks don't see card payment (they typically don't have card machines)
- Stalls without UPI don't see UPI option
- Quick-service businesses don't see credit option

### 2. Cleaner UI
- Only relevant payment methods are shown
- Grid adjusts automatically (1-4 columns)
- No confusing disabled buttons

### 3. Better UX
- Tooltips explain why methods are available/unavailable
- Automatic layout adjustment
- Context-aware payment options

### 4. Flexible Configuration
- Restaurants can enable UPI by adding UPI ID in settings
- KOT mode controls credit payment availability
- Business type determines default capabilities

## Configuration Guide

### To Enable UPI Payment:
1. Go to Settings → Business Settings
2. Scroll to "UPI Payment Settings"
3. Enter your UPI ID (e.g., yourname@paytm)
4. Save settings
5. UPI button will appear in billing

### To Enable Credit Payment:
1. Go to Settings → Business Settings
2. Set Business Type to "Restaurant" or "Cafe"
3. Enable "KOT Mode" toggle
4. Save settings
5. Credit button will appear in billing

### To Enable Card Payment:
1. Set Business Type to: Restaurant, Cafe, Takeaway-only, or Cloud-kitchen
2. Card payment is automatically available for these types

## Files Modified

1. **frontend/src/pages/BillingPage.js**
   - Added `getAvailablePaymentMethods` useMemo hook
   - Added `paymentGridCols` for responsive layout
   - Updated payment method buttons to use dynamic configuration
   - Added business logic for each payment method

## Testing Scenarios

### Test 1: Restaurant with All Features
- Set business type to "Restaurant"
- Enable KOT mode
- Add UPI ID
- Result: Should see all 4 payment methods

### Test 2: Food Truck Basic
- Set business type to "Food Truck"
- Disable KOT mode
- No UPI ID
- Result: Should see only Cash

### Test 3: Stall with UPI
- Set business type to "Stall"
- Add UPI ID: 9876543210@paytm
- Result: Should see Cash and UPI

### Test 4: Cloud Kitchen
- Set business type to "Cloud Kitchen"
- Result: Should see Cash, Card, UPI (no Credit)

## Future Enhancements

Potential additions based on business needs:
- Digital wallet payments (Paytm, PhonePe)
- Bank transfer option
- Cryptocurrency (for modern businesses)
- Gift card/voucher redemption
- Loyalty points payment

The system is designed to be easily extensible for new payment methods based on business requirements.
