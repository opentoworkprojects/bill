// Centralized print utilities for thermal printer support
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

// Direct thermal print function - opens print dialog immediately
export const printThermal = (htmlContent, paperWidth = '80mm') => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!printWindow) {
    toast.error('Popup blocked! Please allow popups for printing.');
    return false;
  }

  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  const fontSize = paperWidth === '58mm' ? '10px' : '12px';
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Print</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: ${width} auto;
          margin: 0;
        }
        
        @media print {
          html, body {
            width: ${width};
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
        
        body {
          font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
          font-size: ${fontSize};
          line-height: 1.3;
          width: ${width};
          max-width: ${width};
          margin: 0 auto;
          padding: 5mm;
          background: #fff;
          color: #000;
        }
        
        .receipt {
          width: 100%;
        }
        
        .center {
          text-align: center;
        }
        
        .bold {
          font-weight: bold;
        }
        
        .large {
          font-size: 1.2em;
        }
        
        .small {
          font-size: 0.85em;
        }
        
        .separator {
          border-top: 1px dashed #000;
          margin: 3mm 0;
        }
        
        .double-line {
          border-top: 2px solid #000;
          margin: 3mm 0;
        }
        
        .item-row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
        }
        
        .item-name {
          flex: 1;
          word-break: break-word;
        }
        
        .item-price {
          text-align: right;
          white-space: nowrap;
          margin-left: 2mm;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: bold;
          margin: 1mm 0;
        }
        
        .grand-total {
          font-size: 1.3em;
          margin: 2mm 0;
        }
        
        .note {
          font-size: 0.8em;
          color: #333;
          margin-left: 3mm;
        }
        
        .kot-item {
          font-size: 1.1em;
          font-weight: bold;
          margin: 2mm 0;
          padding: 1mm;
          border: 1px solid #000;
        }
        
        .kot-note {
          background: #000;
          color: #fff;
          padding: 1mm 2mm;
          margin: 1mm 0 2mm 3mm;
          font-weight: bold;
        }
        
        .header-logo {
          font-size: 1.4em;
          font-weight: bold;
          margin-bottom: 2mm;
        }
        
        .footer {
          margin-top: 4mm;
          font-size: 0.9em;
        }
        
        .mb-1 { margin-bottom: 1mm; }
        .mb-2 { margin-bottom: 2mm; }
        .mt-2 { margin-top: 2mm; }
      </style>
    </head>
    <body>
      <div class="receipt">
        ${htmlContent}
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          }, 200);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  return true;
};

// Generate receipt HTML for thermal printer
export const generateReceiptHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const business = businessOverride || getBusinessSettings();
  
  const restaurantName = business?.restaurant_name || 'Restaurant';
  const address = business?.address || '';
  const phone = business?.phone || '';
  const gstin = business?.gstin || '';
  const fssai = business?.fssai || '';
  const tagline = business?.tagline || '';
  const footerMsg = business?.footer_message || 'Thank you for dining with us!';
  const logoUrl = business?.logo_url || '';
  
  let html = '';
  
  // Header with Logo
  if (settings.show_logo && logoUrl) {
    html += `<div class="center mb-2"><img src="${logoUrl}" alt="Logo" style="max-width: 80px; max-height: 60px; object-fit: contain;" onerror="this.style.display='none'" /></div>`;
  }
  
  html += `<div class="center header-logo">${restaurantName}</div>`;
  
  if (settings.show_tagline && tagline) {
    html += `<div class="center small mb-1">${tagline}</div>`;
  }
  
  html += '<div class="double-line"></div>';
  
  // Business Info
  if (settings.show_address && address) {
    html += `<div class="center small">${address}</div>`;
  }
  if (settings.show_phone && phone) {
    html += `<div class="center small">📞 ${phone}</div>`;
  }
  if (settings.show_gstin && gstin) {
    html += `<div class="center small">GSTIN: ${gstin}</div>`;
  }
  if (settings.show_fssai && fssai) {
    html += `<div class="center small">FSSAI: ${fssai}</div>`;
  }
  
  html += '<div class="separator"></div>';
  
  // Order Info
  html += `<div class="item-row"><span>🧾 BILL #${(order.id || '').toString().slice(0, 8)}</span></div>`;
  
  if (settings.show_table_number && order.table_number) {
    html += `<div class="item-row"><span>🪑 Table ${order.table_number}</span>`;
    if (settings.show_waiter_name && order.waiter_name) {
      html += `<span>👤 ${order.waiter_name}</span>`;
    }
    html += '</div>';
  } else if (settings.show_waiter_name && order.waiter_name) {
    html += `<div class="item-row"><span>👤 ${order.waiter_name}</span></div>`;
  }
  
  if (settings.show_customer_name && order.customer_name) {
    html += `<div class="item-row"><span>👥 ${order.customer_name}</span></div>`;
  }
  
  if (settings.show_order_time) {
    const date = new Date(order.created_at || Date.now());
    html += `<div class="item-row"><span>📅 ${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span></div>`;
  }
  
  html += '<div class="separator"></div>';
  html += '<div class="center bold mb-2">ORDER ITEMS</div>';
  html += '<div class="separator"></div>';
  
  // Items
  (order.items || []).forEach(item => {
    const itemTotal = (item.quantity * item.price).toFixed(2);
    html += `
      <div class="item-row">
        <span class="item-name">${item.quantity}× ${item.name}</span>
        <span class="item-price">₹${item.price.toFixed(2)}</span>
      </div>
      <div class="item-row">
        <span></span>
        <span class="item-price bold">₹${itemTotal}</span>
      </div>
    `;
    
    if (settings.show_item_notes && item.notes) {
      html += `<div class="note">📝 ${item.notes}</div>`;
    }
  });
  
  html += '<div class="separator"></div>';
  
  // Totals
  const subtotal = order.subtotal || 0;
  const tax = order.tax || 0;
  const total = order.total || 0;
  
  html += `
    <div class="total-row">
      <span>Subtotal</span>
      <span>₹${subtotal.toFixed(2)}</span>
    </div>
    <div class="total-row small">
      <span>Tax (5.0%)</span>
      <span>₹${tax.toFixed(2)}</span>
    </div>
  `;
  
  html += '<div class="double-line"></div>';
  
  html += `
    <div class="total-row grand-total">
      <span>💰 TOTAL</span>
      <span>₹${total.toFixed(2)}</span>
    </div>
  `;
  
  html += '<div class="double-line"></div>';
  
  // Payment method if available
  if (order.payment_method) {
    html += `<div class="center small mb-2">Payment: ${order.payment_method.toUpperCase()}</div>`;
  }
  
  // Footer
  html += `
    <div class="footer center">
      <div class="mb-1">✨ ${footerMsg} ✨</div>
      ${gstin ? `<div class="small">GSTIN: ${gstin}</div>` : ''}
    </div>
  `;
  
  return html;
};

// Generate KOT HTML for thermal printer
export const generateKOTHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const business = businessOverride || getBusinessSettings();
  
  let html = '';
  
  // KOT Header
  html += `
    <div class="center bold large">🍳 KITCHEN ORDER TICKET 🍳</div>
    <div class="double-line"></div>
  `;
  
  // Order Info
  html += `
    <div class="item-row bold">
      <span>ORDER #${(order.id || '').toString().slice(0, 8)}</span>
    </div>
    <div class="item-row large bold">
      <span>🪑 TABLE: ${order.table_number || 'N/A'}</span>
    </div>
    <div class="item-row">
      <span>👤 Server: ${order.waiter_name || 'N/A'}</span>
    </div>
  `;
  
  if (settings.kot_show_time) {
    const date = new Date(order.created_at || Date.now());
    html += `<div class="item-row"><span>⏰ ${date.toLocaleTimeString()}</span></div>`;
  }
  
  if (order.customer_name) {
    html += `<div class="item-row"><span>👥 Customer: ${order.customer_name}</span></div>`;
  }
  
  html += '<div class="double-line"></div>';
  html += '<div class="center bold large mb-2">📋 ITEMS TO PREPARE</div>';
  html += '<div class="separator"></div>';
  
  // Items - Large and clear for kitchen
  (order.items || []).forEach(item => {
    html += `
      <div class="kot-item">
        ${item.quantity}× ${item.name.toUpperCase()}
      </div>
    `;
    
    if (settings.kot_highlight_notes && item.notes) {
      html += `<div class="kot-note">⚠️ ${item.notes.toUpperCase()}</div>`;
    }
  });
  
  html += '<div class="separator"></div>';
  
  // Total items count
  const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
  html += `
    <div class="center bold large mt-2">
      TOTAL ITEMS: ${totalItems}
    </div>
  `;
  
  html += '<div class="double-line"></div>';
  
  // Priority indicator
  html += `
    <div class="center bold">
      ${order.priority === 'high' ? '🔴 HIGH PRIORITY' : '🟢 NORMAL'}
    </div>
  `;
  
  return html;
};

// Generate receipt content (text format for backward compatibility)
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
    
    receipt += doubleSep + '\n';
    receipt += centeredName + '\n';
    
    if (settings.show_tagline && businessSettings?.tagline) {
      const tagline = businessSettings.tagline;
      receipt += tagline.padStart((width + tagline.length) / 2).padEnd(width) + '\n';
    }
    
    receipt += doubleSep + '\n';
    
    if (settings.show_address && businessSettings?.address) {
      receipt += businessSettings.address.substring(0, width) + '\n';
    }
    if (settings.show_phone && businessSettings?.phone) {
      receipt += `Phone: ${businessSettings.phone}\n`;
    }
    if (settings.show_gstin && businessSettings?.gstin) {
      receipt += `GSTIN: ${businessSettings.gstin}\n`;
    }
    
    receipt += sep + '\n';
    
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
    
    const subtotal = order.subtotal || 0;
    const tax = order.tax || 0;
    const total = order.total || 0;
    
    receipt += `Subtotal:${' '.repeat(width - 18)}₹${subtotal.toFixed(2)}\n`;
    receipt += `Tax:${' '.repeat(width - 13)}₹${tax.toFixed(2)}\n`;
    receipt += doubleSep + '\n';
    receipt += `TOTAL:${' '.repeat(width - 15)}₹${total.toFixed(2)}\n`;
    receipt += doubleSep + '\n';
    
    const footer = businessSettings?.footer_message || 'Thank you for dining with us!';
    receipt += '\n' + footer.padStart((width + footer.length) / 2).padEnd(width) + '\n';
    
    receipt += doubleSep + '\n';
    
    return receipt;
    
  } catch (error) {
    console.error('Error generating receipt content:', error);
    return 'Error generating receipt content';
  }
};

// Generate KOT content (text format for backward compatibility)
export const generateKOTContent = (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    
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
    
    kot += '\n' + dash + '\n';
    kot += 'ITEMS TO PREPARE:\n';
    kot += dash + '\n\n';
    
    (order.items || []).forEach((item, idx) => {
      kot += `${item.quantity}x ${item.name.toUpperCase()}\n`;
      
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

// Main print receipt function - uses thermal HTML format
export const printReceipt = (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    const html = generateReceiptHTML(order, businessOverride);
    return printThermal(html, settings.paper_width);
  } catch (error) {
    console.error('Error printing receipt:', error);
    toast.error('Failed to print receipt');
    return false;
  }
};

// Main print KOT function - uses thermal HTML format
export const printKOT = (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    const html = generateKOTHTML(order, businessOverride);
    return printThermal(html, settings.paper_width);
  } catch (error) {
    console.error('Error printing KOT:', error);
    toast.error('Failed to print KOT');
    return false;
  }
};

// Legacy print document function (for backward compatibility)
export const printDocument = (content, title = 'Print', type = 'receipt') => {
  try {
    const settings = getPrintSettings();
    const paperWidth = settings.paper_width || '80mm';
    const width = paperWidth === '58mm' ? '58mm' : '80mm';
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    if (!printWindow) {
      toast.error('Popup blocked! Please allow popups for printing.');
      return false;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <style>
          @page {
            size: ${width} auto;
            margin: 0;
          }
          @media print {
            html, body {
              width: ${width};
              margin: 0 !important;
              padding: 0 !important;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: ${paperWidth === '58mm' ? '10px' : '12px'};
            line-height: 1.3;
            width: ${width};
            margin: 0 auto;
            padding: 5mm;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>${content}</body>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }, 200);
        };
      </script>
      </html>
    `);
    
    printWindow.document.close();
    return true;
    
  } catch (error) {
    console.error('Error printing document:', error);
    toast.error('Failed to print');
    return false;
  }
};

// Print with multiple copies
export const printWithCopies = (content, title = 'Print', type = 'receipt') => {
  try {
    const settings = getPrintSettings();
    const copies = settings.print_copies || 1;
    
    for (let i = 0; i < copies; i++) {
      setTimeout(() => {
        printDocument(content, `${title} (Copy ${i + 1}/${copies})`, type);
      }, i * 1500);
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
