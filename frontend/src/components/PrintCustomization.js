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
        auto_print: ps.auto_print ?? false,
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
        auto_print: false,
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
      // Fallback to the original preview generation
      if (activeTab === 'receipt') {
        setPreviewContent(generateReceiptPreview());
      } else {
        setPreviewContent(generateKOTPreview());
      }
    }
  };

  const generateReceiptPreview = () => {
    const width = customization.paper_width === '58mm' ? 32 : 48;
    const sep = customization.separator_style === 'dashes' ? '-'.repeat(width) : 
                customization.separator_style === 'dots' ? '.'.repeat(width) :
                customization.separator_style === 'equals' ? '='.repeat(width) : 
                '─'.repeat(width);
    
    const doubleSep = customization.border_style === 'double' ? '═'.repeat(width) : sep;
    
    const restaurantName = businessSettings?.restaurant_name || 'Your Restaurant';
    const center = (text) => {
      if (text.length >= width) return text.substring(0, width);
      const padding = Math.floor((width - text.length) / 2);
      return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
    };

    let preview = '';
    
    // Header
    preview += doubleSep + '\n';
    preview += center(restaurantName) + '\n';
    
    if (customization.show_tagline && businessSettings?.tagline) {
      preview += center(businessSettings.tagline) + '\n';
    }
    
    if (customization.show_fssai && businessSettings?.fssai) {
      preview += center(`FSSAI: ${businessSettings.fssai}`) + '\n';
    }
    
    preview += doubleSep + '\n';
    
    if (customization.show_address && businessSettings?.address) {
      preview += center(businessSettings.address.substring(0, width)) + '\n';
    }
    if (customization.show_phone && businessSettings?.phone) {
      preview += center(`Phone: ${businessSettings.phone}`) + '\n';
    }
    if (customization.show_email && businessSettings?.email) {
      preview += center(`Email: ${businessSettings.email}`) + '\n';
    }
    if (customization.show_website && businessSettings?.website) {
      preview += center(`Web: ${businessSettings.website}`) + '\n';
    }
    if (customization.show_gstin && businessSettings?.gstin) {
      preview += center(`GSTIN: ${businessSettings.gstin}`) + '\n';
    }
    
    preview += sep + '\n';
    preview += center('BILL') + '\n';
    preview += sep + '\n';
    
    // Order details
    const date = new Date();
    preview += `Bill #: ABC12345\n`;
    if (customization.show_table_number) preview += `Table: 5\n`;
    if (customization.show_waiter_name) preview += `Server: John Doe\n`;
    if (customization.show_customer_name) preview += `Customer: Guest\n`;
    if (customization.show_order_time) preview += `Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n`;
    
    preview += sep + '\n';
    preview += 'Item            Qty    Rate     Amt\n';
    preview += sep + '\n';
    
    // Sample items
    const items = [
      { qty: 2, name: 'Butter Chicken', price: 350 },
      { qty: 1, name: 'Garlic Naan', price: 60 },
      { qty: 2, name: 'Jeera Rice', price: 120 },
    ];
    
    items.forEach(item => {
      const itemName = item.name.substring(0, 14).padEnd(14);
      const qty = item.qty.toString().padStart(3);
      const rate = item.price.toFixed(2).padStart(8);
      const amt = (item.qty * item.price).toFixed(2).padStart(8);
      preview += `${itemName} ${qty} ${rate} ${amt}\n`;
      
      if (customization.show_item_notes && item.name === 'Butter Chicken') {
        preview += `   Note: Extra spicy\n`;
      }
    });
    
    preview += sep + '\n';
    
    // Totals
    const subtotal = 880;
    const tax = 44;
    const total = 924;
    const totalItems = items.reduce((s, i) => s + i.qty, 0);
    
    preview += `Sub Total       ${totalItems.toString().padStart(3)}     -  ${subtotal.toFixed(2).padStart(8)}\n`;
    preview += `Tax (5%)                       ${tax.toFixed(2).padStart(8)}\n`;
    preview += doubleSep + '\n';
    preview += `TOTAL DUE                      ${total.toFixed(2).padStart(8)}\n`;
    preview += doubleSep + '\n';
    
    // Payment details
    preview += `Payment Mode:                      CASH\n`;
    preview += `Amount Received:               ${500.00.toFixed(2).padStart(8)}\n`;
    preview += `BALANCE DUE:                   ${424.00.toFixed(2).padStart(8)}\n`;
    preview += sep + '\n';
    
    // QR Code section
    if (customization.qr_code_enabled) {
      preview += '\n' + center('SCAN TO PAY BALANCE') + '\n';
      preview += center('[QR CODE WILL BE PRINTED HERE]') + '\n';
      preview += center('█████████████████████████') + '\n';
      preview += center('█ ▄▄▄▄▄ █▀█ █ ▄▄▄▄▄ █') + '\n';
      preview += center('█ █   █ █▀▀ █ █   █ █') + '\n';
      preview += center('█ █▄▄▄█ █▀█ █ █▄▄▄█ █') + '\n';
      preview += center('█▄▄▄▄▄▄▄█▄▀▄█▄▄▄▄▄▄▄█') + '\n';
      preview += center('██▄▄▄▄▄█▀▀▀█▀▀▀█▄▄▄▄█') + '\n';
      preview += center('█ ▄▄▄▄▄ █▄█ █ ████▀▄█') + '\n';
      preview += center('█ █▄▄▄█ █▀█ █▄▄█▄▄▄▄█') + '\n';
      preview += center('█▄▄▄▄▄▄▄█▄▄▄█▄█▄▄▄▄▄█') + '\n';
      preview += center('█████████████████████████') + '\n';
      preview += center(`Balance Due: ₹424.00`) + '\n';
      const upiId = businessSettings?.upi_id || (businessSettings?.phone ? `${businessSettings.phone}@paytm` : 'payment@restaurant.com');
      preview += center(`UPI ID: ${upiId}`) + '\n';
      preview += sep + '\n';
    }
    
    // Footer
    const footer = businessSettings?.footer_message || 'Thank you for dining with us!';
    preview += '\n' + center(footer) + '\n';
    preview += center('Bill generated by BillByteKOT') + '\n';
    preview += center('(billbytekot.in)') + '\n';
    preview += doubleSep + '\n';
    
    return preview;
  };

  const generateKOTPreview = () => {
    const width = customization.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(width);
    const dash = '-'.repeat(width);
    
    const center = (text) => {
      if (text.length >= width) return text.substring(0, width);
      const padding = Math.floor((width - text.length) / 2);
      return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding);
    };
    
    let preview = '';
    
    preview += sep + '\n';
    preview += center('*** KOT ***') + '\n';
    preview += center('KITCHEN ORDER TICKET') + '\n';
    preview += sep + '\n\n';
    
    preview += `ORDER #: KOT-001234\n`;
    preview += `TABLE: 5\n`;
    preview += `SERVER: John Doe\n`;
    if (customization.kot_show_time) {
      preview += `TIME: ${new Date().toLocaleTimeString()}\n`;
    }
    preview += `PRIORITY: NORMAL\n`;
    
    preview += '\n' + dash + '\n';
    preview += center('ITEMS TO PREPARE') + '\n';
    preview += dash + '\n\n';
    
    // Sample KOT items with large font simulation
    const items = [
      { qty: 2, name: 'BUTTER CHICKEN', notes: 'Extra spicy' },
      { qty: 1, name: 'GARLIC NAAN', notes: '' },
      { qty: 2, name: 'JEERA RICE', notes: 'Less salt' },
    ];
    
    items.forEach((item, idx) => {
      if (customization.kot_font_size === 'large') {
        preview += `>>> ${item.qty} × ${item.name} <<<\n`;
      } else if (customization.kot_font_size === 'medium') {
        preview += `>> ${item.qty} × ${item.name} <<\n`;
      } else {
        preview += `${item.qty} × ${item.name}\n`;
      }
      
      if (customization.kot_highlight_notes && item.notes) {
        preview += `    *** ${item.notes.toUpperCase()} ***\n`;
      }
      
      if (idx < items.length - 1) preview += '\n';
    });
    
    preview += '\n' + dash + '\n';
    preview += center(`TOTAL ITEMS: ${items.reduce((sum, i) => sum + i.qty, 0)}`) + '\n';
    preview += sep + '\n';
    
    return preview;
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
      toast.success('Print settings saved successfully!');
      
      // Safely update parent component
      try {
        if (onUpdate && typeof onUpdate === 'function') {
          onUpdate(updatedSettings);
        }
      } catch (updateError) {
        console.warn('Error updating parent component:', updateError);
        // Don't fail the save operation if parent update fails
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
      auto_print: false,
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
                Font: {customization.font_size}
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
                <span>Font: {customization.font_size}</span>
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