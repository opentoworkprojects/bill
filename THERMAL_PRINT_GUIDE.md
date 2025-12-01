# Thermal Print & Business Settings Guide

## Overview
The BillByteKOT AI system now includes comprehensive thermal printing capabilities with multiple print formats, editable business details, and professional invoice generation.

## Features Implemented

### 1. **Multiple Thermal Print Formats**
Six professional thermal receipt formats are now available:

#### Classic (80mm)
- Traditional receipt format
- Clear sections with separators
- Includes all business details
- Best for: Standard restaurants

#### Modern (80mm)
- Contemporary design with emojis
- Unicode box-drawing characters
- Visual icons for better readability
- Best for: Trendy cafes and modern establishments

#### Minimal (80mm)
- Clean and simple design
- Essential information only
- Compact layout
- Best for: Quick service restaurants

#### Elegant (80mm)
- Professional and sophisticated
- Double-line borders
- Formal invoice style
- Best for: Fine dining restaurants

#### Compact (58mm)
- Space-saving format for 58mm printers
- Optimized for smaller paper width
- All essential information included
- Best for: Food trucks and small kiosks

#### Detailed (80mm)
- Comprehensive invoice format
- Complete business information
- Itemized breakdown
- Payment summary section
- Best for: Formal billing requirements

### 2. **Editable Business Details**

#### Basic Information
- Restaurant Name *
- Phone Number *
- Address
- Email
- Website

#### Legal Information
- GSTIN (GST Identification Number)
- FSSAI License Number

#### Branding
- Logo Upload
- Tagline
- Custom Footer Message

#### Financial Settings
- Currency Selection (INR, USD, EUR, GBP, etc.)
- Tax Rate Configuration

#### Print Settings
- Receipt Theme Selection
- Format Preview

### 3. **Enhanced Print Features**

#### Print Preview
- Live preview before printing
- Format indicator
- Paper size display
- Professional styling

#### Print Options
- Direct thermal printing
- Download as text file
- Auto-print dialog
- Multiple copies support

#### Print Quality
- Optimized font rendering
- Proper line spacing
- Character alignment
- Paper size detection

## How to Use

### Setting Up Business Details

1. **Navigate to Settings**
   - Click on "Settings" in the sidebar
   - Scroll to "Business Details" section

2. **Fill in Required Information**
   - Restaurant Name (Required)
   - Phone Number (Required)
   - Add optional details as needed

3. **Configure Print Format**
   - Select your preferred thermal print format
   - Consider your printer's paper width (58mm or 80mm)
   - Preview different formats to find the best fit

4. **Save Settings**
   - Click "Save Business Settings"
   - Settings will apply to all future receipts

### Printing Receipts

1. **From Billing Page**
   - Complete payment for an order
   - Click the printer icon button
   - Receipt preview window opens automatically

2. **Print Options**
   - Click "Print Receipt" to send to printer
   - Or click "Download" to save as text file
   - Close preview window when done

3. **Thermal Printer Setup**
   - Ensure thermal printer is connected
   - Set printer as default in system settings
   - Configure paper size (58mm or 80mm)
   - Test print to verify alignment

### Editing Business Details

1. **Access Settings Anytime**
   - Go to Settings page
   - Update any business information
   - Change print format if needed

2. **Update Logo**
   - Click "Upload Logo" button
   - Select image file (max 5MB)
   - Logo appears on receipts (where supported)

3. **Customize Messages**
   - Edit tagline for branding
   - Customize footer message
   - Add website URL for marketing

## Receipt Information Included

### Header Section
- Restaurant name (centered)
- Tagline (if configured)
- Full address
- Contact information (phone, email, website)
- Legal details (GSTIN, FSSAI)

### Order Details
- Invoice/Bill number
- Table number
- Server/Waiter name
- Customer name (if provided)
- Date and time

### Items Section
- Item name
- Quantity
- Unit price
- Line total

### Payment Summary
- Subtotal
- Tax amount (with rate)
- Grand total

### Footer Section
- Custom footer message
- Website URL
- Legal disclaimers (if configured)

## Technical Details

### Supported Paper Sizes
- **80mm (3.15 inches)** - Standard thermal paper
- **58mm (2.28 inches)** - Compact thermal paper

### Font Specifications
- Font Family: Courier New, Consolas (monospace)
- Font Size: 10px (58mm), 12px (80mm)
- Line Height: 1.3
- Character Encoding: UTF-8

### Print Margins
- Top/Bottom: 5mm
- Left/Right: 5mm (auto-adjusted for paper width)

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Preview only (print via desktop)

## Best Practices

### For Restaurant Owners
1. **Keep Information Updated**
   - Regularly verify contact details
   - Update legal information when renewed
   - Maintain current website URL

2. **Choose Appropriate Format**
   - Match format to your restaurant style
   - Consider customer expectations
   - Test with actual thermal printer

3. **Branding Consistency**
   - Use consistent tagline
   - Professional footer message
   - Quality logo image

### For Staff
1. **Print Verification**
   - Always preview before printing
   - Check all details are correct
   - Verify customer information

2. **Printer Maintenance**
   - Keep thermal paper stocked
   - Clean printer head regularly
   - Report printing issues immediately

3. **Customer Service**
   - Offer receipt to all customers
   - Provide digital copy if requested
   - Handle reprints professionally

## Troubleshooting

### Receipt Not Printing
1. Check printer connection
2. Verify printer is powered on
3. Ensure paper is loaded correctly
4. Check browser print settings
5. Try different browser

### Formatting Issues
1. Verify paper width setting
2. Check printer driver settings
3. Update browser to latest version
4. Clear browser cache
5. Test with different format

### Missing Information
1. Update business settings
2. Verify all required fields filled
3. Save settings before printing
4. Refresh page and try again

### Print Quality Issues
1. Clean thermal printer head
2. Replace thermal paper
3. Adjust printer darkness setting
4. Check paper quality
5. Update printer drivers

## API Endpoints

### Get Receipt Themes
```
GET /api/receipt-themes
```
Returns list of available thermal print formats

### Update Business Settings
```
PUT /api/business/settings
```
Updates business information and print preferences

### Print Bill
```
POST /api/print/bill/{order_id}?theme={theme_name}
```
Generates thermal receipt for specific order

### Get Business Settings
```
GET /api/business/settings
```
Retrieves current business configuration

## Future Enhancements

### Planned Features
- [ ] QR code on receipts
- [ ] Multiple language support
- [ ] Custom receipt templates
- [ ] Email receipt option
- [ ] SMS receipt delivery
- [ ] Receipt analytics
- [ ] Batch printing
- [ ] Receipt history

### Integration Options
- [ ] ESC/POS command support
- [ ] Direct USB printer connection
- [ ] Network printer support
- [ ] Cloud printing service
- [ ] Mobile app printing

## Support

For issues or questions:
1. Check this guide first
2. Review troubleshooting section
3. Contact system administrator
4. Submit support ticket

---

**Version:** 2.0  
**Last Updated:** November 2024  
**Compatibility:** All modern browsers, Thermal printers (58mm/80mm)
