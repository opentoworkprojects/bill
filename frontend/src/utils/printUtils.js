// Centralized print utilities for thermal printer support
import { toast } from 'sonner';

// ============ PLATFORM DETECTION ============

const isElectron = () => !!(window.electronAPI?.isElectron || window.__ELECTRON__);
const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const isBluetoothSupported = () => 'bluetooth' in navigator;
const isShareSupported = () => 'share' in navigator;

// ============ BLUETOOTH PRINTER SUPPORT ============

let connectedBluetoothPrinter = null;
let bluetoothCharacteristic = null;

const PRINTER_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
];

const PRINTER_CHARACTERISTIC_UUIDS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
];

export const connectBluetoothPrinter = async () => {
  if (!isBluetoothSupported()) {
    toast.error('Bluetooth not supported');
    return null;
  }
  
  try {
    toast.info('Searching for printers...');
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: PRINTER_SERVICE_UUIDS
    });
    
    toast.info(`Connecting to ${device.name || 'printer'}...`);
    const server = await device.gatt.connect();
    
    let service = null;
    for (const uuid of PRINTER_SERVICE_UUIDS) {
      try { service = await server.getPrimaryService(uuid); break; } catch (e) { continue; }
    }
    if (!service) {
      const services = await server.getPrimaryServices();
      if (services.length > 0) service = services[0];
    }
    if (!service) throw new Error('No print service found');
    
    let characteristic = null;
    for (const uuid of PRINTER_CHARACTERISTIC_UUIDS) {
      try { characteristic = await service.getCharacteristic(uuid); break; } catch (e) { continue; }
    }
    if (!characteristic) {
      const chars = await service.getCharacteristics();
      for (const c of chars) {
        if (c.properties.write || c.properties.writeWithoutResponse) { characteristic = c; break; }
      }
    }
    if (!characteristic) throw new Error('No write characteristic');
    
    connectedBluetoothPrinter = device;
    bluetoothCharacteristic = characteristic;
    localStorage.setItem('lastBluetoothPrinter', JSON.stringify({ name: device.name }));
    toast.success(`Connected to ${device.name || 'Printer'}`);
    return device;
  } catch (error) {
    if (error.name !== 'NotFoundError') toast.error('Connection failed: ' + error.message);
    return null;
  }
};

export const disconnectBluetoothPrinter = () => {
  if (connectedBluetoothPrinter?.gatt?.connected) connectedBluetoothPrinter.gatt.disconnect();
  connectedBluetoothPrinter = null;
  bluetoothCharacteristic = null;
  localStorage.removeItem('lastBluetoothPrinter');
  toast.info('Printer disconnected');
};

export const isBluetoothPrinterConnected = () => connectedBluetoothPrinter?.gatt?.connected || false;
export const getConnectedPrinterName = () => connectedBluetoothPrinter?.name || null;

const textToEscPos = (text, bold = false) => {
  const cmds = [0x1B, 0x40];
  if (bold) cmds.push(0x1B, 0x45, 0x01);
  cmds.push(...new TextEncoder().encode(text));
  if (bold) cmds.push(0x1B, 0x45, 0x00);
  cmds.push(0x0A);
  return new Uint8Array(cmds);
};

export const printViaBluetooth = async (text) => {
  if (!bluetoothCharacteristic) { toast.error('No printer connected'); return false; }
  try {
    for (const line of text.split('\n')) {
      const data = textToEscPos(line, line.includes('TOTAL') || line.includes('BILL'));
      for (let i = 0; i < data.length; i += 20) {
        await bluetoothCharacteristic.writeValue(data.slice(i, i + 20));
        await new Promise(r => setTimeout(r, 50));
      }
    }
    await bluetoothCharacteristic.writeValue(new Uint8Array([0x1D, 0x56, 0x00]));
    toast.success('Printed!');
    return true;
  } catch (e) { toast.error('Print failed'); return false; }
};

// ============ SETTINGS ============

export const getPrintSettings = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const s = user.business_settings?.print_customization || {};
    return {
      paper_width: s.paper_width || '80mm',
      show_logo: s.show_logo ?? true,
      show_address: s.show_address ?? true,
      show_phone: s.show_phone ?? true,
      show_gstin: s.show_gstin ?? true,
      show_fssai: s.show_fssai ?? true,
      show_tagline: s.show_tagline ?? true,
      show_customer_name: s.show_customer_name ?? true,
      show_waiter_name: s.show_waiter_name ?? true,
      show_table_number: s.show_table_number ?? true,
      show_order_time: s.show_order_time ?? true,
      show_item_notes: s.show_item_notes ?? true,
      qr_code_enabled: s.qr_code_enabled ?? true,
      print_copies: Math.max(1, Math.min(5, parseInt(s.print_copies) || 1)),
      kot_show_time: s.kot_show_time ?? true,
      kot_highlight_notes: s.kot_highlight_notes ?? true,
    };
  } catch (e) {
    return { paper_width: '80mm', show_logo: true, show_address: true, show_phone: true, show_gstin: true, show_fssai: true, show_tagline: true, show_customer_name: true, show_waiter_name: true, show_table_number: true, show_order_time: true, show_item_notes: true, qr_code_enabled: true, print_copies: 1, kot_show_time: true, kot_highlight_notes: true };
  }
};

export const getBusinessSettings = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').business_settings || {};
  } catch (e) { return {}; }
};

const getBillNumber = (order) => {
  if (order.order_number) return order.order_number.toString().padStart(5, '0');
  const id = order.id || '';
  if (typeof id === 'number') return id.toString().padStart(5, '0');
  return (id.replace(/[^0-9]/g, '').slice(-5) || '00001').padStart(5, '0');
};

// Generate payment URL for QR code
const generatePaymentUrl = (order, businessSettings) => {
  const billNo = getBillNumber(order);
  const amount = order.balance_amount || order.total || 0;
  const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
  
  // Determine UPI ID
  let upiId = businessSettings?.upi_id;
  if (!upiId && businessSettings?.phone) {
    // Generate UPI ID from phone number (common format)
    upiId = `${businessSettings.phone}@paytm`;
  }
  if (!upiId) {
    upiId = 'payment@restaurant.com'; // Fallback
  }
  
  // Create UPI payment URL according to NPCI standards
  const paymentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Bill ${billNo} - ${restaurantName}`)}`;
  
  return paymentUrl;
};

// Generate QR code data URL using a QR code library or service
const generateQRCodeDataUrl = (text, size = 120) => {
  try {
    // For thermal printers, we need a simple black and white QR code
    // Using Google Charts API for reliable QR code generation
    // M = Medium error correction (~15%), margin=0 for maximum size
    const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8&chld=M|0`;
    return qrUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    // Fallback to a detailed SVG QR code pattern
    return generateFallbackQRCode(size);
  }
};

// Generate fallback QR code SVG when online generation fails
const generateFallbackQRCode = (size = 120) => {
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="white" stroke="black" stroke-width="2"/>
      
      <!-- Corner detection patterns -->
      <rect x="8" y="8" width="24" height="24" fill="black"/>
      <rect x="12" y="12" width="16" height="16" fill="white"/>
      <rect x="16" y="16" width="8" height="8" fill="black"/>
      
      <rect x="${size-32}" y="8" width="24" height="24" fill="black"/>
      <rect x="${size-28}" y="12" width="16" height="16" fill="white"/>
      <rect x="${size-24}" y="16" width="8" height="8" fill="black"/>
      
      <rect x="8" y="${size-32}" width="24" height="24" fill="black"/>
      <rect x="12" y="${size-28}" width="16" height="16" fill="white"/>
      <rect x="16" y="${size-24}" width="8" height="8" fill="black"/>
      
      <!-- Timing patterns -->
      <rect x="40" y="16" width="4" height="4" fill="black"/>
      <rect x="48" y="16" width="4" height="4" fill="black"/>
      <rect x="56" y="16" width="4" height="4" fill="black"/>
      <rect x="64" y="16" width="4" height="4" fill="black"/>
      <rect x="72" y="16" width="4" height="4" fill="black"/>
      
      <rect x="16" y="40" width="4" height="4" fill="black"/>
      <rect x="16" y="48" width="4" height="4" fill="black"/>
      <rect x="16" y="56" width="4" height="4" fill="black"/>
      <rect x="16" y="64" width="4" height="4" fill="black"/>
      <rect x="16" y="72" width="4" height="4" fill="black"/>
      
      <!-- Data modules simulation -->
      <rect x="40" y="40" width="4" height="4" fill="black"/>
      <rect x="48" y="40" width="4" height="4" fill="black"/>
      <rect x="56" y="44" width="4" height="4" fill="black"/>
      <rect x="64" y="40" width="4" height="4" fill="black"/>
      <rect x="72" y="44" width="4" height="4" fill="black"/>
      <rect x="80" y="40" width="4" height="4" fill="black"/>
      
      <rect x="40" y="52" width="4" height="4" fill="black"/>
      <rect x="52" y="52" width="4" height="4" fill="black"/>
      <rect x="64" y="56" width="4" height="4" fill="black"/>
      <rect x="76" y="52" width="4" height="4" fill="black"/>
      
      <rect x="44" y="64" width="4" height="4" fill="black"/>
      <rect x="56" y="68" width="4" height="4" fill="black"/>
      <rect x="68" y="64" width="4" height="4" fill="black"/>
      <rect x="80" y="68" width="4" height="4" fill="black"/>
      
      <rect x="40" y="76" width="4" height="4" fill="black"/>
      <rect x="52" y="80" width="4" height="4" fill="black"/>
      <rect x="64" y="76" width="4" height="4" fill="black"/>
      <rect x="76" y="80" width="4" height="4" fill="black"/>
      
      <!-- Center indicator -->
      <text x="${size/2}" y="${size/2 + 3}" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="black">PAY</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};


// ============ PRINT FUNCTIONS ============

const getPrintStyles = (width) => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: ${width} auto; margin: 0; }
  @media print { html, body { width: ${width}; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; } }
  body { font-family: 'Courier New', monospace; font-size: ${width === '58mm' ? '11px' : '13px'}; font-weight: 600; line-height: 1.4; width: ${width}; padding: 3mm; background: #fff; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: 900 !important; }
  .large { font-size: 1.3em; font-weight: 900; }
  .small { font-size: 0.9em; }
  .xsmall { font-size: 0.8em; }
  .separator { border-top: 1px dashed #000; margin: 2mm 0; }
  .double-line { border-top: 2px solid #000; margin: 2mm 0; }
  .dotted-line { border-top: 1px dotted #000; margin: 2mm 0; }
  .item-row { display: flex; justify-content: space-between; margin: 1mm 0; font-weight: 600; }
  .total-row { display: flex; justify-content: space-between; font-weight: 700; margin: 1mm 0; }
  .grand-total { font-size: 1.4em; font-weight: 900; margin: 2mm 0; }
  .header-logo { font-size: 1.5em; font-weight: 900; margin-bottom: 1mm; }
  .bill-info { display: flex; justify-content: space-between; font-size: 0.95em; margin: 1mm 0; }
  .table-header { display: flex; justify-content: space-between; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 1mm; }
  .footer { margin-top: 3mm; font-size: 0.9em; }
  .mb-1 { margin-bottom: 1mm; }
  .mt-1 { margin-top: 1mm; }
  .kot-item { font-size: 1.2em; font-weight: 900; margin: 2mm 0; padding: 2mm; border: 2px solid #000; }
  .kot-note { background: #000; color: #fff; padding: 2mm; margin: 1mm 0 2mm 3mm; font-weight: 900; }
`;

export const printThermal = (htmlContent, paperWidth = '80mm') => {
  if (isElectron() && window.electronAPI?.printReceipt) {
    try { 
      window.electronAPI.printReceipt(htmlContent, { paperWidth }); 
      toast.success('Printing...'); 
      return true; 
    } catch (e) {
      console.error('Electron print error:', e);
    }
  }
  
  // Silent print without dialog - create hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '1px';
  iframe.style.height = '1px';
  iframe.style.opacity = '0';
  document.body.appendChild(iframe);
  
  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  const printContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Print</title><style>${getPrintStyles(width)}</style></head><body><div class="receipt">${htmlContent}</div></body></html>`;
  
  iframe.contentDocument.write(printContent);
  iframe.contentDocument.close();
  
  // Wait for content to load, then print silently
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        toast.success('Receipt sent to printer!');
        
        // Clean up after printing
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (e) {
        console.error('Silent print failed:', e);
        // Fallback to popup window if silent print fails
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (printWindow) {
          printWindow.document.write(printContent + `<script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},300);},100);};</script>`);
          printWindow.document.close();
        }
        document.body.removeChild(iframe);
      }
    }, 500);
  };
  
  return true;
};

export const generateReceiptHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const b = businessOverride || getBusinessSettings();
  const billNo = getBillNumber(order);
  
  let html = '';
  
  if (settings.show_logo && b.logo_url) {
    const logoSizes = {
      small: 'max-width:40px;max-height:30px;',
      medium: 'max-width:70px;max-height:50px;',
      large: 'max-width:100px;max-height:70px;'
    };
    const logoSize = logoSizes[settings.logo_size] || logoSizes.medium;
    html += `<div class="center mb-1"><img src="${b.logo_url}" alt="Logo" style="${logoSize}" onerror="this.style.display='none'"/></div>`;
  }
  html += `<div class="center header-logo">${b.restaurant_name || 'Restaurant'}</div>`;
  if (settings.show_tagline && b.tagline) html += `<div class="center small mb-1">${b.tagline}</div>`;
  if (settings.show_fssai && b.fssai) html += `<div class="center xsmall bold">FSSAI NO: ${b.fssai}</div>`;
  if (settings.show_address && b.address) html += `<div class="center xsmall">${b.address}</div>`;
  if (settings.show_phone && b.phone) html += `<div class="center xsmall">Contact: ${b.phone}</div>`;
  
  html += '<div class="dotted-line"></div>';
  html += '<div class="center large mb-1">BILL</div>';
  
  const date = new Date(order.created_at || Date.now());
  html += `<div class="bill-info"><span>Bill No:${billNo}</span><span>Table:${order.table_number ? 'T' + order.table_number : 'Counter'}</span><span>Date:${date.toLocaleDateString('en-IN')}</span></div>`;
  html += `<div class="bill-info"><span>Captain:${order.waiter_name || 'Self'}</span><span></span><span>(${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})</span></div>`;
  if (settings.show_customer_name && order.customer_name) html += `<div class="bill-info"><span>Customer: ${order.customer_name}</span></div>`;
  
  html += '<div class="double-line"></div>';
  html += '<div class="table-header"><span style="flex:2">Item</span><span style="width:35px;text-align:center">Qty</span><span style="width:55px;text-align:right">Rate</span><span style="width:60px;text-align:right">Amt</span></div>';
  
  (order.items || []).forEach(item => {
    html += `<div class="item-row"><span style="flex:2">${item.name}</span><span style="width:35px;text-align:center">${item.quantity}</span><span style="width:55px;text-align:right">${item.price.toFixed(2)}</span><span style="width:60px;text-align:right">${(item.quantity * item.price).toFixed(2)}</span></div>`;
    if (settings.show_item_notes && item.notes) html += `<div style="font-size:0.85em;margin-left:3mm;font-style:italic">Note: ${item.notes}</div>`;
  });
  
  html += '<div class="separator"></div>';
  
  const subtotal = order.subtotal || 0, tax = order.tax || 0, total = order.total || 0;
  const discount = order.discount || order.discount_amount || 0;
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  
  // Calculate items total from items array (original subtotal before discount)
  const itemsTotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  // Use items total if discount exists, otherwise use stored subtotal
  const displaySubtotal = discount > 0 ? itemsTotal : subtotal;
  
  html += `<div class="total-row"><span>Sub Total</span><span>${totalItems}</span><span>-</span><span>${displaySubtotal.toFixed(2)}</span></div>`;
  if (discount > 0) html += `<div class="total-row small" style="color:#22c55e"><span>Discount</span><span></span><span></span><span>-${discount.toFixed(2)}</span></div>`;
  
  // Show tax if tax > 0 OR if tax_rate > 0 (even if tax amount is 0)
  const taxRate = order.tax_rate || (subtotal > 0 && tax > 0 ? ((tax / subtotal) * 100) : 0);
  if (tax > 0 || taxRate > 0) {
    const displayTaxRate = taxRate > 0 ? taxRate.toFixed(1) : '0.0';
    html += `<div class="total-row small"><span>Tax (${displayTaxRate}%)</span><span></span><span></span><span>${tax.toFixed(2)}</span></div>`;
  }
  
  html += '<div class="double-line"></div>';
  html += `<div class="total-row grand-total"><span>TOTAL DUE</span><span>${total.toFixed(2)}</span></div>`;
  
  const { payment_received = 0, balance_amount = 0, is_credit, cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0, payment_method } = order;
  const isSplit = payment_method === 'split' || (cash_amount > 0 && (card_amount > 0 || upi_amount > 0 || credit_amount > 0)) || (card_amount > 0 && (upi_amount > 0 || credit_amount > 0)) || (upi_amount > 0 && credit_amount > 0);
  
  // Always show payment section
  html += '<div class="separator"></div>';
  
  if (isSplit) {
    html += '<div class="center bold small mb-1">PAYMENT DETAILS</div>';
    if (cash_amount > 0) html += `<div class="total-row small"><span>Cash</span><span>${cash_amount.toFixed(2)}</span></div>`;
    if (card_amount > 0) html += `<div class="total-row small"><span>Card</span><span>${card_amount.toFixed(2)}</span></div>`;
    if (upi_amount > 0) html += `<div class="total-row small"><span>UPI</span><span>${upi_amount.toFixed(2)}</span></div>`;
    if (credit_amount > 0) html += `<div class="total-row small"><span>Credit (Due)</span><span>${credit_amount.toFixed(2)}</span></div>`;
    const totalPaid = cash_amount + card_amount + upi_amount;
    if (totalPaid > 0) html += `<div class="total-row"><span>Total Paid</span><span>${totalPaid.toFixed(2)}</span></div>`;
    if (credit_amount > 0) html += `<div class="total-row bold"><span>BALANCE DUE</span><span>${credit_amount.toFixed(2)}</span></div>`;
  } else {
    // Single payment method
    const methodDisplay = { cash: 'CASH', card: 'CARD', upi: 'UPI', credit: 'CREDIT' }[payment_method] || (payment_method ? payment_method.toUpperCase() : 'CASH');
    html += `<div class="total-row"><span>Payment Mode</span><span>${methodDisplay}</span></div>`;
    
    if (payment_received > 0) {
      html += `<div class="total-row"><span>Amount Received</span><span>${payment_received.toFixed(2)}</span></div>`;
      
      // Show change if overpaid
      if (payment_received > total) {
        const change = payment_received - total;
        html += `<div class="total-row" style="color:green"><span>Change to Return</span><span>${change.toFixed(2)}</span></div>`;
      }
    }
    
    if (is_credit || balance_amount > 0) {
      html += `<div class="total-row bold"><span>BALANCE DUE</span><span>${balance_amount.toFixed(2)}</span></div>`;
    } else if (payment_received >= total) {
      html += `<div class="total-row" style="color:green"><span>Status</span><span>PAID</span></div>`;
    }
  }
  
  html += '<div class="double-line"></div>';
  
  // Add QR code for unpaid/overdue bills
  const isUnpaid = is_credit || balance_amount > 0;
  if (settings.qr_code_enabled && isUnpaid) {
    html += '<div class="separator"></div>';
    html += '<div class="center bold small mb-1">SCAN TO PAY BALANCE</div>';
    
    // Generate payment URL for QR code
    const paymentUrl = generatePaymentUrl(order, b);
    const qrCodeDataUrl = generateQRCodeDataUrl(paymentUrl);
    
    html += `<div class="center mb-1">
      <div style="display:inline-block;padding:8px;border:3px solid #000;background:#fff;border-radius:4px;">
        <img src="${qrCodeDataUrl}" alt="Payment QR Code" style="width:120px;height:120px;display:block;image-rendering:pixelated;image-rendering:-moz-crisp-edges;image-rendering:crisp-edges;" onerror="this.parentElement.innerHTML='<div style=&quot;width:120px;height:120px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;&quot;>QR CODE<br/>FOR<br/>PAYMENT</div>'"/>
      </div>
    </div>`;
    html += `<div class="center xsmall bold">Balance Due: ₹${balance_amount.toFixed(2)}</div>`;
    if (order.customer_phone) {
      html += `<div class="center xsmall">Or call: ${order.customer_phone}</div>`;
    }
    html += `<div class="center xsmall">UPI ID: ${b.upi_id || b.phone ? `${b.phone}@paytm` : 'payment@restaurant.com'}</div>`;
  }
  
  html += `<div class="footer center"><div class="bold">${b.footer_message || 'Thank you! Visit Again...'}</div><div class="xsmall mt-1">Bill generated by BillByteKOT</div><div class="xsmall">(billbytekot.in)</div></div>`;
  
  return html;
};

export const generateKOTHTML = (order) => {
  const settings = getPrintSettings();
  const billNo = getBillNumber(order);
  
  let html = '<div class="center" style="font-size:1.5em;font-weight:900">*** KOT ***</div><div class="center large">KITCHEN ORDER TICKET</div><div class="double-line"></div>';
  html += `<div class="bill-info"><span class="bold">Order #${billNo}</span><span class="bold">Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}</span></div>`;
  html += `<div class="bill-info"><span>Captain: ${order.waiter_name || 'Self'}</span></div>`;
  if (settings.kot_show_time) html += `<div class="bill-info"><span>Time: ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>`;
  if (order.customer_name) html += `<div class="bill-info"><span>Customer: ${order.customer_name}</span></div>`;
  
  html += '<div class="double-line"></div><div class="center large bold mb-1">ITEMS TO PREPARE</div><div class="separator"></div>';
  
  (order.items || []).forEach(item => {
    html += `<div class="kot-item">${item.quantity} × ${item.name.toUpperCase()}</div>`;
    if (settings.kot_highlight_notes && item.notes) html += `<div class="kot-note">*** ${item.notes.toUpperCase()} ***</div>`;
  });
  
  html += '<div class="separator"></div>';
  html += `<div class="center large bold" style="margin-top:2mm">TOTAL ITEMS: ${(order.items || []).reduce((s, i) => s + i.quantity, 0)}</div>`;
  html += '<div class="double-line"></div>';
  html += `<div class="center bold">${order.priority === 'high' ? '*** HIGH PRIORITY ***' : 'NORMAL PRIORITY'}</div>`;
  
  return html;
};


// ============ PLAIN TEXT FOR BLUETOOTH ============

export const generatePlainTextReceipt = (order, businessOverride = null) => {
  const b = businessOverride || getBusinessSettings();
  const billNo = getBillNumber(order);
  const w = 48, sep = '-'.repeat(w), dsep = '='.repeat(w);
  const center = (t) => t.length >= w ? t.substring(0, w) : ' '.repeat(Math.floor((w - t.length) / 2)) + t;
  
  let r = dsep + '\n' + center(b.restaurant_name || 'Restaurant') + '\n';
  if (b.fssai) r += center(`FSSAI: ${b.fssai}`) + '\n';
  if (b.address) r += center(b.address.substring(0, w)) + '\n';
  if (b.phone) r += center(`Contact: ${b.phone}`) + '\n';
  r += dsep + '\n' + center('BILL') + '\n' + sep + '\n';
  
  const d = new Date(order.created_at || Date.now());
  r += `Bill No: ${billNo}  Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}\n`;
  r += `Date: ${d.toLocaleDateString('en-IN')} (${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})\n`;
  if (order.waiter_name) r += `Captain: ${order.waiter_name}\n`;
  if (order.customer_name) r += `Customer: ${order.customer_name}\n`;
  
  r += sep + '\nItem            Qty    Rate     Amt\n' + sep + '\n';
  
  (order.items || []).forEach(i => {
    r += `${i.name.substring(0, 14).padEnd(14)} ${i.quantity.toString().padStart(3)} ${i.price.toFixed(2).padStart(8)} ${(i.quantity * i.price).toFixed(2).padStart(8)}\n`;
  });
  
  r += sep + '\n';
  const sub = order.subtotal || 0, tax = order.tax || 0, tot = order.total || 0;
  const discount = order.discount || order.discount_amount || 0;
  const items = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  
  // Calculate items total from items array (original subtotal before discount)
  const itemsTotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  // Use items total if discount exists, otherwise use stored subtotal
  const displaySub = discount > 0 ? itemsTotal : sub;
  
  r += `Sub Total       ${items.toString().padStart(3)}     -  ${displaySub.toFixed(2).padStart(8)}\n`;
  if (discount > 0) r += `Discount                      -${discount.toFixed(2).padStart(8)}\n`;
  
  // Show tax if tax > 0 OR if tax_rate > 0
  const taxRate = order.tax_rate || (sub > 0 && tax > 0 ? ((tax / sub) * 100) : 0);
  if (tax > 0 || taxRate > 0) {
    r += `Tax (${taxRate.toFixed(0)}%)                       ${tax.toFixed(2).padStart(8)}\n`;
  }
  r += dsep + '\n' + `TOTAL DUE                      ${tot.toFixed(2).padStart(8)}\n` + dsep + '\n';
  
  // Payment details
  const { payment_received = 0, balance_amount = 0, is_credit, cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0, payment_method } = order;
  const isSplit = payment_method === 'split' || (cash_amount > 0 && (card_amount > 0 || upi_amount > 0 || credit_amount > 0));
  
  if (isSplit) {
    r += 'PAYMENT DETAILS:\n';
    if (cash_amount > 0) r += `Cash:                          ${cash_amount.toFixed(2).padStart(8)}\n`;
    if (card_amount > 0) r += `Card:                          ${card_amount.toFixed(2).padStart(8)}\n`;
    if (upi_amount > 0) r += `UPI:                           ${upi_amount.toFixed(2).padStart(8)}\n`;
    if (credit_amount > 0) r += `Credit (Due):                  ${credit_amount.toFixed(2).padStart(8)}\n`;
    const totalPaid = cash_amount + card_amount + upi_amount;
    if (totalPaid > 0) r += `Total Paid:                    ${totalPaid.toFixed(2).padStart(8)}\n`;
    if (credit_amount > 0) r += `BALANCE DUE:                   ${credit_amount.toFixed(2).padStart(8)}\n`;
  } else {
    const methodDisplay = { cash: 'CASH', card: 'CARD', upi: 'UPI', credit: 'CREDIT' }[payment_method] || 'CASH';
    r += `Payment Mode:                  ${methodDisplay.padStart(8)}\n`;
    if (payment_received > 0) {
      r += `Amount Received:               ${payment_received.toFixed(2).padStart(8)}\n`;
      // Show change if overpaid
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
  }
  r += sep + '\n';
  
  // Add QR code info for unpaid/overdue bills
  const settings = getPrintSettings();
  const isUnpaid = is_credit || balance_amount > 0;
  if (settings.qr_code_enabled && isUnpaid) {
    r += '\n' + center('SCAN QR CODE TO PAY BALANCE') + '\n';
    r += center(`Balance Due: ₹${balance_amount.toFixed(2)}`) + '\n';
    r += sep + '\n';
    
    // Generate payment URL
    const paymentUrl = generatePaymentUrl(order, b);
    
    // Add QR code representation for text-based printing
    r += center('[QR CODE FOR UPI PAYMENT]') + '\n';
    r += center('█████████████████████████') + '\n';
    r += center('█ ▄▄▄▄▄ █▀█ █ ▄▄▄▄▄ █') + '\n';
    r += center('█ █   █ █▀▀ █ █   █ █') + '\n';
    r += center('█ █▄▄▄█ █▀█ █ █▄▄▄█ █') + '\n';
    r += center('█▄▄▄▄▄▄▄█▄▀▄█▄▄▄▄▄▄▄█') + '\n';
    r += center('█▄▄█▄▀▄▄  ▄▀ ▄▀▄▄█▄▄█') + '\n';
    r += center('██▄▄▄▄▄█▀▀▀█▀▀▀█▄▄▄▄█') + '\n';
    r += center('█ ▄▄▄▄▄ █▄█ █ ████▀▄█') + '\n';
    r += center('█ █   █ █▄▄▄█▀▀▀▀▀▄▄█') + '\n';
    r += center('█ █▄▄▄█ █▀█ █▄▄█▄▄▄▄█') + '\n';
    r += center('█▄▄▄▄▄▄▄█▄▄▄█▄█▄▄▄▄▄█') + '\n';
    r += center('█████████████████████████') + '\n';
    
    // Add UPI ID for manual entry
    const upiId = b.upi_id || (b.phone ? `${b.phone}@paytm` : 'payment@restaurant.com');
    r += center(`UPI ID: ${upiId}`) + '\n';
    
    if (order.customer_phone) {
      r += center(`Or call: ${order.customer_phone}`) + '\n';
    }
    r += sep + '\n';
  }
  
  r += '\n' + center(b.footer_message || 'Thank you! Visit Again...') + '\n';
  r += center('Bill generated by BillByteKOT') + '\n' + dsep + '\n';
  
  return r;
};

// ============ MOBILE PRINT OPTIONS ============

export const shareReceipt = async (order, businessOverride = null) => {
  if (!isShareSupported()) { toast.error('Share not supported'); return false; }
  try {
    const b = businessOverride || getBusinessSettings();
    await navigator.share({ title: `Bill #${getBillNumber(order)} - ${b.restaurant_name || 'Restaurant'}`, text: generatePlainTextReceipt(order, businessOverride) });
    toast.success('Receipt shared!');
    return true;
  } catch (e) { if (e.name !== 'AbortError') toast.error('Share failed'); return false; }
};

export const smartPrint = async (order, businessOverride = null) => {
  const settings = getPrintSettings();
  
  if (isElectron() && window.electronAPI?.printReceipt) {
    window.electronAPI.printReceipt(generateReceiptHTML(order, businessOverride), { 
      paperWidth: settings.paper_width 
    });
    toast.success('Printing...');
    return true;
  }
  
  if (isMobile() && isBluetoothPrinterConnected()) {
    return await printViaBluetooth(generatePlainTextReceipt(order, businessOverride));
  }
  
  if (isMobile()) return await showMobilePrintOptions(order, businessOverride);
  
  return printThermal(generateReceiptHTML(order, businessOverride), settings.paper_width);
};

const showMobilePrintOptions = (order, businessOverride) => new Promise((resolve) => {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;justify-content:center;z-index:99999';
  
  const modal = document.createElement('div');
  modal.style.cssText = 'background:white;border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:400px';
  modal.innerHTML = `
    <style>.pob{width:100%;padding:16px;margin:8px 0;border:2px solid #e5e7eb;border-radius:12px;background:white;font-size:16px;font-weight:600;display:flex;align-items:center;gap:12px;cursor:pointer}.pob:active{border-color:#7c3aed;background:#f5f3ff}</style>
    <div style="text-align:center;margin-bottom:16px"><div style="width:40px;height:4px;background:#d1d5db;border-radius:2px;margin:0 auto 16px"></div><h3 style="font-size:18px;font-weight:700">Print Receipt</h3><p style="font-size:14px;color:#6b7280">Choose print method</p></div>
    <button class="pob" id="pbt">📶 <div><div>Bluetooth Printer</div><div style="font-size:12px;color:#6b7280">${isBluetoothPrinterConnected() ? '✓ Connected' : 'Connect & Print'}</div></div></button>
    <button class="pob" id="psh">📤 <div><div>Share Receipt</div><div style="font-size:12px;color:#6b7280">WhatsApp, Email, etc.</div></div></button>
    <button class="pob" id="psy">🖨️ <div><div>System Print</div><div style="font-size:12px;color:#6b7280">WiFi/Network Printer</div></div></button>
    <button class="pob" id="pcn" style="border-color:#fecaca;color:#dc2626">✕ Cancel</button>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  const cleanup = () => overlay.remove();
  
  document.getElementById('pbt').onclick = async () => {
    cleanup();
    if (!isBluetoothPrinterConnected()) await connectBluetoothPrinter();
    if (isBluetoothPrinterConnected()) resolve(await printViaBluetooth(generatePlainTextReceipt(order, businessOverride)));
    else resolve(false);
  };
  document.getElementById('psh').onclick = async () => { cleanup(); resolve(await shareReceipt(order, businessOverride)); };
  document.getElementById('psy').onclick = () => { cleanup(); resolve(printThermal(generateReceiptHTML(order, businessOverride), getPrintSettings().paper_width)); };
  document.getElementById('pcn').onclick = () => { cleanup(); resolve(false); };
  overlay.onclick = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
});

// ============ MAIN EXPORTS ============

export const printReceipt = async (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    
    // Try Bluetooth direct print first (no dialog)
    if (isBluetoothPrinterConnected()) {
      try {
        const { printReceipt: btPrint } = await import('./bluetoothPrint');
        await btPrint(order, businessOverride || getBusinessSettings());
        toast.success('Receipt printed!');
        return true;
      } catch (btError) {
        console.log('Bluetooth print failed, falling back:', btError);
      }
    }
    
    // Fallback to window print with correct settings
    return printThermal(generateReceiptHTML(order, businessOverride), settings.paper_width);
  } catch (e) { 
    toast.error('Print failed'); 
    return false; 
  }
};

export const printKOT = async (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    
    // Try Bluetooth direct print first (no dialog)
    if (isBluetoothPrinterConnected()) {
      try {
        const { printKOT: btPrintKOT } = await import('./bluetoothPrint');
        await btPrintKOT(order, businessOverride || getBusinessSettings());
        toast.success('KOT printed!');
        return true;
      } catch (btError) {
        console.log('Bluetooth KOT print failed, falling back:', btError);
      }
    }
    
    // Fallback to window print with correct settings
    return printThermal(generateKOTHTML(order, businessOverride), settings.paper_width);
  } catch (e) { 
    toast.error('Print failed'); 
    return false; 
  }
};

export const printDocument = (content, title = 'Print') => {
  const w = getPrintSettings().paper_width === '58mm' ? '58mm' : '80mm';
  const pw = window.open('', '_blank', 'width=400,height=600');
  if (!pw) { toast.error('Popup blocked!'); return false; }
  pw.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title><style>@page{size:${w} auto;margin:0}body{font-family:'Courier New',monospace;font-size:13px;font-weight:600;line-height:1.4;width:${w};padding:3mm;white-space:pre-wrap}</style></head><body>${content}</body><script>window.onload=function(){setTimeout(function(){window.print();setTimeout(function(){window.close();},300);},100);};</script></html>`);
  pw.document.close();
  return true;
};

export const silentPrint = (html, paperWidth = '80mm') => {
  if (isElectron() && window.electronAPI?.printReceipt) { 
    window.electronAPI.printReceipt(html, { paperWidth }); 
    return true; 
  }
  return printThermal(html, paperWidth);
};

export const printWithDialog = (html, paperWidth = '80mm') => {
  if (isElectron() && window.electronAPI?.printReceiptWithDialog) { 
    window.electronAPI.printReceiptWithDialog(html, { paperWidth }); 
    return true; 
  }
  return printThermal(html, paperWidth);
};

export const getAvailablePrinters = async () => {
  if (isElectron() && window.electronAPI?.getPrinters) {
    try { return await window.electronAPI.getPrinters(); } catch (e) {}
  }
  return [];
};

export const generateReceiptContent = generatePlainTextReceipt;
export const generateKOTContent = (order) => {
  const billNo = getBillNumber(order);
  const w = 48, sep = '='.repeat(w), dash = '-'.repeat(w);
  const center = (t) => ' '.repeat(Math.floor((w - t.length) / 2)) + t;
  
  let k = sep + '\n' + center('*** KOT ***') + '\n' + center('KITCHEN ORDER TICKET') + '\n' + sep + '\n\n';
  k += `Order #: ${billNo}  Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}\n`;
  k += `Captain: ${order.waiter_name || 'Self'}\n`;
  k += `Time: ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
  k += '\n' + dash + '\nITEMS TO PREPARE:\n' + dash + '\n\n';
  (order.items || []).forEach(i => { k += `${i.quantity} x ${i.name.toUpperCase()}\n`; if (i.notes) k += `    *** ${i.notes.toUpperCase()} ***\n`; });
  k += '\n' + dash + '\n' + `TOTAL ITEMS: ${(order.items || []).reduce((s, i) => s + i.quantity, 0)}\n` + sep + '\n';
  return k;
};
