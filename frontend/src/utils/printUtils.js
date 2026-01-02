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
      show_fssai: settings.show_fssai ?? true,
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
    return getDefaultPrintSettings();
  }
};

const getDefaultPrintSettings = () => ({
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
  show_fssai: true,
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
});

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

// Generate a clean bill number from order ID or use order_number
const getBillNumber = (order) => {
  // If order has a numeric order_number, use it
  if (order.order_number) {
    return order.order_number.toString().padStart(5, '0');
  }
  // Otherwise generate from ID - take last 5 digits or create numeric hash
  const id = order.id || '';
  if (typeof id === 'number') {
    return id.toString().padStart(5, '0');
  }
  // For UUID-style IDs, create a numeric representation
  const numericPart = id.replace(/[^0-9]/g, '').slice(-5) || '00001';
  return numericPart.padStart(5, '0');
};

// Direct thermal print function - prints immediately without dialog
export const printThermal = (htmlContent, paperWidth = '80mm') => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  
  if (!printWindow) {
    toast.error('Popup blocked! Please allow popups for printing.');
    return false;
  }

  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  const baseFontSize = paperWidth === '58mm' ? '11px' : '13px';
  
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
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
        }
        
        body {
          font-family: 'Courier New', 'Lucida Console', Monaco, monospace;
          font-size: ${baseFontSize};
          font-weight: 600;
          line-height: 1.4;
          width: ${width};
          max-width: ${width};
          margin: 0 auto;
          padding: 3mm;
          background: #fff;
          color: #000;
          -webkit-font-smoothing: none;
        }
        
        .receipt {
          width: 100%;
        }
        
        .center {
          text-align: center;
        }
        
        .bold {
          font-weight: 900 !important;
        }
        
        .large {
          font-size: 1.3em;
          font-weight: 900;
        }
        
        .xlarge {
          font-size: 1.5em;
          font-weight: 900;
        }
        
        .small {
          font-size: 0.9em;
        }
        
        .xsmall {
          font-size: 0.8em;
        }
        
        .separator {
          border-top: 1px dashed #000;
          margin: 2mm 0;
        }
        
        .double-line {
          border-top: 2px solid #000;
          margin: 2mm 0;
        }
        
        .dotted-line {
          border-top: 1px dotted #000;
          margin: 2mm 0;
        }
        
        .item-row {
          display: flex;
          justify-content: space-between;
          margin: 1mm 0;
          font-weight: 600;
        }
        
        .item-name {
          flex: 1;
          word-break: break-word;
        }
        
        .item-qty {
          min-width: 30px;
          text-align: center;
          font-weight: 900;
        }
        
        .item-rate {
          min-width: 50px;
          text-align: right;
        }
        
        .item-amt {
          min-width: 60px;
          text-align: right;
          font-weight: 900;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          margin: 1mm 0;
        }
        
        .grand-total {
          font-size: 1.4em;
          font-weight: 900;
          margin: 2mm 0;
        }
        
        .note {
          font-size: 0.85em;
          margin-left: 3mm;
          font-style: italic;
        }
        
        .header-logo {
          font-size: 1.5em;
          font-weight: 900;
          margin-bottom: 1mm;
          letter-spacing: 0.5px;
        }
        
        .footer {
          margin-top: 3mm;
          font-size: 0.9em;
        }
        
        .bill-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.95em;
          margin: 1mm 0;
        }
        
        .table-header {
          display: flex;
          justify-content: space-between;
          font-weight: 900;
          border-bottom: 1px solid #000;
          padding-bottom: 1mm;
          margin-bottom: 1mm;
        }
        
        .mb-1 { margin-bottom: 1mm; }
        .mb-2 { margin-bottom: 2mm; }
        .mt-1 { margin-top: 1mm; }
        .mt-2 { margin-top: 2mm; }
        
        .kot-item {
          font-size: 1.2em;
          font-weight: 900;
          margin: 2mm 0;
          padding: 2mm;
          border: 2px solid #000;
        }
        
        .kot-note {
          background: #000;
          color: #fff;
          padding: 2mm;
          margin: 1mm 0 2mm 3mm;
          font-weight: 900;
        }
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
            }, 300);
          }, 100);
        };
      </script>
    </body>
    </html>
  `);
  
  printWindow.document.close();
  return true;
};


// Generate professional receipt HTML for thermal printer
export const generateReceiptHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const business = businessOverride || getBusinessSettings();
  
  const restaurantName = business?.restaurant_name || 'Restaurant';
  const address = business?.address || '';
  const phone = business?.phone || '';
  const gstin = business?.gstin || '';
  const fssai = business?.fssai || '';
  const tagline = business?.tagline || '';
  const footerMsg = business?.footer_message || 'Thank you! Visit Again...';
  const logoUrl = business?.logo_url || '';
  const upiId = business?.upi_id || '';
  
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Header with Logo
  if (settings.show_logo && logoUrl) {
    html += `<div class="center mb-1"><img src="${logoUrl}" alt="Logo" style="max-width: 70px; max-height: 50px; object-fit: contain;" onerror="this.style.display='none'" /></div>`;
  }
  
  // Restaurant Name - Large and Bold
  html += `<div class="center header-logo">${restaurantName}</div>`;
  
  // Tagline
  if (settings.show_tagline && tagline) {
    html += `<div class="center small mb-1">${tagline}</div>`;
  }
  
  // FSSAI Number
  if (settings.show_fssai && fssai) {
    html += `<div class="center xsmall bold">FSSAI NO: ${fssai}</div>`;
  }
  
  // Address
  if (settings.show_address && address) {
    html += `<div class="center xsmall">${address}</div>`;
  }
  
  // Phone
  if (settings.show_phone && phone) {
    html += `<div class="center xsmall">Contact No : ${phone}</div>`;
  }
  
  html += '<div class="dotted-line"></div>';
  
  // BILL Title
  html += `<div class="center large mb-1">BILL</div>`;
  
  // Bill Info Row - Bill No, Table No, Date/Time
  html += `<div class="bill-info">
    <span>Bill No :${billNo}</span>
    <span>Table No :${order.table_number ? 'T' + order.table_number : 'Counter'}</span>
    <span>Date :${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
  </div>`;
  
  html += `<div class="bill-info">
    <span>Captain :${order.waiter_name || 'Self'}</span>
    <span></span>
    <span>(${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})</span>
  </div>`;
  
  // Customer name if available
  if (settings.show_customer_name && order.customer_name) {
    html += `<div class="bill-info"><span>Customer : ${order.customer_name}</span></div>`;
  }
  
  html += '<div class="double-line"></div>';
  
  // Items Table Header
  html += `<div class="table-header">
    <span style="flex: 2;">Item</span>
    <span style="width: 35px; text-align: center;">Qty</span>
    <span style="width: 55px; text-align: right;">Rate</span>
    <span style="width: 60px; text-align: right;">Amt</span>
  </div>`;
  
  // Items
  (order.items || []).forEach(item => {
    const itemTotal = (item.quantity * item.price).toFixed(2);
    html += `
      <div class="item-row">
        <span style="flex: 2;">${item.name}</span>
        <span style="width: 35px; text-align: center;">${item.quantity}</span>
        <span style="width: 55px; text-align: right;">${item.price.toFixed(2)}</span>
        <span style="width: 60px; text-align: right;">${itemTotal}</span>
      </div>
    `;
    
    if (settings.show_item_notes && item.notes) {
      html += `<div class="note">Note: ${item.notes}</div>`;
    }
  });
  
  html += '<div class="separator"></div>';
  
  // Totals
  const subtotal = order.subtotal || 0;
  const tax = order.tax || 0;
  const total = order.total || 0;
  const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
  
  html += `
    <div class="total-row">
      <span>Sub Total</span>
      <span>${totalItems}</span>
      <span>-</span>
      <span>${subtotal.toFixed(2)}</span>
    </div>
  `;
  
  if (tax > 0) {
    const taxPercent = subtotal > 0 ? ((tax / subtotal) * 100).toFixed(1) : '5.0';
    html += `
      <div class="total-row small">
        <span>Tax (${taxPercent}%)</span>
        <span></span>
        <span></span>
        <span>${tax.toFixed(2)}</span>
      </div>
    `;
  }
  
  html += '<div class="double-line"></div>';
  
  // Grand Total
  html += `
    <div class="total-row grand-total">
      <span>TOTAL DUE</span>
      <span>${total.toFixed(2)}</span>
    </div>
  `;
  
  // Payment details
  const paymentReceived = order.payment_received || 0;
  const balanceAmount = order.balance_amount || 0;
  const isCredit = order.is_credit || false;
  const cashAmount = order.cash_amount || 0;
  const cardAmount = order.card_amount || 0;
  const upiAmount = order.upi_amount || 0;
  const creditAmount = order.credit_amount || 0;
  
  const isSplitPayment = order.payment_method === 'split' || 
    (cashAmount > 0 && (cardAmount > 0 || upiAmount > 0 || creditAmount > 0)) ||
    (cardAmount > 0 && (upiAmount > 0 || creditAmount > 0)) ||
    (upiAmount > 0 && creditAmount > 0);
  
  if (isSplitPayment) {
    html += '<div class="separator"></div>';
    html += '<div class="center bold small mb-1">PAYMENT DETAILS</div>';
    
    if (cashAmount > 0) {
      html += `<div class="total-row small"><span>Cash</span><span>${cashAmount.toFixed(2)}</span></div>`;
    }
    if (cardAmount > 0) {
      html += `<div class="total-row small"><span>Card</span><span>${cardAmount.toFixed(2)}</span></div>`;
    }
    if (upiAmount > 0) {
      html += `<div class="total-row small"><span>UPI</span><span>${upiAmount.toFixed(2)}</span></div>`;
    }
    if (creditAmount > 0) {
      html += `<div class="total-row small"><span>Credit (Due)</span><span>${creditAmount.toFixed(2)}</span></div>`;
    }
  } else if (isCredit || balanceAmount > 0) {
    html += '<div class="separator"></div>';
    html += `
      <div class="total-row">
        <span>Received</span>
        <span>${paymentReceived.toFixed(2)}</span>
      </div>
      <div class="total-row bold">
        <span>BALANCE DUE</span>
        <span>${balanceAmount.toFixed(2)}</span>
      </div>
    `;
  }
  
  // Payment method
  if (order.payment_method && !isSplitPayment) {
    const methodDisplay = {
      'cash': 'CASH',
      'card': 'CARD',
      'upi': 'UPI',
      'credit': 'CREDIT'
    }[order.payment_method] || order.payment_method.toUpperCase();
    html += `<div class="center small mt-1">Payment: ${methodDisplay}</div>`;
  }
  
  // UPI QR Code for balance payment
  const balanceForQR = isSplitPayment ? creditAmount : balanceAmount;
  if (upiId && balanceForQR > 0 && settings.qr_code_enabled) {
    const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${balanceForQR.toFixed(2)}&cu=INR`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}`;
    
    html += `
      <div class="separator"></div>
      <div class="center bold small">Scan to Pay</div>
      <div class="center mb-1">
        <img src="${qrApiUrl}" alt="UPI QR" style="width: 100px; height: 100px;" onerror="this.style.display='none'" />
      </div>
      <div class="center xsmall">UPI: ${upiId}</div>
    `;
  }
  
  html += '<div class="double-line"></div>';
  
  // Footer
  html += `
    <div class="footer center">
      <div class="bold">${footerMsg}</div>
      <div class="xsmall mt-1">Software Developed by BillByteKOT</div>
      <div class="xsmall">(billbytekot.in)</div>
    </div>
  `;
  
  return html;
};


// Generate KOT HTML for thermal printer
export const generateKOTHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const business = businessOverride || getBusinessSettings();
  
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // KOT Header
  html += `
    <div class="center xlarge bold">*** KOT ***</div>
    <div class="center large">KITCHEN ORDER TICKET</div>
    <div class="double-line"></div>
  `;
  
  // Order Info
  html += `
    <div class="bill-info">
      <span class="bold">Order #${billNo}</span>
      <span class="bold">Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}</span>
    </div>
    <div class="bill-info">
      <span>Captain: ${order.waiter_name || 'Self'}</span>
    </div>
  `;
  
  if (settings.kot_show_time) {
    const date = new Date(order.created_at || Date.now());
    html += `<div class="bill-info"><span>Time: ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>`;
  }
  
  if (order.customer_name) {
    html += `<div class="bill-info"><span>Customer: ${order.customer_name}</span></div>`;
  }
  
  html += '<div class="double-line"></div>';
  html += '<div class="center large bold mb-2">ITEMS TO PREPARE</div>';
  html += '<div class="separator"></div>';
  
  // Items - Large and clear for kitchen
  (order.items || []).forEach(item => {
    html += `
      <div class="kot-item">
        ${item.quantity} × ${item.name.toUpperCase()}
      </div>
    `;
    
    if (settings.kot_highlight_notes && item.notes) {
      html += `<div class="kot-note">*** ${item.notes.toUpperCase()} ***</div>`;
    }
  });
  
  html += '<div class="separator"></div>';
  
  // Total items count
  const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
  html += `
    <div class="center large bold mt-2">
      TOTAL ITEMS: ${totalItems}
    </div>
  `;
  
  html += '<div class="double-line"></div>';
  
  // Priority indicator
  html += `
    <div class="center bold">
      ${order.priority === 'high' ? '*** HIGH PRIORITY ***' : 'NORMAL PRIORITY'}
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
                '-'.repeat(width);
    
    const doubleSep = '='.repeat(width);
    
    const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
    const centeredName = restaurantName.length <= width ? 
      restaurantName.padStart((width + restaurantName.length) / 2).padEnd(width) : 
      restaurantName.substring(0, width);

    const billNo = getBillNumber(order);
    
    let receipt = '';
    
    receipt += doubleSep + '\n';
    receipt += centeredName + '\n';
    
    if (settings.show_tagline && businessSettings?.tagline) {
      const tagline = businessSettings.tagline;
      receipt += tagline.padStart((width + tagline.length) / 2).padEnd(width) + '\n';
    }
    
    receipt += doubleSep + '\n';
    
    if (settings.show_fssai && businessSettings?.fssai) {
      receipt += `FSSAI: ${businessSettings.fssai}\n`;
    }
    if (settings.show_address && businessSettings?.address) {
      receipt += businessSettings.address.substring(0, width) + '\n';
    }
    if (settings.show_phone && businessSettings?.phone) {
      receipt += `Contact: ${businessSettings.phone}\n`;
    }
    
    receipt += sep + '\n';
    receipt += 'BILL'.padStart((width + 4) / 2).padEnd(width) + '\n';
    receipt += sep + '\n';
    
    receipt += `Bill No: ${billNo}  Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}\n`;
    receipt += `Date: ${new Date(order.created_at || Date.now()).toLocaleDateString('en-IN')}\n`;
    receipt += `Time: ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
    
    if (settings.show_waiter_name && order.waiter_name) {
      receipt += `Captain: ${order.waiter_name}\n`;
    }
    if (settings.show_customer_name && order.customer_name) {
      receipt += `Customer: ${order.customer_name}\n`;
    }
    
    receipt += sep + '\n';
    receipt += 'Item            Qty    Rate     Amt\n';
    receipt += sep + '\n';
    
    (order.items || []).forEach(item => {
      const name = item.name.substring(0, 14).padEnd(14);
      const qty = item.quantity.toString().padStart(3);
      const rate = item.price.toFixed(2).padStart(8);
      const amt = (item.quantity * item.price).toFixed(2).padStart(8);
      receipt += `${name} ${qty} ${rate} ${amt}\n`;
      
      if (settings.show_item_notes && item.notes) {
        receipt += `   Note: ${item.notes}\n`;
      }
    });
    
    receipt += sep + '\n';
    
    const subtotal = order.subtotal || 0;
    const tax = order.tax || 0;
    const total = order.total || 0;
    const totalItems = (order.items || []).reduce((sum, i) => sum + i.quantity, 0);
    
    receipt += `Sub Total       ${totalItems.toString().padStart(3)}     -  ${subtotal.toFixed(2).padStart(8)}\n`;
    if (tax > 0) {
      receipt += `Tax (5%)                       ${tax.toFixed(2).padStart(8)}\n`;
    }
    receipt += doubleSep + '\n';
    receipt += `TOTAL DUE                      ${total.toFixed(2).padStart(8)}\n`;
    receipt += doubleSep + '\n';
    
    const footer = businessSettings?.footer_message || 'Thank you! Visit Again...';
    receipt += '\n' + footer.padStart((width + footer.length) / 2).padEnd(width) + '\n';
    receipt += 'Software by BillByteKOT\n'.padStart((width + 22) / 2).padEnd(width);
    
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
    
    const billNo = getBillNumber(order);
    
    let kot = '';
    
    kot += sep + '\n';
    kot += '*** KOT ***'.padStart((width + 11) / 2).padEnd(width) + '\n';
    kot += 'KITCHEN ORDER TICKET'.padStart((width + 20) / 2).padEnd(width) + '\n';
    kot += sep + '\n\n';
    
    kot += `Order #: ${billNo}  Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}\n`;
    kot += `Captain: ${order.waiter_name || 'Self'}\n`;
    
    if (settings.kot_show_time) {
      kot += `Time: ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
    }
    
    kot += '\n' + dash + '\n';
    kot += 'ITEMS TO PREPARE:\n';
    kot += dash + '\n\n';
    
    (order.items || []).forEach((item, idx) => {
      kot += `${item.quantity} x ${item.name.toUpperCase()}\n`;
      
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
export const printDocument = (content, title = 'Print') => {
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
            font-size: ${paperWidth === '58mm' ? '11px' : '13px'};
            font-weight: 600;
            line-height: 1.4;
            width: ${width};
            margin: 0 auto;
            padding: 3mm;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>${content}</body>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
            setTimeout(function() { window.close(); }, 300);
          }, 100);
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
export const printWithCopies = (content, title = 'Print') => {
  try {
    const settings = getPrintSettings();
    const copies = settings.print_copies || 1;
    
    for (let i = 0; i < copies; i++) {
      setTimeout(() => {
        printDocument(content, `${title} (Copy ${i + 1}/${copies})`);
      }, i * 1500);
    }
    
    if (copies > 1) {
      toast.success(`Printing ${copies} copies...`);
    }
    
    return true;
  } catch (error) {
    console.error('Error printing multiple copies:', error);
    return printDocument(content, title);
  }
};

// Silent print function - attempts to print without dialog (for supported browsers/apps)
export const silentPrint = (htmlContent, paperWidth = '80mm') => {
  // For Electron/Desktop apps, this can be enhanced to use native printing
  // For web, we use the standard print approach
  return printThermal(htmlContent, paperWidth);
};
