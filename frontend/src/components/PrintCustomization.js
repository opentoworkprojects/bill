import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { toast } from 'sonner';
import { 
  Printer, 
  Settings, 
  Maximize2, 
  Layout,
  Eye,
  Save,
  RotateCcw,
  Palette,
  FileText,
  Hash,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const PrintCustomization = ({ businessSettings, onUpdate }) => {
  // Initialize with proper defaults and existing settings
  const initializeCustomization = useCallback(() => {
    try {
      const ps = businessSettings?.print_customization || {};
      return {
        paper_width: ps.paper_width || '80mm',
        font_size: ps.font_size || 'medium',
        print_theme: ps.print_theme || 'default', // NEW: Print theme selection
        kot_theme: ps.kot_theme || 'classic', // NEW: KOT theme selection
        header_style: ps.header_style || 'centered',
        show_logo: ps.show_logo ?? true,
        logo_size: ps.logo_size || 'medium',
        show_address: ps.show_address ?? true,
        show_phone: ps.show_phone ?? true,
        show_email: ps.show_email ?? false,
        show_website: ps.show_website ?? false,
        show_gstin: ps.show_gstin ?? true,
        show_fssai: ps.show_fssai ?? false,
        show_tagline: ps.show_tagline ?? true,
        show_customer_name: ps.show_customer_name ?? true,
        show_waiter_name: ps.show_waiter_name ?? true,
        show_table_number: ps.show_table_number ?? true,
        show_order_time: ps.show_order_time ?? true,
        show_item_notes: ps.show_item_notes ?? true,
        border_style: ps.border_style || 'single',
        separator_style: ps.separator_style || 'dashes',
        footer_style: ps.footer_style || 'simple',
        qr_code_enabled: ps.qr_code_enabled ?? true,
        qr_code_size: ps.qr_code_size || 100,
        preferred_upi_provider: ps.preferred_upi_provider || 'paytm',
        auto_print: ps.auto_print ?? true, // Default TRUE for fast POS workflow
        print_copies: Math.max(1, Math.min(5, ps.print_copies || 1)),
        kot_auto_print: ps.kot_auto_print ?? true,
        kot_font_size: ps.kot_font_size || 'large',
        kot_show_time: ps.kot_show_time ?? true,
        kot_highlight_notes: ps.kot_highlight_notes ?? true,
      };
    } catch (error) {
      console.error('Error initializing customization:', error);
      // Return safe defaults if there's an error
      return {
        paper_width: '80mm',
        font_size: 'medium',
        print_theme: 'default', // NEW: Default theme
        kot_theme: 'classic', // NEW: Default KOT theme
        header_style: 'centered',
        show_logo: true,
        logo_size: 'medium',
        show_address: true,
        show_phone: true,
        show_email: false,
        show_website: false,
        show_gstin: true,
        show_fssai: false,
        show_tagline: true,
        show_customer_name: true,
        show_waiter_name: true,
        show_table_number: true,
        show_order_time: true,
        show_item_notes: true,
        border_style: 'single',
        separator_style: 'dashes',
        footer_style: 'simple',
        qr_code_enabled: true,
        qr_code_size: 100,
        preferred_upi_provider: 'paytm',
        auto_print: true, // Default TRUE for fast POS workflow
        print_copies: 1,
        kot_auto_print: true,
        kot_font_size: 'large',
        kot_show_time: true,
        kot_highlight_notes: true,
      };
    }
  }, [businessSettings]);

  const [customization, setCustomization] = useState(initializeCustomization);
  const [previewContent, setPreviewContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('receipt');
  const [validationErrors, setValidationErrors] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Update customization when businessSettings change
  useEffect(() => {
    try {
      setCustomization(initializeCustomization());
      // Force regenerate preview with new settings
      setTimeout(() => {
        generatePreview();
      }, 100);
    } catch (error) {
      console.error('Error updating customization from business settings:', error);
      toast.error('Error loading print settings. Using defaults.');
    }
  }, [initializeCustomization]);

  // Track changes for unsaved indicator
  useEffect(() => {
    try {
      const initialSettings = initializeCustomization();
      const hasChanges = JSON.stringify(customization) !== JSON.stringify(initialSettings);
      setHasUnsavedChanges(hasChanges);
    } catch (error) {
      console.error('Error tracking changes:', error);
      setHasUnsavedChanges(false);
    }
  }, [customization, initializeCustomization]);

  useEffect(() => {
    try {
      generatePreview();
      validateSettings();
    } catch (error) {
      console.error('Error generating preview or validating:', error);
      setPreviewContent('Error generating preview');
      setValidationErrors(['Error validating settings']);
    }
  }, [customization, activeTab, businessSettings]);

  const validateSettings = () => {
    try {
      const errors = [];
      
      if (!businessSettings?.restaurant_name) {
        errors.push('Restaurant name is required for proper receipt printing');
      }
      
      const copies = customization.print_copies;
      if (!copies || copies < 1 || copies > 5 || isNaN(copies)) {
        errors.push('Print copies must be between 1 and 5');
      }
      
      if (customization.show_gstin && !businessSettings?.gstin) {
        errors.push('GSTIN is enabled but not configured in business settings');
      }
      
      if (customization.show_fssai && !businessSettings?.fssai) {
        errors.push('FSSAI is enabled but not configured in business settings');
      }
      
      setValidationErrors(errors);
      return errors;
    } catch (error) {
      console.error('Error validating settings:', error);
      const fallbackErrors = ['Error validating settings. Please refresh and try again.'];
      setValidationErrors(fallbackErrors);
      return fallbackErrors;
    }
  };

  const generatePreview = async () => {
    try {
      if (activeTab === 'receipt') {
        setPreviewContent(generateReceiptPreview());
      } else {
        setPreviewContent(generateKOTPreview());
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      // Fallback to simple preview
      const mockOrder = {
        id: 'ABC12345',
        order_number: 'ABC12345',
        table_number: 5,
        waiter_name: 'John Doe',
        customer_name: 'Guest Customer',
        created_at: new Date().toISOString(),
        items: [
          { name: 'Butter Chicken', quantity: 2, price: 350 },
          { name: 'Garlic Naan', quantity: 1, price: 60 },
          { name: 'Jeera Rice', quantity: 2, price: 120 },
        ],
        subtotal: 880,
        tax: 44,
        total: 924
      };
      
      if (activeTab === 'receipt') {
        setPreviewContent(generateSimpleFallbackPreview(mockOrder));
      } else {
        setPreviewContent(generateKOTPreview());
      }
    }
  };

  const generateReceiptPreview = () => {
    // Use the same logic as actual print function for perfect matching
    const mockOrder = {
      id: 'ABC12345',
      order_number: 'ABC12345',
      table_number: 5,
      waiter_name: 'John Doe',
      customer_name: 'Guest Customer',
      created_at: new Date().toISOString(),
      items: [
        { name: 'Butter Chicken', quantity: 2, price: 350, notes: customization.show_item_notes ? 'Extra spicy' : '' },
        { name: 'Garlic Naan', quantity: 1, price: 60, notes: '' },
        { name: 'Jeera Rice', quantity: 2, price: 120, notes: customization.show_item_notes ? 'Less salt' : '' },
      ],
      subtotal: 880,
      tax: 44,
      tax_rate: 5,
      total: 924,
      payment_method: 'cash',
      payment_received: 500,
      balance_amount: 424,
      is_credit: true
    };

    // Create a mock business settings object with current customization
    const mockBusinessSettings = {
      ...businessSettings,
      print_customization: customization
    };

    // Use the actual generatePlainTextReceipt function for perfect matching
    try {
      // Check theme and use appropriate function
      const theme = customization.print_theme || 'default';
      if (theme === 'professional') {
        return generateMockProfessionalPlainTextReceipt(mockOrder, mockBusinessSettings);
      } else {
        return generateMockPlainTextReceipt(mockOrder, mockBusinessSettings);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      // Return a simple fallback preview
      return `Preview Error: ${error.message}\n\nUsing fallback preview:\n\n${generateSimpleFallbackPreview(mockOrder)}`;
    }
  };

  // Simple fallback preview in case of errors
  const generateSimpleFallbackPreview = (order) => {
    const theme = customization.print_theme || 'default';
    const w = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '-'.repeat(w);
    const center = (t) => {
      if (!t) return '';
      if (t.length >= w) return t.substring(0, w);
      const padding = Math.floor((w - t.length) / 2);
      return ' '.repeat(padding) + t;
    };
    
    let r = sep + '\n';
    r += center(businessSettings?.restaurant_name || 'Your Restaurant') + '\n';
    r += center(`Theme: ${theme === 'professional' ? 'Professional' : 'Default'}`) + '\n';
    r += sep + '\n';
    r += center('BILL') + '\n';
    r += sep + '\n';
    
    const d = new Date();
    r += `Bill No: 12345     Date: ${d.toLocaleDateString('en-IN')}\n`;
    r += `Table: ${order.table_number || 'Counter'}     Time: ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
    
    r += sep + '\n';
    r += 'Item                 Qty   Rate    Amt\n';
    r += sep + '\n';
    
    (order.items || []).forEach(i => {
      const itemName = i.name.substring(0, 18).padEnd(18);
      const qty = i.quantity.toString().padStart(3);
      const rate = i.price.toFixed(2).padStart(7);
      const amt = (i.quantity * i.price).toFixed(2).padStart(8);
      r += `${itemName} ${qty} ${rate} ${amt}\n`;
    });
    
    r += sep + '\n';
    r += `Sub Total                      ${order.subtotal.toFixed(2)}\n`;
    r += `Tax                            ${order.tax.toFixed(2)}\n`;
    r += sep + '\n';
    r += `TOTAL AMOUNT                   ${order.total.toFixed(2)}\n`;
    r += sep + '\n';
    r += 'BALANCE RECEIVED:\n';
    r += `Payment Mode:                      CASH\n`;
    r += `Amount Received:               ${(order.total * 0.6).toFixed(2)}\n`;
    r += `BALANCE DUE:                   ${(order.total * 0.4).toFixed(2)}\n`;
    r += sep + '\n';
    r += center('Thank You! Visit Again...') + '\n';
    r += sep + '\n';
    
    return r;
  };

  // Mock version of generatePlainTextReceipt that matches the actual function exactly
  const generateMockPlainTextReceipt = (order, businessOverride = null) => {
    try {
      const b = businessOverride || businessSettings || {};
      const billNo = (order.order_number || order.id || 'ABC12345').toString().padStart(5, '0');
      const w = customization.paper_width === '58mm' ? 32 : 48;
      const sep = customization.separator_style === 'dashes' ? '-'.repeat(w) : 
                  customization.separator_style === 'dots' ? '.'.repeat(w) :
                  customization.separator_style === 'equals' ? '='.repeat(w) : 
                  '-'.repeat(w);
      const dsep = customization.border_style === 'double' ? '='.repeat(w) : sep;
      
      const center = (t) => {
        if (!t) return '';
        const text = t.toString();
        if (text.length >= w) return text.substring(0, w);
        const padding = Math.floor((w - text.length) / 2);
        return ' '.repeat(padding) + text;
      };
      
      let r = dsep + '\n';
      
      // Header with logo placeholder
      if (customization.show_logo) {
        r += center('[LOGO]') + '\n';
      }
      
      // Restaurant name with header style
      const restaurantName = b.restaurant_name || 'Your Restaurant';
      if (customization.header_style === 'left') {
        r += restaurantName + '\n';
      } else if (customization.header_style === 'right') {
        r += restaurantName.padStart(w) + '\n';
      } else {
        r += center(restaurantName) + '\n';
      }
      
      if (customization.show_tagline && b.tagline) {
        r += center(b.tagline) + '\n';
      }
      if (customization.show_fssai && b.fssai) {
        r += center(`FSSAI: ${b.fssai}`) + '\n';
      }
      
      r += dsep + '\n';
      
      if (customization.show_address && b.address) {
        r += center(b.address.substring(0, w)) + '\n';
      }
      if (customization.show_phone && b.phone) {
        r += center(`Contact: ${b.phone}`) + '\n';
      }
      if (customization.show_email && b.email) {
        r += center(`Email: ${b.email}`) + '\n';
      }
      if (customization.show_website && b.website) {
        r += center(`Web: ${b.website}`) + '\n';
      }
      if (customization.show_gstin && b.gstin) {
        r += center(`GSTIN: ${b.gstin}`) + '\n';
      }
      
      r += sep + '\n' + center('BILL') + '\n' + sep + '\n';
      
      const d = new Date(order.created_at || Date.now());
      const tableInfo = customization.show_table_number ? (order.table_number ? 'T' + order.table_number : 'Counter') : 'Counter';
      r += `Bill No: ${billNo}  Table: ${tableInfo}\n`;
      r += `Date: ${d.toLocaleDateString('en-IN')}`;
      if (customization.show_order_time) {
        r += ` (${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})`;
      }
      r += '\n';
      
      if (customization.show_waiter_name && order.waiter_name) {
        r += `Captain: ${order.waiter_name}\n`;
      }
      if (customization.show_customer_name && order.customer_name) {
        r += `Customer: ${order.customer_name}\n`;
      }
      
      r += sep + '\nItem            Qty    Rate     Amt\n' + sep + '\n';
      
      (order.items || []).forEach(i => {
        const itemName = (i.name || '').substring(0, 14).padEnd(14);
        const qty = (i.quantity || 0).toString().padStart(3);
        const rate = (i.price || 0).toFixed(2).padStart(8);
        const amt = ((i.quantity || 0) * (i.price || 0)).toFixed(2).padStart(8);
        r += `${itemName} ${qty} ${rate} ${amt}\n`;
        
        if (customization.show_item_notes && i.notes) {
          r += `   Note: ${i.notes}\n`;
        }
      });
      
      r += sep + '\n';
      
      const sub = order.subtotal || 0;
      const tax = order.tax || 0;
      const tot = order.total || 0;
      const discount = order.discount || order.discount_amount || 0;
      const items = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
      
      const itemsTotal = (order.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0);
      const displaySub = discount > 0 ? itemsTotal : sub;
      
      r += `Sub Total       ${items.toString().padStart(3)}     -  ${displaySub.toFixed(2).padStart(8)}\n`;
      if (discount > 0) {
        r += `Discount                      -${discount.toFixed(2).padStart(8)}\n`;
      }
      
      const taxRate = order.tax_rate || (sub > 0 && tax > 0 ? ((tax / sub) * 100) : 0);
      if (tax > 0 || taxRate > 0) {
        r += `Tax (${taxRate.toFixed(0)}%)                       ${tax.toFixed(2).padStart(8)}\n`;
      }
      
      r += dsep + '\n' + `TOTAL AMOUNT                   ${tot.toFixed(2).padStart(8)}\n` + dsep + '\n';
      
      // Payment details
      const { payment_received = 0, balance_amount = 0, is_credit, payment_method } = order;
      const methodDisplay = { cash: 'CASH', card: 'CARD', upi: 'UPI', credit: 'CREDIT' }[payment_method] || 'CASH';
      r += 'BALANCE RECEIVED:\n';
      r += `Payment Mode:                  ${methodDisplay.padStart(8)}\n`;
      
      if (payment_received > 0) {
        r += `Amount Received:               ${payment_received.toFixed(2).padStart(8)}\n`;
        if (payment_received > tot) {
          const change = payment_received - tot;
          r += `Change to Return:              ${change.toFixed(2).padStart(8)}\n`;
        }
      }
      
      if (is_credit || balance_amount > 0) {
        r += `BALANCE DUE:                   ${balance_amount.toFixed(2).padStart(8)}\n`;
      } else if (payment_received >= tot) {
        r += `Status:                            PAID\n`;
      }
      
      r += sep + '\n';
      
      // Add QR code info for unpaid/overdue bills
      const isUnpaid = is_credit || balance_amount > 0;
      if (customization.qr_code_enabled && isUnpaid) {
        r += '\n' + center('SCAN QR CODE TO PAY BALANCE') + '\n';
        r += center(`Balance Due: ₹${balance_amount.toFixed(2)}`) + '\n';
        r += sep + '\n';
        
        // QR code representation for text-based printing
        const qrWidth = Math.min(25, Math.floor(w * 0.6)); // Adaptive width
        
        r += center('[QR CODE FOR UPI PAYMENT]') + '\n';
        r += center('█'.repeat(qrWidth)) + '\n';
        
        // Generate QR pattern
        for (let i = 0; i < Math.floor(qrWidth/3); i++) {
          let line = '█';
          for (let j = 1; j < qrWidth-1; j++) {
            line += (i + j) % 3 === 0 ? '█' : (i + j) % 2 ? '▄' : ' ';
          }
          line += '█';
          r += center(line) + '\n';
        }
        
        r += center('█'.repeat(qrWidth)) + '\n';
        
        // UPI ID with provider
        const provider = customization.preferred_upi_provider || 'paytm';
        const upiId = b.upi_id || (b.phone ? `${b.phone}@${provider}` : `payment@${provider}.com`);
        r += center(`UPI ID: ${upiId}`) + '\n';
        
        if (order.customer_phone) {
          r += center(`Or call: ${order.customer_phone}`) + '\n';
        }
        
        r += center('Open any UPI app & scan to pay') + '\n';
        r += sep + '\n';
      }
      
      // Footer
      const footerMessage = customization.footer_style === 'detailed' ? 
        `${b.footer_message || 'Thank you! Visit Again...'}\nBill generated by BillByteKOT\n(billbytekot.in)` :
        b.footer_message || 'Thank you! Visit Again...';
        
      r += '\n' + center(footerMessage.split('\n')[0]) + '\n';
      
      if (customization.footer_style === 'simple') {
        r += center('Bill generated by BillByteKOT') + '\n';
        r += center('(billbytekot.in)') + '\n';
      } else if (customization.footer_style === 'detailed') {
        const lines = footerMessage.split('\n');
        for (let i = 1; i < lines.length; i++) {
          r += center(lines[i]) + '\n';
        }
      }
      
      r += dsep + '\n';
      
      return r;
    } catch (error) {
      console.error('Error in generateMockPlainTextReceipt:', error);
      return `Default Theme Preview Error: ${error.message}\n\nPlease check your settings and try again.`;
    }
  };

  // NEW: Mock version of professional theme plain text receipt (matching thermal printer format from image)
  const generateMockProfessionalPlainTextReceipt = (order, businessOverride = null) => {
    try {
      const b = businessOverride || businessSettings || {};
      const billNo = (order.order_number || order.id || 'ABC12345').toString().padStart(5, '0');
      const w = customization.paper_width === '58mm' ? 32 : 48;
      const sep = '-'.repeat(w);
      const dsep = '='.repeat(w);
      
      const center = (t) => {
        if (!t) return '';
        const text = t.toString();
        if (text.length >= w) return text.substring(0, w);
        const padding = Math.floor((w - text.length) / 2);
        return ' '.repeat(padding) + text;
      };
      
      let r = '';
      
      // Professional header - clean and centered like the image
      if (customization.show_logo) {
        r += center('[LOGO]') + '\n';
      }
      
      r += center(b.restaurant_name || 'Your Restaurant') + '\n';
      
      // Business tagline
      if (customization.show_tagline && b.tagline) {
        r += center(b.tagline.substring(0, w)) + '\n';
      }
      
      // FSSAI number (like in the image)
      if (customization.show_fssai && b.fssai) {
        r += center(`FSSAI NO: ${b.fssai}`) + '\n';
      }
      
      // Address (centered, single line)
      if (customization.show_address && b.address) {
        r += center(b.address.substring(0, w)) + '\n';
      }
      
      // Contact info (centered)
      if (customization.show_phone && b.phone) {
        r += center(`Contact No: ${b.phone}`) + '\n';
      }
      
      // GSTIN if exists
      if (customization.show_gstin && b.gstin) {
        r += center(`GSTIN: ${b.gstin}`) + '\n';
      }
      
      r += sep + '\n';
      r += center('BILL') + '\n';
      r += sep + '\n';
      
      const d = new Date(order.created_at || Date.now());
      
      // Bill info section - matching the image format
      r += `Bill No: ${billNo.padEnd(12)} Date: ${d.toLocaleDateString('en-IN')}\n`;
      const tableInfo = customization.show_table_number ? (order.table_number ? order.table_number : 'Counter') : 'Counter';
      r += `Table No: ${tableInfo.toString().padEnd(15)} (${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})\n`;
      
      // Customer and waiter info
      if (customization.show_customer_name && order.customer_name) {
        r += center(`Captain: ${order.customer_name}`) + '\n';
      }
      if (customization.show_waiter_name && order.waiter_name) {
        r += center(`Waiter: ${order.waiter_name}`) + '\n';
      }
      
      r += sep + '\n';
      
      // Items header - matching image format
      r += 'Item                 Qty   Rate    Amt\n';
      r += sep + '\n';
      
      // Items with clean formatting (like the image)
      (order.items || []).forEach(i => {
        const itemName = (i.name || '').substring(0, 18).padEnd(18);
        const qty = (i.quantity || 0).toString().padStart(3);
        const rate = (i.price || 0).toFixed(2).padStart(7);
        const amt = ((i.quantity || 0) * (i.price || 0)).toFixed(2).padStart(8);
        r += `${itemName} ${qty} ${rate} ${amt}\n`;
        
        if (customization.show_item_notes && i.notes) {
          r += `  ${i.notes.substring(0, 42)}\n`;
        }
      });
      
      r += sep + '\n';
      
      const sub = order.subtotal || 0;
      const tax = order.tax || 0;
      const tot = order.total || 0;
      const discount = order.discount || order.discount_amount || 0;
      const items = (order.items || []).reduce((s, i) => s + (i.quantity || 0), 0);
      
      const itemsTotal = (order.items || []).reduce((s, i) => s + ((i.price || 0) * (i.quantity || 0)), 0);
      const displaySub = discount > 0 ? itemsTotal : sub;
      
      // Sub Total line (like in image)
      r += `Sub Total ${items}${(' -  ' + displaySub.toFixed(2)).padStart(w - 12)}\n`;
      
      if (discount > 0) {
        r += `Discount${('-' + discount.toFixed(2)).padStart(w - 8)}\n`;
      }
      
      const taxRate = order.tax_rate || (sub > 0 && tax > 0 ? ((tax / sub) * 100) : 0);
      if (tax > 0 || taxRate > 0) {
        r += `Tax (${taxRate.toFixed(0)}%)${tax.toFixed(2).padStart(w - 12)}\n`;
      }
      
      r += dsep + '\n';
      
      // TOTAL AMOUNT - bold and prominent like in image
      r += `TOTAL AMOUNT${tot.toFixed(2).padStart(w - 12)}\n`;
      r += dsep + '\n';
      
      // Payment details
      const { payment_received = 0, balance_amount = 0, is_credit, payment_method } = order;
      const methodDisplay = { cash: 'CASH', card: 'CARD', upi: 'UPI', credit: 'CREDIT' }[payment_method] || 'CASH';
      
      r += 'BALANCE RECEIVED:\n';
      if (payment_received > 0) {
        r += `Payment Mode${methodDisplay.padStart(w - 12)}\n`;
        r += `Amount Received${payment_received.toFixed(2).padStart(w - 15)}\n`;
        
        if (payment_received > tot) {
          const change = payment_received - tot;
          r += `Change to Return${change.toFixed(2).padStart(w - 16)}\n`;
        }
      }
      
      if (is_credit || balance_amount > 0) {
        r += `BALANCE DUE${balance_amount.toFixed(2).padStart(w - 11)}\n`;
      } else if (payment_received >= tot) {
        r += `Status${('PAID').padStart(w - 6)}\n`;
      }
      
      // QR code section for unpaid bills
      const isUnpaid = is_credit || balance_amount > 0;
      if (customization.qr_code_enabled && isUnpaid) {
        r += sep + '\n';
        r += center('SCAN TO PAY BALANCE') + '\n';
        r += center(`Balance Due: ${balance_amount.toFixed(2)}`) + '\n';
        r += sep + '\n';
        
        // Simple QR code representation for text
        r += center('[QR CODE FOR UPI PAYMENT]') + '\n';
        const qrWidth = Math.min(20, w - 4);
        r += center('█'.repeat(qrWidth)) + '\n';
        for (let i = 0; i < 3; i++) {
          r += center('█' + ' '.repeat(Math.max(0, qrWidth - 2)) + '█') + '\n';
        }
        r += center('█'.repeat(qrWidth)) + '\n';
        
        const provider = customization.preferred_upi_provider || 'paytm';
        const upiId = b.upi_id || (b.phone ? `${b.phone}@${provider}` : `payment@${provider}.com`);
        r += center(`UPI ID: ${upiId}`) + '\n';
        r += center('Open any UPI app & scan to pay') + '\n';
      }
      
      r += sep + '\n';
      
      // Footer - clean and simple like in image
      r += center(b.footer_message || 'Thank You! Visit Again...') + '\n';
      r += center('Software Developed by BillByteKOT') + '\n';
      r += center('(billbytekot.in)') + '\n';
      
      r += dsep + '\n';
      
      return r;
    } catch (error) {
      console.error('Error in generateMockProfessionalPlainTextReceipt:', error);
      return `Professional Theme Preview Error: ${error.message}\n\nPlease check your settings and try again.`;
    }
  };

  const generateKOTPreview = () => {
    // Use the same logic as actual KOT print function for perfect matching
    const mockOrder = {
      id: 'KOT001234',
      order_number: 'KOT001234',
      table_number: 5,
      waiter_name: 'John Doe',
      customer_name: 'Guest Customer',
      created_at: new Date().toISOString(),
      priority: 'normal',
      items: [
        { name: 'Butter Chicken', quantity: 2, notes: customization.kot_highlight_notes ? 'Extra spicy' : '' },
        { name: 'Garlic Naan', quantity: 1, notes: '' },
        { name: 'Jeera Rice', quantity: 2, notes: customization.kot_highlight_notes ? 'Less salt' : '' },
      ]
    };

    // Use the actual KOT generation logic with theme support
    return generateMockKOTContent(mockOrder);
  };

  // Mock version of generateKOTContent that matches the actual function exactly with theme support
  const generateMockKOTContent = (order) => {
    const kotTheme = customization.kot_theme || 'classic';
    
    // Route to appropriate theme preview
    switch (kotTheme) {
      case 'modern':
        return generateMockModernKOT(order);
      case 'compact':
        return generateMockCompactKOT(order);
      case 'detailed':
        return generateMockDetailedKOT(order);
      case 'minimal':
        return generateMockMinimalKOT(order);
      case 'colorful':
        return generateMockColorfulKOT(order);
      case 'classic':
      default:
        return generateMockClassicKOT(order);
    }
  };

  // Mock Classic KOT (Original)
  const generateMockClassicKOT = (order) => {
    const billNo = order.order_number?.toString().padStart(5, '0') || '001234';
    const w = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(w);
    const dash = '-'.repeat(w);
    const isCompact = customization.paper_width === '58mm';
    
    const center = (text) => {
      if (!text) return '';
      if (text.length >= w) return text.substring(0, w);
      const padding = Math.floor((w - text.length) / 2);
      return ' '.repeat(padding) + text;
    };
    
    let k = '';
    
    // Header - matches actual KOT function
    if (isCompact) {
      k += center('*** KOT ***') + '\n';
      k += center('KITCHEN ORDER') + '\n';
    } else {
      k += sep + '\n';
      k += center('*** KOT ***') + '\n';
      k += center('KITCHEN ORDER TICKET') + '\n';
      k += sep + '\n\n';
    }
    
    k += sep + '\n';
    
    // Order info - matches actual format
    k += `ORDER #: ${billNo}  TABLE: ${order.table_number ? 'T' + order.table_number : 'Counter'}\n`;
    k += `SERVER: ${order.waiter_name || 'Self'}\n`;
    
    if (!isCompact || customization.kot_show_time) {
      if (customization.kot_show_time) {
        k += `TIME: ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
      }
    }
    
    if (order.customer_name && !isCompact) {
      k += `CUSTOMER: ${order.customer_name}\n`;
    }
    
    k += `PRIORITY: ${order.priority === 'high' ? 'HIGH' : 'NORMAL'}\n`;
    
    // Items section
    k += '\n' + dash + '\n';
    k += isCompact ? center('ITEMS TO PREPARE') + '\n' : center('ITEMS TO PREPARE') + '\n';
    k += dash + '\n\n';
    
    // Items - matches actual KOT formatting
    (order.items || []).forEach((item, idx) => {
      if (isCompact) {
        k += `${item.quantity}x ${item.name.toUpperCase()}\n`;
        if (customization.kot_highlight_notes && item.notes) {
          k += `*** ${item.notes.toUpperCase()} ***\n`;
        }
      } else {
        if (customization.kot_font_size === 'large') {
          k += `>>> ${item.quantity} × ${item.name.toUpperCase()} <<<\n`;
        } else if (customization.kot_font_size === 'medium') {
          k += `>> ${item.quantity} × ${item.name.toUpperCase()} <<\n`;
        } else {
          k += `${item.quantity} × ${item.name.toUpperCase()}\n`;
        }
        
        if (customization.kot_highlight_notes && item.notes) {
          k += `    *** ${item.notes.toUpperCase()} ***\n`;
        }
      }
      
      if (idx < (order.items || []).length - 1) k += '\n';
    });
    
    // Footer
    k += '\n' + dash + '\n';
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    k += center(`TOTAL ITEMS: ${totalItems}`) + '\n';
    k += sep + '\n';
    
    return k;
  };

  // Mock Modern KOT
  const generateMockModernKOT = (order) => {
    const billNo = order.order_number?.toString().padStart(5, '0') || '001234';
    const w = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(w);
    
    const center = (text) => {
      if (!text) return '';
      if (text.length >= w) return text.substring(0, w);
      const padding = Math.floor((w - text.length) / 2);
      return ' '.repeat(padding) + text;
    };
    
    let k = '';
    k += sep + '\n';
    k += center('🍽️ KITCHEN ORDER 🍽️') + '\n';
    k += center(`ORDER #${billNo}`) + '\n';
    k += sep + '\n';
    k += `🏠 Table: ${order.table_number || 'Counter'} | ⏰ ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
    if (order.waiter_name) k += `👨‍💼 Server: ${order.waiter_name}\n`;
    k += sep + '\n';
    k += center('🍽️ ITEMS TO PREPARE 🍽️') + '\n';
    k += sep + '\n';
    
    (order.items || []).forEach(item => {
      k += `${item.name.toUpperCase()} ×${item.quantity}\n`;
      if (customization.kot_highlight_notes && item.notes) {
        k += `📝 ${item.notes.toUpperCase()}\n`;
      }
      k += '\n';
    });
    
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    k += sep + '\n';
    k += center(`TOTAL: ${totalItems} ITEMS`) + '\n';
    if (order.priority === 'high') k += center('🔥 HIGH PRIORITY') + '\n';
    k += sep + '\n';
    
    return k;
  };

  // Mock Compact KOT
  const generateMockCompactKOT = (order) => {
    const billNo = order.order_number?.toString().padStart(5, '0') || '001234';
    const w = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '-'.repeat(w);
    
    let k = '';
    k += 'KOT\n';
    k += sep + '\n';
    k += `#${billNo} T${order.table_number || 'C'} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}\n`;
    k += sep + '\n';
    
    (order.items || []).forEach(item => {
      k += `${item.quantity}× ${item.name}`;
      if (customization.kot_highlight_notes && item.notes) {
        k += ` (${item.notes})`;
      }
      k += '\n';
    });
    
    k += sep + '\n';
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    k += `${totalItems} ITEMS${order.priority === 'high' ? ' - URGENT' : ''}\n`;
    
    return k;
  };

  // Mock Detailed KOT
  const generateMockDetailedKOT = (order) => {
    const billNo = order.order_number?.toString().padStart(5, '0') || '001234';
    const w = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(w);
    
    const center = (text) => {
      if (!text) return '';
      if (text.length >= w) return text.substring(0, w);
      const padding = Math.floor((w - text.length) / 2);
      return ' '.repeat(padding) + text;
    };
    
    let k = '';
    k += sep + '\n';
    k += center('🏪 KITCHEN ORDER TICKET') + '\n';
    k += center(`ORDER NUMBER: ${billNo}`) + '\n';
    k += sep + '\n';
    k += 'ORDER DETAILS\n';
    k += `Date: ${new Date().toLocaleDateString('en-IN')}\n`;
    k += `Time: ${new Date().toLocaleTimeString('en-IN')}\n`;
    k += `Table: ${order.table_number ? `Table ${order.table_number}` : 'Counter Service'}\n`;
    if (order.waiter_name) k += `Server: ${order.waiter_name}\n`;
    if (order.customer_name) k += `Customer: ${order.customer_name}\n`;
    k += `Priority: ${order.priority === 'high' ? '🔥 HIGH PRIORITY' : '📋 Normal'}\n`;
    k += sep + '\n';
    k += 'ITEMS TO PREPARE\n';
    k += sep + '\n';
    
    (order.items || []).forEach((item, index) => {
      k += `${index + 1}. ${item.name.toUpperCase()} - QTY: ${item.quantity}\n`;
      if (customization.kot_highlight_notes && item.notes) {
        k += `⚠️ SPECIAL INSTRUCTIONS: ${item.notes.toUpperCase()}\n`;
      }
      k += '\n';
    });
    
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    k += sep + '\n';
    k += center('SUMMARY') + '\n';
    k += `Total Items: ${totalItems}\n`;
    k += `Total Dishes: ${(order.items || []).length}\n`;
    if (order.priority === 'high') {
      k += '🚨 RUSH ORDER - PREPARE IMMEDIATELY\n';
    }
    k += sep + '\n';
    
    return k;
  };

  // Mock Minimal KOT
  const generateMockMinimalKOT = (order) => {
    const billNo = order.order_number?.toString().padStart(5, '0') || '001234';
    
    let k = '';
    k += `KOT ${billNo}\n`;
    k += `T${order.table_number || 'C'} | ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
    k += '─────────────────────\n';
    
    (order.items || []).forEach(item => {
      k += `${item.quantity} ${item.name}`;
      if (customization.kot_highlight_notes && item.notes) {
        k += ` *${item.notes}*`;
      }
      k += '\n';
    });
    
    k += '─────────────────────\n';
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    k += `${totalItems} items${order.priority === 'high' ? ' - URGENT' : ''}\n`;
    
    return k;
  };

  // Mock Colorful KOT
  const generateMockColorfulKOT = (order) => {
    const billNo = order.order_number?.toString().padStart(5, '0') || '001234';
    const w = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(w);
    
    const center = (text) => {
      if (!text) return '';
      if (text.length >= w) return text.substring(0, w);
      const padding = Math.floor((w - text.length) / 2);
      return ' '.repeat(padding) + text;
    };
    
    let k = '';
    k += sep + '\n';
    k += center('🍳 KITCHEN ORDER 🍳') + '\n';
    k += center(`━━━ ORDER #${billNo} ━━━`) + '\n';
    k += sep + '\n';
    k += `🏠 Table: ${order.table_number || 'Counter'} | ⏰ ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}\n`;
    if (order.waiter_name) k += `👨‍💼 Server: ${order.waiter_name}\n`;
    if (order.customer_name) k += `👤 Customer: ${order.customer_name}\n`;
    k += sep + '\n';
    k += center('🍽️ ITEMS TO PREPARE 🍽️') + '\n';
    k += sep + '\n';
    
    (order.items || []).forEach(item => {
      // Add category symbols based on item name
      let symbol = '🍽️'; // default
      const itemName = item.name.toLowerCase();
      if (itemName.includes('chicken') || itemName.includes('mutton')) symbol = '🍖';
      else if (itemName.includes('rice') || itemName.includes('biryani')) symbol = '🍚';
      else if (itemName.includes('naan') || itemName.includes('bread')) symbol = '🍞';
      
      k += `${symbol} ${item.name.toUpperCase()} ×${item.quantity}\n`;
      if (customization.kot_highlight_notes && item.notes) {
        k += `⚠️ ${item.notes.toUpperCase()}\n`;
      }
      k += '\n';
    });
    
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    k += sep + '\n';
    k += center(`📊 TOTAL: ${totalItems} ITEMS`) + '\n';
    if (order.priority === 'high') {
      k += center('🚨 HIGH PRIORITY - RUSH ORDER 🚨') + '\n';
    }
    k += sep + '\n';
    
    return k;
  };

  const handleSave = async () => {
    const errors = validateSettings();
    if (errors.length > 0) {
      toast.error('Please fix validation errors before saving');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login again to save settings');
        setLoading(false);
        return;
      }

      // Debug logging
      console.log('🔧 Starting print settings save...');
      console.log('Token available:', !!token);
      console.log('Current customization:', customization);

      // Ensure we have valid business settings structure
      const currentSettings = businessSettings || {};
      
      // Build print_customization with proper types for backend
      const printCustomization = {
        paper_width: customization.paper_width || '80mm',
        font_size: customization.font_size || 'medium',
        print_theme: customization.print_theme || 'default', // NEW: Print theme
        kot_theme: customization.kot_theme || 'classic', // NEW: KOT theme
        header_style: customization.header_style || 'centered',
        show_logo: Boolean(customization.show_logo),
        logo_size: customization.logo_size || 'medium',
        show_address: Boolean(customization.show_address),
        show_phone: Boolean(customization.show_phone),
        show_email: Boolean(customization.show_email),
        show_website: Boolean(customization.show_website),
        show_gstin: Boolean(customization.show_gstin),
        show_fssai: Boolean(customization.show_fssai),
        show_tagline: Boolean(customization.show_tagline),
        show_customer_name: Boolean(customization.show_customer_name),
        show_waiter_name: Boolean(customization.show_waiter_name),
        show_table_number: Boolean(customization.show_table_number),
        show_order_time: Boolean(customization.show_order_time),
        show_item_notes: Boolean(customization.show_item_notes),
        border_style: customization.border_style || 'single',
        separator_style: customization.separator_style || 'dashes',
        footer_style: customization.footer_style || 'simple',
        qr_code_enabled: Boolean(customization.qr_code_enabled),
        qr_code_size: parseInt(customization.qr_code_size) || 100,
        preferred_upi_provider: customization.preferred_upi_provider || 'paytm',
        auto_print: Boolean(customization.auto_print),
        print_copies: Math.max(1, Math.min(5, parseInt(customization.print_copies) || 1)),
        kot_auto_print: Boolean(customization.kot_auto_print),
        kot_font_size: customization.kot_font_size || 'large',
        kot_show_time: Boolean(customization.kot_show_time),
        kot_highlight_notes: Boolean(customization.kot_highlight_notes),
      };
      
      const updatedSettings = {
        ...currentSettings,
        print_customization: printCustomization
      };
      
      console.log('🔧 Saving print settings:', printCustomization);
      console.log('🔧 Full settings payload:', updatedSettings);
      
      const response = await axios.put(`${API}/business/settings`, updatedSettings, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Increased timeout to 15 seconds
      });
      
      console.log('🔧 Save response:', response.data);
      
      // CRITICAL: Invalidate print settings cache to ensure KOT themes are applied immediately
      try {
        // Import and call cache invalidation function
        const { invalidateSettingsCache } = await import('../utils/printUtils');
        invalidateSettingsCache();
        console.log('🔧 Print settings cache invalidated - KOT themes will now apply');
        
        // Show specific success message for KOT theme changes
        if (activeTab === 'kot') {
          toast.success('KOT theme settings saved! Print a test KOT to see the new design.');
        } else {
          toast.success('Print settings saved successfully!');
        }
      } catch (cacheError) {
        console.warn('Error invalidating cache:', cacheError);
        // Force reload of settings by clearing localStorage cache keys
        try {
          const cacheKeys = Object.keys(localStorage).filter(key => 
            key.includes('print') || key.includes('settings') || key.includes('cache')
          );
          cacheKeys.forEach(key => {
            if (key !== 'user' && key !== 'token') {
              localStorage.removeItem(key);
            }
          });
          console.log('🔧 Fallback cache clearing completed');
          
          if (activeTab === 'kot') {
            toast.success('KOT theme settings saved! Print a test KOT to see the new design.');
          } else {
            toast.success('Print settings saved successfully!');
          }
        } catch (fallbackError) {
          console.warn('Fallback cache clearing failed:', fallbackError);
          toast.success('Print settings saved successfully!');
        }
      }
      
      // Safely update local storage
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user && typeof user === 'object') {
          user.business_settings = {
            ...(user.business_settings || {}),
            print_customization: printCustomization
          };
          localStorage.setItem('user', JSON.stringify(user));
          console.log('🔧 Updated localStorage with new settings');
        }
      } catch (storageError) {
        console.warn('Error updating local storage:', storageError);
        // Don't fail the save operation if localStorage update fails
      }
      
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('🔧 Failed to save print settings:', error);
      
      let errorMessage = 'Failed to save print settings';
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        // Clear invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Optionally redirect to login
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to modify print settings.';
      } else if (error.response?.status === 422) {
        // Validation error from backend
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map(d => d.msg || d.message || JSON.stringify(d)).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else {
          errorMessage = 'Invalid settings format. Please check your inputs.';
        }
        console.error('🔧 Validation error details:', detail);
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 'Invalid settings data. Please check your inputs.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : 'Invalid settings data';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Additional debugging for network errors
      if (error.code === 'ERR_NETWORK') {
        errorMessage = 'Network error. Please check if the server is running and try again.';
        console.error('🔧 Network error - server might be down or CORS issue');
      }
      
      toast.error(errorMessage);
      
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultSettings = {
      paper_width: '80mm',
      font_size: 'medium',
      print_theme: 'default', // NEW: Default theme
      kot_theme: 'classic', // NEW: Default KOT theme
      header_style: 'centered',
      show_logo: true,
      show_address: true,
      show_phone: true,
      show_email: false,
      show_website: false,
      show_gstin: true,
      show_fssai: false,
      show_tagline: true,
      show_customer_name: true,
      show_waiter_name: true,
      show_table_number: true,
      show_order_time: true,
      show_item_notes: true,
      border_style: 'single',
      separator_style: 'dashes',
      footer_style: 'simple',
      qr_code_enabled: true,
      qr_code_size: 100,
      preferred_upi_provider: 'paytm',
      auto_print: true, // Default TRUE for fast POS workflow
      print_copies: 1,
      kot_auto_print: true,
      kot_font_size: 'large',
      kot_show_time: true,
      kot_highlight_notes: true,
    };
    
    setCustomization(defaultSettings);
    toast.info('Settings reset to defaults');
  };

  const handleTestPrint = () => {
    try {
      const content = activeTab === 'receipt' ? generateReceiptPreview() : generateKOTPreview();
      
      if (!content) {
        toast.error('Unable to generate preview content for printing');
        return;
      }
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (!printWindow) {
        toast.error('Unable to open print window. Please check your popup blocker settings.');
        return;
      }
      
      const fontSize = customization.font_size === 'small' ? '10px' : 
                      customization.font_size === 'large' ? '14px' : '12px';
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Print - ${activeTab === 'receipt' ? 'Receipt' : 'KOT'}</title>
            <style>
              body {
                font-family: 'Courier New', Consolas, monospace;
                font-size: ${fontSize};
                line-height: 1.4;
                margin: 20px;
                background: white;
              }
              @media print {
                body { margin: 0; padding: 10px; }
                .no-print { display: none; }
              }
              .print-content {
                white-space: pre-wrap;
                font-family: inherit;
              }
              .print-actions {
                margin-top: 20px;
                text-align: center;
              }
              .print-btn {
                background: #7c3aed;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                margin: 0 5px;
                font-size: 14px;
              }
              .print-btn:hover {
                background: #6d28d9;
              }
            </style>
          </head>
          <body>
            <div class="print-content">${content}</div>
            <div class="print-actions no-print">
              <button class="print-btn" onclick="window.print()">Print</button>
              <button class="print-btn" onclick="window.close()">Close</button>
            </div>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Test print window opened!');
      
    } catch (error) {
      console.error('Error opening test print:', error);
      toast.error('Failed to open test print window. Please try again.');
    }
  };

  const updateCustomization = (updates) => {
    try {
      if (!updates || typeof updates !== 'object') {
        console.error('Invalid updates object:', updates);
        return;
      }
      
      setCustomization(prev => {
        if (!prev || typeof prev !== 'object') {
          console.error('Invalid previous customization state:', prev);
          return initializeCustomization();
        }
        
        const newCustomization = { ...prev, ...updates };
        
        // Validate critical fields
        if (newCustomization.print_copies) {
          newCustomization.print_copies = Math.max(1, Math.min(5, parseInt(newCustomization.print_copies) || 1));
        }
        
        if (newCustomization.paper_width && !['58mm', '80mm'].includes(newCustomization.paper_width)) {
          newCustomization.paper_width = '80mm';
        }
        
        if (newCustomization.font_size && !['small', 'medium', 'large'].includes(newCustomization.font_size)) {
          newCustomization.font_size = 'medium';
        }
        
        return newCustomization;
      });
    } catch (error) {
      console.error('Error updating customization:', error);
      toast.error('Error updating settings. Please try again.');
    }
  };

  const ToggleSwitch = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-sm">{label}</p>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-violet-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="space-y-6 mobile-scroll-fix">
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 mb-2">Configuration Issues:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
        <button
          onClick={() => setActiveTab('receipt')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'receipt' 
              ? 'bg-white shadow text-violet-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Receipt Settings
        </button>
        <button
          onClick={() => setActiveTab('kot')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
            activeTab === 'kot' 
              ? 'bg-white shadow text-violet-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Printer className="w-4 h-4" />
          KOT Settings
        </button>
      </div>

      {/* Status Indicator */}
      <Card className={`border-0 shadow-lg ${
        validationErrors.length > 0 
          ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' 
          : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                validationErrors.length > 0 ? 'bg-yellow-500' : 'bg-green-500'
              } animate-pulse`}></div>
              <div>
                <p className={`font-medium ${
                  validationErrors.length > 0 ? 'text-yellow-800' : 'text-green-800'
                }`}>
                  Print Settings Status
                  {hasUnsavedChanges && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Unsaved Changes</span>}
                </p>
                <p className={`text-sm ${
                  validationErrors.length > 0 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {validationErrors.length > 0 
                    ? `${validationErrors.length} issue(s) need attention`
                    : businessSettings?.restaurant_name ? 'Ready for printing' : 'Configure business details first'
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                validationErrors.length > 0 ? 'text-yellow-800' : 'text-green-800'
              }`}>
                Paper: {customization.paper_width}
              </p>
              <p className={`text-xs ${
                validationErrors.length > 0 ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {activeTab === 'receipt' 
                  ? `Theme: ${(customization.print_theme || 'default') === 'professional' ? 'Professional' : 'Default'}`
                  : `KOT: ${(customization.kot_theme || 'classic').charAt(0).toUpperCase() + (customization.kot_theme || 'classic').slice(1)}`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-4 order-2 xl:order-1">
          {activeTab === 'receipt' ? (
            <>
              {/* Paper & Font Settings */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-violet-600" />
                    Paper & Font
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Paper Width</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['58mm', '80mm'].map(width => (
                        <button
                          key={width}
                          onClick={() => updateCustomization({ paper_width: width })}
                          className={`p-3 border-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                            customization.paper_width === width 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {width === '58mm' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                          {width}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Font Size</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => updateCustomization({ font_size: size })}
                          className={`p-2 border-2 rounded-lg capitalize transition-all ${
                            customization.font_size === size 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Border Style</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['single', 'double'].map(style => (
                        <button
                          key={style}
                          onClick={() => updateCustomization({ border_style: style })}
                          className={`p-2 border-2 rounded-lg capitalize transition-all ${
                            customization.border_style === style 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {style === 'single' ? '─────' : '═════'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>Separator Style</Label>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {[
                        { id: 'dashes', label: '- - -' },
                        { id: 'dots', label: '...' },
                        { id: 'equals', label: '===' },
                        { id: 'line', label: '───' },
                      ].map(style => (
                        <button
                          key={style.id}
                          onClick={() => updateCustomization({ separator_style: style.id })}
                          className={`p-2 border-2 rounded-lg text-xs transition-all ${
                            customization.separator_style === style.id 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Print Theme Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    Print Theme
                  </CardTitle>
                  <CardDescription>
                    Choose the print style for your receipts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        id: 'default',
                        name: 'Classic Thermal',
                        description: 'Traditional thermal printer style with Courier font',
                        features: ['Courier New font', 'Traditional spacing', 'Bold headers', 'Compatible with all printers']
                      },
                      {
                        id: 'professional',
                        name: 'Professional Clean',
                        description: 'Clean thermal printer style matching high-quality bills',
                        features: ['Courier New font', 'Optimized spacing', 'Clean layout', 'Thermal printer optimized']
                      },
                      {
                        id: 'modern',
                        name: 'Modern Sleek',
                        description: 'Contemporary design with enhanced typography',
                        features: ['Modern fonts', 'Card-style sections', 'Visual hierarchy', 'Enhanced readability']
                      },
                      {
                        id: 'compact',
                        name: 'Space Saver',
                        description: 'Ultra-compact format for paper efficiency',
                        features: ['Minimal spacing', 'Condensed layout', 'Paper efficient', 'High-volume friendly']
                      },
                      {
                        id: 'elegant',
                        name: 'Elegant Premium',
                        description: 'Sophisticated design for upscale establishments',
                        features: ['Premium typography', 'Elegant spacing', 'Refined layout', 'Luxury appearance']
                      },
                      {
                        id: 'bold',
                        name: 'Bold Impact',
                        description: 'High-contrast design with strong visual elements',
                        features: ['Bold typography', 'High contrast', 'Strong headers', 'Easy scanning']
                      }
                    ].map(theme => (
                      <div
                        key={theme.id}
                        onClick={() => updateCustomization({ print_theme: theme.id })}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          (customization.print_theme || 'default') === theme.id
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{theme.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{theme.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {theme.features.map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            (customization.print_theme || 'default') === theme.id
                              ? 'border-violet-600 bg-violet-600'
                              : 'border-gray-300'
                          }`}>
                            {(customization.print_theme || 'default') === theme.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> The Professional theme provides better font quality and spacing similar to high-end thermal printer bills. 
                      Both themes maintain full compatibility with your existing settings.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Header Content */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layout className="w-5 h-5 text-violet-600" />
                    Header Content
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <ToggleSwitch 
                    label="Show Logo" 
                    checked={customization.show_logo}
                    onChange={(v) => updateCustomization({ show_logo: v })}
                  />
                  {customization.show_logo && (
                    <div className="ml-4 mt-2">
                      <Label>Logo Size</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {['small', 'medium', 'large'].map(size => (
                          <button
                            key={size}
                            onClick={() => updateCustomization({ logo_size: size })}
                            className={`p-2 border-2 rounded-lg capitalize text-xs transition-all ${
                              customization.logo_size === size 
                                ? 'border-violet-600 bg-violet-50' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <ToggleSwitch 
                    label="Show Tagline" 
                    checked={customization.show_tagline}
                    onChange={(v) => updateCustomization({ show_tagline: v })}
                  />
                  <ToggleSwitch 
                    label="Show Address" 
                    checked={customization.show_address}
                    onChange={(v) => updateCustomization({ show_address: v })}
                  />
                  <ToggleSwitch 
                    label="Show Phone" 
                    checked={customization.show_phone}
                    onChange={(v) => updateCustomization({ show_phone: v })}
                  />
                  <ToggleSwitch 
                    label="Show Email" 
                    checked={customization.show_email}
                    onChange={(v) => updateCustomization({ show_email: v })}
                  />
                  <ToggleSwitch 
                    label="Show Website" 
                    checked={customization.show_website}
                    onChange={(v) => updateCustomization({ show_website: v })}
                  />
                  <ToggleSwitch 
                    label="Show GSTIN" 
                    checked={customization.show_gstin}
                    onChange={(v) => updateCustomization({ show_gstin: v })}
                  />
                  <ToggleSwitch 
                    label="Show FSSAI" 
                    checked={customization.show_fssai}
                    onChange={(v) => updateCustomization({ show_fssai: v })}
                  />
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Hash className="w-5 h-5 text-violet-600" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <ToggleSwitch 
                    label="Show Table Number" 
                    checked={customization.show_table_number}
                    onChange={(v) => updateCustomization({ show_table_number: v })}
                  />
                  <ToggleSwitch 
                    label="Show Waiter Name" 
                    checked={customization.show_waiter_name}
                    onChange={(v) => updateCustomization({ show_waiter_name: v })}
                  />
                  <ToggleSwitch 
                    label="Show Customer Name" 
                    checked={customization.show_customer_name}
                    onChange={(v) => updateCustomization({ show_customer_name: v })}
                  />
                  <ToggleSwitch 
                    label="Show Order Time" 
                    checked={customization.show_order_time}
                    onChange={(v) => updateCustomization({ show_order_time: v })}
                  />
                  <ToggleSwitch 
                    label="Show Item Notes" 
                    checked={customization.show_item_notes}
                    onChange={(v) => updateCustomization({ show_item_notes: v })}
                  />
                </CardContent>
              </Card>

              {/* Advanced Options */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-600" />
                    Advanced Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ToggleSwitch 
                    label="QR Code for Unpaid Bills" 
                    checked={customization.qr_code_enabled}
                    onChange={(v) => updateCustomization({ qr_code_enabled: v })}
                    description="Add UPI payment QR code for unpaid/overdue bills"
                  />
                  
                  {customization.qr_code_enabled && (
                    <div className="ml-4 mt-2 space-y-3 p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label>QR Code Size</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {[
                            { id: 'small', label: '80px', size: 80 },
                            { id: 'medium', label: '100px', size: 100 },
                            { id: 'large', label: '120px', size: 120 }
                          ].map(option => (
                            <button
                              key={option.id}
                              onClick={() => updateCustomization({ qr_code_size: option.size })}
                              className={`p-2 border-2 rounded-lg text-xs transition-all ${
                                (customization.qr_code_size || 100) === option.size 
                                  ? 'border-violet-600 bg-violet-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Smaller sizes save paper on thermal printers</p>
                      </div>
                      
                      <div>
                        <Label>Preferred UPI Provider</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {[
                            { id: 'paytm', label: 'Paytm' },
                            { id: 'phonepe', label: 'PhonePe' },
                            { id: 'gpay', label: 'Google Pay' },
                            { id: 'ybl', label: 'YBL' }
                          ].map(provider => (
                            <button
                              key={provider.id}
                              onClick={() => updateCustomization({ preferred_upi_provider: provider.id })}
                              className={`p-2 border-2 rounded-lg text-xs transition-all ${
                                (customization.preferred_upi_provider || 'paytm') === provider.id 
                                  ? 'border-violet-600 bg-violet-50' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {provider.label}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Used when UPI ID is auto-generated from phone</p>
                      </div>
                    </div>
                  )}
                  <ToggleSwitch 
                    label="Auto Print After Payment" 
                    checked={customization.auto_print}
                    onChange={(v) => updateCustomization({ auto_print: v })}
                    description="Automatically print receipt after payment"
                  />
                  <div>
                    <Label>Print Copies</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateCustomization({ print_copies: Math.max(1, customization.print_copies - 1) })}
                        className="w-10 h-10 border-2 rounded-lg hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-bold text-lg">{customization.print_copies}</span>
                      <button
                        onClick={() => updateCustomization({ print_copies: Math.min(5, customization.print_copies + 1) })}
                        className="w-10 h-10 border-2 rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* KOT Theme Selection */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-violet-600" />
                    KOT Theme
                  </CardTitle>
                  <CardDescription>
                    Choose the style for your Kitchen Order Tickets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      {
                        id: 'classic',
                        name: 'Classic KOT',
                        description: 'Traditional kitchen order format with clear sections',
                        features: ['Standard layout', 'Bold headers', 'Clear item display', 'Priority indicators']
                      },
                      {
                        id: 'modern',
                        name: 'Modern KOT',
                        description: 'Contemporary design with visual elements and cards',
                        features: ['Card-based layout', 'Visual symbols', 'Modern styling', 'Enhanced readability']
                      },
                      {
                        id: 'compact',
                        name: 'Compact KOT',
                        description: 'Space-saving format for high-volume kitchens',
                        features: ['Minimal spacing', 'One-line items', 'Ultra-compact', 'Paper efficient']
                      },
                      {
                        id: 'detailed',
                        name: 'Detailed KOT',
                        description: 'Comprehensive format with full order information',
                        features: ['Complete details', 'Numbered items', 'Full timestamps', 'Order summary']
                      },
                      {
                        id: 'minimal',
                        name: 'Minimal KOT',
                        description: 'Clean and simple format with essential info only',
                        features: ['Essential info only', 'Clean design', 'Fast reading', 'Simple layout']
                      },
                      {
                        id: 'colorful',
                        name: 'Colorful KOT',
                        description: 'Visual format with food category symbols and emojis',
                        features: ['Food symbols', 'Category icons', 'Visual appeal', 'Easy identification']
                      }
                    ].map(theme => (
                      <div
                        key={theme.id}
                        onClick={() => updateCustomization({ kot_theme: theme.id })}
                        className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          (customization.kot_theme || 'classic') === theme.id
                            ? 'border-violet-600 bg-violet-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{theme.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{theme.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {theme.features.map((feature, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            (customization.kot_theme || 'classic') === theme.id
                              ? 'border-violet-600 bg-violet-600'
                              : 'border-gray-300'
                          }`}>
                            {(customization.kot_theme || 'classic') === theme.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-800">
                      <strong>Tip:</strong> After changing KOT themes, save settings and print a test KOT to see the new design. 
                      Different themes work better for different kitchen setups - compact themes save paper, while detailed themes provide more information for complex orders.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* KOT Settings */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Printer className="w-5 h-5 text-violet-600" />
                    KOT Print Settings
                  </CardTitle>
                  <CardDescription>
                    Configure Kitchen Order Ticket printing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ToggleSwitch 
                    label="Auto Print KOT" 
                    checked={customization.kot_auto_print}
                    onChange={(v) => updateCustomization({ kot_auto_print: v })}
                    description="Automatically print KOT when order is placed"
                  />
                  
                  <div>
                    <Label>KOT Font Size</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {['small', 'medium', 'large'].map(size => (
                        <button
                          key={size}
                          onClick={() => updateCustomization({ kot_font_size: size })}
                          className={`p-2 border-2 rounded-lg capitalize transition-all ${
                            customization.kot_font_size === size 
                              ? 'border-violet-600 bg-violet-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Larger fonts are easier to read in kitchen</p>
                  </div>

                  <ToggleSwitch 
                    label="Show Order Time" 
                    checked={customization.kot_show_time}
                    onChange={(v) => updateCustomization({ kot_show_time: v })}
                    description="Display time when order was placed"
                  />
                  
                  <ToggleSwitch 
                    label="Highlight Special Notes" 
                    checked={customization.kot_highlight_notes}
                    onChange={(v) => updateCustomization({ kot_highlight_notes: v })}
                    description="Make special instructions stand out"
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleSave}
              disabled={loading || validationErrors.length > 0}
              className={`flex-1 ${
                validationErrors.length > 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-violet-600 to-purple-600'
              }`}
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleTestPrint}
                className="flex-1 sm:flex-none px-4"
                disabled={validationErrors.length > 0}
              >
                <Printer className="w-4 h-4 mr-2" />
                Test Print
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="px-4"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              {/* Debug button for troubleshooting */}
              <Button
                variant="outline"
                onClick={() => {
                  console.log('🔧 DEBUG INFO:');
                  console.log('Token:', localStorage.getItem('token') ? 'Available' : 'Missing');
                  console.log('User:', localStorage.getItem('user') ? 'Available' : 'Missing');
                  console.log('Business Settings:', businessSettings);
                  console.log('Current Customization:', customization);
                  console.log('Has Unsaved Changes:', hasUnsavedChanges);
                  console.log('Validation Errors:', validationErrors);
                  console.log('API URL:', API);
                  toast.info('Debug info logged to console');
                }}
                className="px-2"
                title="Debug Info"
              >
                🔧
              </Button>
            </div>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="order-1 xl:order-2 xl:sticky xl:top-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-600" />
                Live Preview
                {hasUnsavedChanges && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                    Unsaved
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {activeTab === 'receipt' ? 'Receipt preview' : 'KOT preview'} with current settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-4 overflow-auto mobile-scroll-fix"
                style={{ 
                  maxHeight: '400px',
                  fontFamily: "'Courier New', Consolas, monospace",
                  fontSize: customization.font_size === 'small' ? '10px' : 
                           customization.font_size === 'large' ? '14px' : '12px',
                  lineHeight: '1.4'
                }}
              >
                <pre className="whitespace-pre-wrap text-gray-800">
                  {previewContent}
                </pre>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>Paper: {customization.paper_width}</span>
                <span>Theme: {(customization.print_theme || 'default') === 'professional' ? 'Professional' : 'Default'}</span>
                <span>Copies: {customization.print_copies}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrintCustomization;