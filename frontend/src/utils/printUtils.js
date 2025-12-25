// Centralized print utilities that apply global print settings
import { toast } from 'sonner';

// Get current print settings from localStorage or defaults
export const getPrintSettings = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const settings = user.business_settings?.print_customization || {};
    
    return {
      paper_width: settings.paper_width || '80mm',
      font_size: settings.font_size || 'medium',
      header_style: settings.header_style || 'centered',
      show_logo: settings.show_logo ?? true,
      show_address: settings.show_address ?? true,
      show_phone: settings.show_phone ?? true,
      show_email: settings.show_email ?? false,
      show_website: settings.show_website ?? false,
      show_gstin: settings.show_gstin ?? true,
      show_fssai: settings.show_fssai ?? false,
      show_tagline: settings.show_tagline ?? true,
      show_customer_name: settings.show_customer_name ?? true,
      show_waiter_name: settings.show_waiter_name ?? true,
      show_table_number: settings.show_table_number ?? true,
      show_order_time: settings.show_order_time ?? true,
      show_item_notes: settings.show_item_notes ?? true,
      border_style: settings.border_style || 'single',
      separator_style: settings.separator_style || 'dashes',
      footer_style: settings.footer_style || 'simple',
      qr_code_enabled: settings.qr_code_enabled ?? false,
      auto_print: settings.auto_print ?? false,
      print_copies: Math.max(1, Math.min(5, parseInt(settings.print_copies) || 1)),
      kot_auto_print: settings.kot_auto_print ?? true,
      kot_font_size: settings.kot_font_size || 'large',
      kot_show_time: settings.kot_show_time ?? true,
      kot_highlight_notes: settings.kot_highlight_notes ?? true,
    };
  } catch (error) {
    console.error('Error getting print settings:', error);
    // Return safe defaults
    return {
      paper_width: '80mm',
      font_size: 'medium',
      print_copies: 1,
      kot_auto_print: true,
      kot_font_size: 'large',
      auto_print: false,
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
      qr_code_enabled: false,
      kot_show_time: true,
      kot_highlight_notes: true,
    };
  }
};

// Get business settings safely
export const getBusinessSettings = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.business_settings || {};
  } catch (error) {
    console.error('Error getting business settings:', error);
    return {};
  }
};

// Centralized print function that applies global settings
export const printDocument = (content, title = 'Print', type = 'receipt') => {
  try {
    const settings = getPrintSettings();
    
    const fontSize = settings.font_size === 'small' ? '10px' : 
                    settings.font_size === 'large' ? '14px' : '12px';
    
    const kotFontSize = settings.kot_font_size === 'small' ? '12px' : 
                       settings.kot_font_size === 'large' ? '16px' : '14px';
    
    const actualFontSize = type === 'kot' ? kotFontSize : fontSize;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (!printWindow) {
      toast.error('Unable to open print window. Please check your popup blocker settings.');
      return false;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Courier New', Consolas, monospace;
              font-size: ${actualFontSize};
              line-height: 1.4;
              margin: 20px;
              background: white;
              color: #000;
            }
            @media print {
              body { 
                margin: 0; 
                padding: 10px; 
                font-size: ${actualFontSize};
              }
              .no-print { display: none !important; }
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
              font-weight: 600;
            }
            .print-btn:hover {
              background: #6d28d9;
            }
            .btn-close {
              background: #6b7280;
            }
            .btn-close:hover {
              background: #4b5563;
            }
          </style>
        </head>
        <body>
          <div class="print-content">${content}</div>
          <div class="print-actions no-print">
            <button class="print-btn" onclick="window.print()">🖨️ Print</button>
            <button class="print-btn btn-close" onclick="window.close()">✕ Close</button>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Auto-print based on settings
    if ((type === 'receipt' && settings.auto_print) || (type === 'kot' && settings.kot_auto_print)) {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (printError) {
          console.error('Auto-print failed:', printError);
        }
      }, 500);
    }
    
    return true;
    
  } catch (error) {
    console.error('Error printing document:', error);
    toast.error('Failed to open print window. Please try again.');
    return false;
  }
};

// Generate receipt content with applied settings
export const generateReceiptContent = (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    const businessSettings = businessOverride || getBusinessSettings();
    
    const width = settings.paper_width === '58mm' ? 32 : 48;
    const sep = settings.separator_style === 'dashes' ? '-'.repeat(width) : 
                settings.separator_style === 'dots' ? '.'.repeat(width) :
                settings.separator_style === 'equals' ? '='.repeat(width) : 
                '─'.repeat(width);
    
    const doubleSep = settings.border_style === 'double' ? '═'.repeat(width) : sep;
    
    const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
    const centeredName = restaurantName.length <= width ? 
      restaurantName.padStart((width + restaurantName.length) / 2).padEnd(width) : 
      restaurantName.substring(0, width);

    let receipt = '';
    
    // Header
    receipt += doubleSep + '\n';
    receipt += centeredName + '\n';
    
    if (settings.show_tagline && businessSettings?.tagline) {
      const tagline = businessSettings.tagline;
      receipt += tagline.padStart((width + tagline.length) / 2).padEnd(width) + '\n';
    }
    
    receipt += doubleSep + '\n';
    
    // Business details
    if (settings.show_address && businessSettings?.address) {
      receipt += businessSettings.address.substring(0, width) + '\n';
    }
    if (settings.show_phone && businessSettings?.phone) {
      receipt += `Phone: ${businessSettings.phone}\n`;
    }
    if (settings.show_email && businessSettings?.email) {
      receipt += `Email: ${businessSettings.email}\n`;
    }
    if (settings.show_website && businessSettings?.website) {
      receipt += `Web: ${businessSettings.website}\n`;
    }
    if (settings.show_gstin && businessSettings?.gstin) {
      receipt += `GSTIN: ${businessSettings.gstin}\n`;
    }
    if (settings.show_fssai && businessSettings?.fssai) {
      receipt += `FSSAI: ${businessSettings.fssai}\n`;
    }
    
    receipt += sep + '\n';
    
    // Order details
    receipt += `Bill #: ${order.id?.toString().slice(0, 8) || 'N/A'}\n`;
    if (settings.show_table_number && order.table_number) {
      receipt += `Table: ${order.table_number}\n`;
    }
    if (settings.show_waiter_name && order.waiter_name) {
      receipt += `Server: ${order.waiter_name}\n`;
    }
    if (settings.show_customer_name && order.customer_name) {
      receipt += `Customer: ${order.customer_name}\n`;
    }
    if (settings.show_order_time) {
      receipt += `Date: ${new Date(order.created_at || Date.now()).toLocaleString()}\n`;
    }
    
    receipt += sep + '\n';
    receipt += 'ITEMS:\n';
    receipt += sep + '\n';
    
    // Items
    (order.items || []).forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const priceLine = `₹${(item.quantity * item.price).toFixed(2)}`;
      const spaces = width - itemLine.length - priceLine.length;
      receipt += itemLine + ' '.repeat(Math.max(1, spaces)) + priceLine + '\n';
      
      if (settings.show_item_notes && item.notes) {
        receipt += `   Note: ${item.notes}\n`;
      }
    });
    
    receipt += sep + '\n';
    
    // Totals
    const subtotal = order.subtotal || 0;
    const tax = order.tax || 0;
    const total = order.total || 0;
    
    receipt += `Subtotal:${' '.repeat(width - 18)}₹${subtotal.toFixed(2)}\n`;
    receipt += `Tax:${' '.repeat(width - 13)}₹${tax.toFixed(2)}\n`;
    receipt += doubleSep + '\n';
    receipt += `TOTAL:${' '.repeat(width - 15)}₹${total.toFixed(2)}\n`;
    receipt += doubleSep + '\n';
    
    // Footer
    const footer = businessSettings?.footer_message || 'Thank you for dining with us!';
    receipt += '\n' + footer.padStart((width + footer.length) / 2).padEnd(width) + '\n';
    
    if (settings.qr_code_enabled) {
      receipt += '\n[QR Code for Payment/Feedback]\n';
    }
    
    receipt += doubleSep + '\n';
    
    return receipt;
    
  } catch (error) {
    console.error('Error generating receipt content:', error);
    return 'Error generating receipt content';
  }
};

// Generate KOT content with applied settings
export const generateKOTContent = (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    const businessSettings = businessOverride || getBusinessSettings();
    
    const width = settings.paper_width === '58mm' ? 32 : 48;
    const sep = '='.repeat(width);
    const dash = '-'.repeat(width);
    
    let kot = '';
    
    kot += sep + '\n';
    kot += '*** KITCHEN ORDER TICKET ***'.padStart((width + 28) / 2).padEnd(width) + '\n';
    kot += sep + '\n\n';
    
    kot += `ORDER #: ${order.id?.toString().slice(0, 8) || 'N/A'}\n`;
    kot += `TABLE: ${order.table_number || 'N/A'}\n`;
    kot += `SERVER: ${order.waiter_name || 'N/A'}\n`;
    
    if (settings.kot_show_time) {
      kot += `TIME: ${new Date(order.created_at || Date.now()).toLocaleTimeString()}\n`;
    }
    
    kot += `PRIORITY: ${order.priority || 'NORMAL'}\n`;
    
    kot += '\n' + dash + '\n';
    kot += 'ITEMS TO PREPARE:\n';
    kot += dash + '\n\n';
    
    // Items with enhanced formatting
    (order.items || []).forEach((item, idx) => {
      if (settings.kot_font_size === 'large') {
        kot += `>>> ${item.quantity}x ${item.name.toUpperCase()} <<<\n`;
      } else {
        kot += `${item.quantity}x ${item.name}\n`;
      }
      
      if (settings.kot_highlight_notes && item.notes) {
        kot += `    *** ${item.notes.toUpperCase()} ***\n`;
      }
      
      if (idx < order.items.length - 1) kot += '\n';
    });
    
    kot += '\n' + dash + '\n';
    kot += `TOTAL ITEMS: ${(order.items || []).reduce((sum, i) => sum + i.quantity, 0)}\n`;
    kot += sep + '\n';
    
    return kot;
    
  } catch (error) {
    console.error('Error generating KOT content:', error);
    return 'Error generating KOT content';
  }
};

// Print receipt with global settings
export const printReceipt = (order, businessOverride = null) => {
  try {
    const content = generateReceiptContent(order, businessOverride);
    return printDocument(content, `Receipt - ${order.id?.toString().slice(0, 8) || 'Order'}`, 'receipt');
  } catch (error) {
    console.error('Error printing receipt:', error);
    toast.error('Failed to print receipt');
    return false;
  }
};

// Print KOT with global settings
export const printKOT = (order, businessOverride = null) => {
  try {
    const content = generateKOTContent(order, businessOverride);
    return printDocument(content, `KOT - Table ${order.table_number || 'N/A'}`, 'kot');
  } catch (error) {
    console.error('Error printing KOT:', error);
    toast.error('Failed to print KOT');
    return false;
  }
};

// Print multiple copies if configured
export const printWithCopies = (content, title = 'Print', type = 'receipt') => {
  try {
    const settings = getPrintSettings();
    const copies = settings.print_copies || 1;
    
    for (let i = 0; i < copies; i++) {
      setTimeout(() => {
        printDocument(content, `${title} (Copy ${i + 1}/${copies})`, type);
      }, i * 1000); // Delay between copies
    }
    
    if (copies > 1) {
      toast.success(`Printing ${copies} copies...`);
    }
    
    return true;
  } catch (error) {
    console.error('Error printing multiple copies:', error);
    return printDocument(content, title, type);
  }
};