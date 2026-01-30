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

// ============ SETTINGS WITH CACHING ============

let cachedBusinessSettings = null;
let cachedPrintSettings = null;
let settingsLastFetched = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Invalidate cache when needed
export const invalidateSettingsCache = () => {
  cachedBusinessSettings = null;
  cachedPrintSettings = null;
  settingsLastFetched = null;
  console.log('🔄 Settings cache invalidated');
};

// Get cached or fresh business settings
export const getBusinessSettings = (forceRefresh = false) => {
  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (!forceRefresh && cachedBusinessSettings && settingsLastFetched && 
        (now - settingsLastFetched) < CACHE_DURATION) {
      return cachedBusinessSettings;
    }
    
    // Get from localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const businessSettings = user.business_settings || {};
    
    // Update cache
    cachedBusinessSettings = businessSettings;
    settingsLastFetched = now;
    
    return businessSettings;
  } catch (e) { 
    console.error('Error getting business settings:', e);
    return {}; 
  }
};

export const getPrintSettings = (forceRefresh = false) => {
  try {
    const now = Date.now();
    
    // Check if we have valid cached data
    if (!forceRefresh && cachedPrintSettings && settingsLastFetched && 
        (now - settingsLastFetched) < CACHE_DURATION) {
      return cachedPrintSettings;
    }
    
    const businessSettings = getBusinessSettings(forceRefresh);
    const s = businessSettings.print_customization || {};
    
    const printSettings = {
      paper_width: s.paper_width || '80mm',
      font_size: s.font_size || 'medium',
      print_theme: s.print_theme || 'default', // NEW: Print theme selection
      kot_theme: s.kot_theme || 'classic', // NEW: KOT theme selection
      show_logo: s.show_logo ?? true,
      logo_size: s.logo_size || 'medium',
      show_address: s.show_address ?? true,
      show_phone: s.show_phone ?? true,
      show_email: s.show_email ?? false,
      show_website: s.show_website ?? false,
      show_gstin: s.show_gstin ?? true,
      show_fssai: s.show_fssai ?? false,
      show_tagline: s.show_tagline ?? true,
      show_customer_name: s.show_customer_name ?? true,
      show_waiter_name: s.show_waiter_name ?? true,
      show_table_number: s.show_table_number ?? true,
      show_order_time: s.show_order_time ?? true,
      show_item_notes: s.show_item_notes ?? true,
      border_style: s.border_style || 'single',
      separator_style: s.separator_style || 'dashes',
      footer_style: s.footer_style || 'simple',
      qr_code_enabled: s.qr_code_enabled ?? true,
      auto_print: s.auto_print ?? false,
      print_copies: Math.max(1, Math.min(5, parseInt(s.print_copies) || 1)),
      kot_auto_print: s.kot_auto_print ?? true,
      kot_font_size: s.kot_font_size || 'large',
      kot_show_time: s.kot_show_time ?? true,
      kot_highlight_notes: s.kot_highlight_notes ?? true,
      header_style: s.header_style || 'centered'
    };
    
    // Update cache
    cachedPrintSettings = printSettings;
    settingsLastFetched = now;
    
    return printSettings;
  } catch (e) {
    console.error('Error getting print settings:', e);
    return { 
      paper_width: '80mm', 
      font_size: 'medium',
      print_theme: 'default', // NEW: Default theme
      kot_theme: 'classic', // NEW: Default KOT theme
      show_logo: true, 
      show_address: true, 
      show_phone: true, 
      show_gstin: true, 
      show_fssai: true, 
      show_tagline: true, 
      show_customer_name: true, 
      show_waiter_name: true, 
      show_table_number: true, 
      show_order_time: true, 
      show_item_notes: true, 
      qr_code_enabled: true, 
      auto_print: false,
      print_copies: 1, 
      kot_show_time: true, 
      kot_highlight_notes: true,
      border_style: 'single',
      separator_style: 'dashes',
      footer_style: 'simple',
      header_style: 'centered'
    };
  }
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
  
  // Enhanced UPI ID determination with multiple fallbacks
  let upiId = businessSettings?.upi_id;
  
  // If no UPI ID configured, try to generate from phone with multiple providers
  if (!upiId && businessSettings?.phone) {
    const phone = businessSettings.phone.replace(/[^0-9]/g, ''); // Clean phone number
    
    // Try common UPI providers in order of popularity
    const providers = ['paytm', 'phonepe', 'gpay', 'ybl', 'ibl'];
    const preferredProvider = businessSettings?.preferred_upi_provider || 'paytm';
    
    // Use preferred provider if specified, otherwise default to paytm
    upiId = `${phone}@${preferredProvider}`;
  }
  
  // Final fallback
  if (!upiId) {
    upiId = 'payment@restaurant.com';
  }
  
  // Create enhanced UPI payment URL with proper encoding
  const merchantCode = businessSettings?.merchant_code || 'REST';
  const transactionNote = `Bill-${billNo}-${restaurantName.substring(0, 20)}`;
  
  // Build UPI URL with all required parameters
  const paymentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}&mc=${encodeURIComponent(merchantCode)}&tr=${encodeURIComponent(billNo)}`;
  
  return paymentUrl;
};

// Generate QR code data URL using multiple methods with thermal printer optimization
const generateQRCodeDataUrl = (text, size = 100) => {
  try {
    // For thermal printers, optimize size based on paper width
    const optimizedSize = size <= 80 ? 80 : size <= 120 ? 100 : 120;
    
    // Method 1: Try Google Charts API (most reliable)
    // Use higher error correction (H = ~30%) for better scanning on thermal printers
    const googleQR = `https://chart.googleapis.com/chart?chs=${optimizedSize}x${optimizedSize}&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8&chld=H|2`;
    
    // Method 2: Try QR Server API as backup
    const qrServerAPI = `https://api.qrserver.com/v1/create-qr-code/?size=${optimizedSize}x${optimizedSize}&data=${encodeURIComponent(text)}&ecc=H&margin=1`;
    
    // Return primary method (Google Charts is most reliable)
    return googleQR;
  } catch (error) {
    console.error('QR code generation failed:', error);
    // Enhanced fallback with better UPI pattern
    return generateEnhancedFallbackQR(size, text);
  }
};

// Generate enhanced fallback QR code with UPI pattern recognition
const generateEnhancedFallbackQR = (size = 100, upiText = '') => {
  const isUPI = upiText.includes('upi://pay');
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="white" stroke="black" stroke-width="1"/>
      
      <!-- Enhanced corner detection patterns for better scanning -->
      <rect x="4" y="4" width="20" height="20" fill="black"/>
      <rect x="7" y="7" width="14" height="14" fill="white"/>
      <rect x="10" y="10" width="8" height="8" fill="black"/>
      
      <rect x="${size-24}" y="4" width="20" height="20" fill="black"/>
      <rect x="${size-21}" y="7" width="14" height="14" fill="white"/>
      <rect x="${size-18}" y="10" width="8" height="8" fill="black"/>
      
      <rect x="4" y="${size-24}" width="20" height="20" fill="black"/>
      <rect x="7" y="${size-21}" width="14" height="14" fill="white"/>
      <rect x="10" y="${size-18}" width="8" height="8" fill="black"/>
      
      <!-- Enhanced timing patterns -->
      ${Array.from({length: 8}, (_, i) => `<rect x="${28 + i*6}" y="10" width="3" height="3" fill="black"/>`).join('')}
      ${Array.from({length: 8}, (_, i) => `<rect x="10" y="${28 + i*6}" width="3" height="3" fill="black"/>`).join('')}
      
      <!-- Enhanced data pattern simulation -->
      ${Array.from({length: 6}, (_, row) => 
        Array.from({length: 6}, (_, col) => 
          `<rect x="${30 + col*8}" y="${30 + row*8}" width="3" height="3" fill="${(row + col) % 2 ? 'black' : 'white'}"/>`
        ).join('')
      ).join('')}
      
      <!-- UPI indicator if it's a UPI QR -->
      ${isUPI ? `
        <rect x="${size/2 - 15}" y="${size/2 - 8}" width="30" height="16" fill="white" stroke="black" stroke-width="1"/>
        <text x="${size/2}" y="${size/2 + 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="black">UPI</text>
      ` : `
        <text x="${size/2}" y="${size/2 + 2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="6" font-weight="bold" fill="black">PAY</text>
      `}
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};


// ============ PRINT FUNCTIONS ============

const getPrintStyles = (width, settings = null) => {
  const printSettings = settings || getPrintSettings();
  const isCompact = width === '58mm';
  const theme = printSettings.print_theme || 'default';
  
  // Theme-specific configurations
  if (theme === 'professional') {
    return getProfessionalThemeStyles(width, printSettings);
  }
  
  // Default theme (existing styles)
  // Optimize font sizes for thermal printers
  const baseFontSize = isCompact ? 
    (printSettings.font_size === 'small' ? '9px' : printSettings.font_size === 'large' ? '12px' : '10px') :
    (printSettings.font_size === 'small' ? '11px' : printSettings.font_size === 'large' ? '15px' : '13px');
  
  // Optimize margins and padding for paper saving
  const padding = isCompact ? '2mm' : '3mm';
  const lineHeight = isCompact ? '1.2' : '1.4';
  const itemMargin = isCompact ? '0.5mm' : '1mm';
  
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: ${width} auto; margin: 0; }
  @media print { 
    html, body { 
      width: ${width}; 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important;
    } 
  }
  body { 
    font-family: 'Courier New', monospace; 
    font-size: ${baseFontSize}; 
    font-weight: 600; 
    line-height: ${lineHeight}; 
    width: ${width}; 
    padding: ${padding}; 
    background: #fff; 
    color: #000; 
  }
  .center { text-align: center; }
  .left { text-align: left; }
  .right { text-align: right; }
  .bold { font-weight: 900 !important; }
  .large { font-size: ${isCompact ? '1.2em' : '1.3em'}; font-weight: 900; }
  .small { font-size: 0.9em; }
  .xsmall { font-size: 0.8em; }
  .separator { border-top: 1px dashed #000; margin: ${isCompact ? '1mm' : '2mm'} 0; }
  .double-line { border-top: 2px solid #000; margin: ${isCompact ? '1mm' : '2mm'} 0; }
  .dotted-line { border-top: 1px dotted #000; margin: ${isCompact ? '1mm' : '2mm'} 0; }
  .item-row { display: flex; justify-content: space-between; margin: ${itemMargin} 0; font-weight: 600; }
  .total-row { display: flex; justify-content: space-between; font-weight: 700; margin: ${itemMargin} 0; }
  .grand-total { font-size: ${isCompact ? '1.2em' : '1.4em'}; font-weight: 900; margin: ${isCompact ? '1mm' : '2mm'} 0; }
  .header-logo { font-size: ${isCompact ? '1.3em' : '1.5em'}; font-weight: 900; margin-bottom: 1mm; }
  .bill-info { display: flex; justify-content: space-between; font-size: 0.95em; margin: ${itemMargin} 0; }
  .table-header { display: flex; justify-content: space-between; font-weight: 900; border-bottom: 1px solid #000; padding-bottom: 1mm; margin-bottom: 1mm; }
  .footer { margin-top: ${isCompact ? '2mm' : '3mm'}; font-size: 0.9em; }
  .mb-1 { margin-bottom: 1mm; }
  .mt-1 { margin-top: 1mm; }
  .kot-item { 
    font-size: ${isCompact ? '1em' : '1.2em'}; 
    font-weight: 900; 
    margin: ${isCompact ? '1mm' : '2mm'} 0; 
    padding: ${isCompact ? '1mm' : '2mm'}; 
    border: ${isCompact ? '1px' : '2px'} solid #000; 
  }
  .kot-note { 
    background: #000; 
    color: #fff; 
    padding: ${isCompact ? '1mm' : '2mm'}; 
    margin: ${isCompact ? '0.5mm 0 1mm 2mm' : '1mm 0 2mm 3mm'}; 
    font-weight: 900; 
    font-size: ${isCompact ? '0.9em' : '1em'};
  }
`;
};

// NEW: Professional theme styles (matching the thermal printer receipt format from image)
const getProfessionalThemeStyles = (width, settings) => {
  const isCompact = width === '58mm';
  
  // Use fonts that match thermal printer output - condensed and clean
  const baseFontSize = isCompact ? 
    (settings.font_size === 'small' ? '10px' : settings.font_size === 'large' ? '13px' : '11px') :
    (settings.font_size === 'small' ? '12px' : settings.font_size === 'large' ? '15px' : '13px');
  
  const padding = isCompact ? '2mm' : '3mm';
  const lineHeight = '1.1';
  const itemMargin = isCompact ? '0.3mm' : '0.5mm';
  
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: ${width} auto; margin: 0; }
  @media print { 
    html, body { 
      width: ${width}; 
      margin: 0 !important; 
      padding: 0 !important; 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important;
    } 
  }
  body { 
    font-family: 'Courier New', 'Consolas', 'Monaco', monospace; 
    font-size: ${baseFontSize}; 
    font-weight: 400; 
    line-height: ${lineHeight}; 
    width: ${width}; 
    padding: ${padding}; 
    background: #fff; 
    color: #000; 
    letter-spacing: 0px;
  }
  .center { text-align: center; }
  .left { text-align: left; }
  .right { text-align: right; }
  .bold { font-weight: 700 !important; }
  .large { font-size: ${isCompact ? '1.1em' : '1.2em'}; font-weight: 700; }
  .small { font-size: 0.9em; }
  .xsmall { font-size: 0.85em; }
  .separator { border-top: 1px solid #000; margin: ${isCompact ? '1mm' : '1.5mm'} 0; }
  .double-line { border-top: 2px solid #000; margin: ${isCompact ? '1.2mm' : '2mm'} 0; }
  .dotted-line { border-top: 1px dotted #000; margin: ${isCompact ? '1mm' : '1.5mm'} 0; }
  .dashed-line { border-top: 1px dashed #000; margin: ${isCompact ? '1mm' : '1.5mm'} 0; }
  .item-row { 
    display: flex; 
    justify-content: space-between; 
    margin: ${itemMargin} 0; 
    font-weight: 400;
    align-items: baseline;
    font-size: 1em;
  }
  .total-row { 
    display: flex; 
    justify-content: space-between; 
    font-weight: 400; 
    margin: ${itemMargin} 0;
    align-items: baseline;
  }
  .grand-total { 
    font-size: ${isCompact ? '1.1em' : '1.2em'}; 
    font-weight: 700; 
    margin: ${isCompact ? '1.5mm' : '2mm'} 0;
    padding: ${isCompact ? '1mm' : '1.5mm'} 0;
  }
  .header-logo { 
    font-size: ${isCompact ? '1.2em' : '1.3em'}; 
    font-weight: 700; 
    margin-bottom: ${isCompact ? '1mm' : '1.5mm'}; 
    letter-spacing: 0px;
  }
  .bill-info { 
    display: flex; 
    justify-content: space-between; 
    font-size: 1em; 
    margin: ${itemMargin} 0;
    font-weight: 400;
  }
  .table-header { 
    display: flex; 
    justify-content: space-between; 
    font-weight: 700; 
    border-bottom: 1px solid #000; 
    padding-bottom: ${isCompact ? '0.8mm' : '1.2mm'}; 
    margin-bottom: ${isCompact ? '0.8mm' : '1.2mm'};
    font-size: 1em;
  }
  .footer { 
    margin-top: ${isCompact ? '2mm' : '3mm'}; 
    font-size: 0.9em; 
    font-weight: 400;
  }
  .mb-1 { margin-bottom: ${isCompact ? '0.8mm' : '1.2mm'}; }
  .mt-1 { margin-top: ${isCompact ? '0.8mm' : '1.2mm'}; }
  .professional-header {
    padding: ${isCompact ? '1.5mm' : '2.5mm'};
    margin-bottom: ${isCompact ? '1.5mm' : '2.5mm'};
    text-align: center;
  }
  .professional-section {
    margin: ${isCompact ? '1.2mm' : '2mm'} 0;
    padding: ${isCompact ? '0.8mm' : '1.2mm'} 0;
  }
  .professional-total {
    padding: ${isCompact ? '1mm' : '1.5mm'};
    margin: ${isCompact ? '1mm' : '1.5mm'} 0;
    font-weight: 700;
    text-align: center;
  }
  .professional-item-section {
    margin: ${isCompact ? '1mm' : '1.5mm'} 0;
  }
  .kot-item { 
    font-size: ${isCompact ? '0.9em' : '1em'}; 
    font-weight: 700; 
    margin: ${isCompact ? '1mm' : '1.5mm'} 0; 
    padding: ${isCompact ? '1mm' : '1.5mm'}; 
    border: 1px solid #000; 
  }
  .kot-note { 
    background: #000; 
    color: #fff; 
    padding: ${isCompact ? '1mm' : '1.5mm'}; 
    margin: ${isCompact ? '0.5mm 0 1mm 2mm' : '0.8mm 0 1.5mm 3mm'}; 
    font-weight: 700; 
    font-size: ${isCompact ? '0.8em' : '0.9em'};
  }
`;
};

export const printThermal = (htmlContent, paperWidth = '80mm', forceDialog = false) => {
  const settings = getPrintSettings();
  
  // For Electron apps, use native printing
  if (isElectron() && window.electronAPI?.printReceipt) {
    try { 
      window.electronAPI.printReceipt(htmlContent, { 
        paperWidth,
        silent: !forceDialog
      }); 
      toast.success('Printing...'); 
      return true; 
    } catch (e) {
      console.error('Electron print error:', e);
    }
  }
  
  // For web browsers - completely avoid browser print dialogs
  if (forceDialog) {
    // Only show dialog when explicitly requested by user
    return printWithDialog(htmlContent, paperWidth);
  } else {
    // COMPLETELY SILENT - No browser dialogs, no popups, no window.print()
    return trueSilentPrint(htmlContent, paperWidth);
  }
};

// TRUE SILENT PRINTING - Bypasses all browser print mechanisms
const trueSilentPrint = (htmlContent, paperWidth = '80mm') => {
  try {
    // Method 1: Direct thermal printer communication (best)
    if (window.electronAPI?.directPrint) {
      window.electronAPI.directPrint(htmlContent, { paperWidth });
      toast.success('Receipt sent directly to printer!');
      return true;
    }
    
    // Method 2: Bluetooth thermal printer (if connected)
    if (isBluetoothPrinterConnected()) {
      const plainText = htmlContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
      return printViaBluetooth(plainText);
    }
    
    // Method 3: Background processing without browser print dialog
    return backgroundPrint(htmlContent, paperWidth);
    
  } catch (error) {
    console.error('True silent print failed:', error);
    toast.info('Receipt ready! Use Ctrl+P to print or connect thermal printer.');
    return false;
  }
};

// Background printing without any browser dialogs
const backgroundPrint = (htmlContent, paperWidth = '80mm') => {
  try {
    // Create a hidden container for the receipt
    const receiptContainer = document.createElement('div');
    receiptContainer.id = 'background-print-' + Date.now();
    receiptContainer.style.cssText = `
      position: absolute !important;
      top: -10000px !important;
      left: -10000px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
      z-index: -1000 !important;
    `;
    
    // Format content for thermal printing
    const thermalContent = `
      <div style="
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.2;
        width: ${paperWidth};
        color: black;
        background: white;
        padding: 2mm;
        white-space: pre-wrap;
      ">
        ${htmlContent}
      </div>
    `;
    
    receiptContainer.innerHTML = thermalContent;
    document.body.appendChild(receiptContainer);
    
    // Instead of printing, prepare the content and notify user
    setTimeout(() => {
      // Check if thermal printer is available
      if (navigator.usb || navigator.serial) {
        toast.success('Receipt prepared! Connect thermal printer for direct printing.');
      } else {
        toast.success('Receipt ready! Use Ctrl+P to print to thermal printer.');
      }
      
      // Store receipt data for potential later printing (with size limit)
      try {
        const receiptData = {
          content: htmlContent.substring(0, 5000), // Limit content size
          paperWidth: paperWidth,
          timestamp: Date.now()
        };
        localStorage.setItem('lastReceipt', JSON.stringify(receiptData));
      } catch (e) {
        console.log('Receipt storage skipped due to size limits');
        // Clear old receipt data if storage is full
        try {
          localStorage.removeItem('lastReceipt');
        } catch (clearError) {
          console.log('Storage cleanup completed');
        }
      }
      
      // Cleanup
      setTimeout(() => {
        try {
          if (document.body.contains(receiptContainer)) {
            document.body.removeChild(receiptContainer);
          }
        } catch (e) {
          console.log('Cleanup completed');
        }
      }, 1000);
    }, 100);
    
    return true;
    
  } catch (error) {
    console.error('Background print failed:', error);
    toast.info('Receipt ready! Please use manual print.');
    return false;
  }
};

// Completely silent printing function - NO BROWSER DIALOGS
const silentThermalPrint = (htmlContent, paperWidth = '80mm') => {
  try {
    // Method 1: Direct printer communication (if available)
    if (window.electronAPI?.silentPrint) {
      window.electronAPI.silentPrint(htmlContent, { paperWidth });
      toast.success('Receipt sent to printer!');
      return true;
    }
    
    // Method 2: Use Web Serial API for direct thermal printer communication (if supported)
    if ('serial' in navigator) {
      return trySerialPrint(htmlContent);
    }
    
    // Method 3: Use CSS-only approach with no window.print() calls
    return cssOnlyPrint(htmlContent, paperWidth);
    
  } catch (error) {
    console.error('All silent print methods failed:', error);
    toast.info('Receipt ready! Please use Ctrl+P to print manually.');
    return false;
  }
};

// CSS-only printing without window.print()
const cssOnlyPrint = (htmlContent, paperWidth = '80mm') => {
  try {
    // Create a completely hidden print container
    const printContainer = document.createElement('div');
    printContainer.id = 'silent-print-container-' + Date.now();
    printContainer.style.cssText = `
      position: fixed !important;
      top: -9999px !important;
      left: -9999px !important;
      width: 1px !important;
      height: 1px !important;
      opacity: 0 !important;
      overflow: hidden !important;
      pointer-events: none !important;
      z-index: -9999 !important;
    `;
    
    // Add thermal printer optimized content
    printContainer.innerHTML = `
      <div style="
        font-family: 'Courier New', monospace;
        font-size: 12px;
        line-height: 1.2;
        width: ${paperWidth};
        color: black;
        background: white;
        padding: 2mm;
      ">
        ${htmlContent}
      </div>
    `;
    
    // Add print-specific styles that activate only during printing
    const printStyles = document.createElement('style');
    printStyles.id = 'thermal-print-styles-' + Date.now();
    printStyles.textContent = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #${printContainer.id} {
          visibility: visible !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: ${paperWidth} !important;
          height: auto !important;
          overflow: visible !important;
          opacity: 1 !important;
          z-index: 9999 !important;
        }
        #${printContainer.id} * {
          visibility: visible !important;
        }
        @page {
          size: ${paperWidth} auto;
          margin: 0;
        }
      }
    `;
    
    document.head.appendChild(printStyles);
    document.body.appendChild(printContainer);
    
    // Instead of window.print(), use a different approach
    // Try to trigger print through keyboard shortcut simulation
    setTimeout(() => {
      try {
        // Method A: Try to use execCommand (deprecated but still works in some browsers)
        if (document.execCommand) {
          document.execCommand('print', false, null);
        } else {
          // Method B: Create a custom print event
          const printEvent = new Event('beforeprint', { bubbles: true, cancelable: true });
          window.dispatchEvent(printEvent);
          
          // Method C: Use media query change to trigger print styles
          const mediaQuery = window.matchMedia('print');
          if (mediaQuery.media === 'print') {
            // Print styles are already applied
            toast.success('Receipt formatted for printing!');
          }
        }
      } catch (e) {
        // Method D: Show instructions instead of opening dialog
        toast.info('Receipt ready! Press Ctrl+P to print to your thermal printer.');
      }
      
      // Cleanup after a delay
      setTimeout(() => {
        try {
          if (document.head.contains(printStyles)) {
            document.head.removeChild(printStyles);
          }
          if (document.body.contains(printContainer)) {
            document.body.removeChild(printContainer);
          }
        } catch (cleanupError) {
          console.log('Cleanup completed');
        }
      }, 2000);
    }, 100);
    
    toast.success('Receipt prepared for silent printing!');
    return true;
    
  } catch (error) {
    console.error('CSS-only print failed:', error);
    return false;
  }
};

// Try Web Serial API for direct thermal printer communication
const trySerialPrint = async (htmlContent) => {
  try {
    // This would connect directly to thermal printers via USB/Serial
    // Note: Requires user permission and HTTPS
    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    
    // Convert HTML to ESC/POS commands for thermal printers
    const escPosCommands = convertToESCPOS(htmlContent);
    
    const writer = port.writable.getWriter();
    await writer.write(escPosCommands);
    writer.releaseLock();
    await port.close();
    
    toast.success('Receipt sent directly to thermal printer!');
    return true;
  } catch (error) {
    console.log('Serial printing not available:', error);
    return false;
  }
};

// Convert HTML content to ESC/POS commands for thermal printers
const convertToESCPOS = (htmlContent) => {
  // Basic ESC/POS command conversion
  const text = htmlContent.replace(/<[^>]*>/g, ''); // Strip HTML tags
  const lines = text.split('\n');
  
  const commands = [];
  commands.push(0x1B, 0x40); // Initialize printer
  
  lines.forEach(line => {
    if (line.trim()) {
      // Add text
      const textBytes = new TextEncoder().encode(line.trim());
      commands.push(...textBytes);
      commands.push(0x0A); // Line feed
    }
  });
  
  commands.push(0x1D, 0x56, 0x00); // Cut paper
  
  return new Uint8Array(commands);
};

// Alternative silent print method
const alternativeSilentPrint = (htmlContent, paperWidth = '80mm') => {
  // Method 2: Use CSS @media print with hidden div
  const printDiv = document.createElement('div');
  printDiv.id = 'thermal-print-content';
  printDiv.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;overflow:hidden;';
  
  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  
  // Add print-specific styles
  const printStyles = document.createElement('style');
  printStyles.id = 'thermal-print-styles';
  printStyles.textContent = `
    @media print {
      body * { visibility: hidden; }
      #thermal-print-content, #thermal-print-content * { visibility: visible; }
      #thermal-print-content {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: ${width} !important;
        height: auto !important;
        overflow: visible !important;
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        line-height: 1.3 !important;
        padding: 2mm !important;
        margin: 0 !important;
        background: white !important;
        color: black !important;
      }
      @page { 
        size: ${width} auto; 
        margin: 0; 
      }
    }
  `;
  
  printDiv.innerHTML = htmlContent;
  
  document.head.appendChild(printStyles);
  document.body.appendChild(printDiv);
  
  // Trigger print
  setTimeout(() => {
    window.print();
    
    // Cleanup
    setTimeout(() => {
      try {
        if (document.head.contains(printStyles)) {
          document.head.removeChild(printStyles);
        }
        if (document.body.contains(printDiv)) {
          document.body.removeChild(printDiv);
        }
      } catch (e) {
        console.log('Cleanup completed');
      }
    }, 1000);
  }, 100);
  
  toast.success('Receipt printing...');
  return true;
};

// Function for when dialog is explicitly requested
const printWithDialog = (htmlContent, paperWidth = '80mm') => {
  const printWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
  if (!printWindow) {
    toast.error('Popup blocked! Please allow popups for printing.');
    return false;
  }
  
  const width = paperWidth === '58mm' ? '58mm' : '80mm';
  const printContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Print Receipt</title>
  <style>${getPrintStyles(width)}</style>
</head>
<body>
  <div class="receipt">${htmlContent}</div>
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
</html>`;
  
  printWindow.document.write(printContent);
  printWindow.document.close();
  toast.success('Print dialog opened!');
  return true;
};

export const generateReceiptHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const theme = settings.print_theme || 'default';
  
  // Route to appropriate theme function
  switch (theme) {
    case 'professional':
      return generateProfessionalReceiptHTML(order, businessOverride);
    case 'modern':
      return generateModernReceiptHTML(order, businessOverride);
    case 'compact':
      return generateCompactReceiptHTML(order, businessOverride);
    case 'elegant':
      return generateElegantReceiptHTML(order, businessOverride);
    case 'bold':
      return generateBoldReceiptHTML(order, businessOverride);
    case 'default':
    default:
      return generateDefaultReceiptHTML(order, businessOverride);
  }
};

// NEW: Professional theme receipt generation (matching thermal printer format from image)
const generateProfessionalReceiptHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const b = businessOverride || getBusinessSettings();
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Professional header - clean and centered like the image
  html += '<div class="professional-header">';
  
  // Logo and restaurant name (centered like in image)
  if (settings.show_logo && b.logo_url) {
    const logoSizes = {
      small: 'max-width:30px;max-height:30px;',
      medium: 'max-width:40px;max-height:40px;',
      large: 'max-width:50px;max-height:50px;'
    };
    const logoSize = logoSizes[settings.logo_size] || logoSizes.medium;
    html += `<div class="center mb-1"><img src="${b.logo_url}" alt="Logo" style="${logoSize}" onerror="this.style.display='none'"/></div>`;
  }
  
  // Restaurant name - bold and centered
  html += `<div class="center header-logo bold">${b.restaurant_name || 'Restaurant'}</div>`;
  
  // Business tagline if exists
  if (settings.show_tagline && b.tagline) {
    html += `<div class="center small">${b.tagline}</div>`;
  }
  
  // FSSAI number (like in the image)
  if (settings.show_fssai && b.fssai) {
    html += `<div class="center small bold">FSSAI NO: ${b.fssai}</div>`;
  }
  
  // Address (centered, single line)
  if (settings.show_address && b.address) {
    html += `<div class="center small">${b.address}</div>`;
  }
  
  // Contact info (centered)
  if (settings.show_phone && b.phone) {
    html += `<div class="center small">Contact No: ${b.phone}</div>`;
  }
  
  // GSTIN if exists
  if (settings.show_gstin && b.gstin) {
    html += `<div class="center small">GSTIN: ${b.gstin}</div>`;
  }
  
  html += '</div>'; // End professional-header
  
  // BILL title - centered and bold
  html += '<div class="center large bold mb-1">BILL</div>';
  
  const date = new Date(order.created_at || Date.now());
  
  // Bill info section - matching the image format
  html += '<div class="professional-section">';
  html += `<div class="bill-info"><span class="bold">Bill No: ${billNo}</span><span class="bold">Date: ${date.toLocaleDateString('en-IN')}</span></div>`;
  html += `<div class="bill-info"><span>Table No: ${order.table_number ? order.table_number : 'Counter'}</span><span>(${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})</span></div>`;
  
  // Customer and waiter info
  if (settings.show_customer_name && order.customer_name) {
    html += `<div class="center small">Captain: ${order.customer_name}</div>`;
  }
  if (settings.show_waiter_name && order.waiter_name) {
    html += `<div class="center small">Waiter: ${order.waiter_name}</div>`;
  }
  
  html += '</div>'; // End professional-section
  
  // Items section with clean table format (matching image)
  html += '<div class="separator"></div>';
  html += '<div class="table-header">';
  html += '<span style="flex:2.5;text-align:left">Item</span>';
  html += '<span style="width:30px;text-align:center">Qty</span>';
  html += '<span style="width:50px;text-align:right">Rate</span>';
  html += '<span style="width:60px;text-align:right">Amt</span>';
  html += '</div>';
  
  // Items with clean formatting (like the image)
  (order.items || []).forEach(item => {
    html += `<div class="item-row">`;
    html += `<span style="flex:2.5;text-align:left">${item.name}</span>`;
    html += `<span style="width:30px;text-align:center">${item.quantity}</span>`;
    html += `<span style="width:50px;text-align:right">${item.price.toFixed(2)}</span>`;
    html += `<span style="width:60px;text-align:right">${(item.quantity * item.price).toFixed(2)}</span>`;
    html += `</div>`;
    
    if (settings.show_item_notes && item.notes) {
      html += `<div style="font-size:0.85em;margin-left:2mm;font-style:italic;color:#666;">${item.notes}</div>`;
    }
  });
  
  html += '<div class="separator"></div>';
  
  // Totals section - clean format like the image
  const subtotal = order.subtotal || 0;
  const tax = order.tax || 0;
  const total = order.total || 0;
  const discount = order.discount || order.discount_amount || 0;
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  
  // Calculate items total from items array
  const itemsTotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  const displaySubtotal = discount > 0 ? itemsTotal : subtotal;
  
  // Sub Total line (like in image)
  html += `<div class="total-row"><span>Sub Total ${totalItems}</span><span style="text-align:right">-</span><span style="text-align:right">${displaySubtotal.toFixed(2)}</span></div>`;
  
  if (discount > 0) {
    html += `<div class="total-row small" style="color:#22c55e;"><span>Discount</span><span></span><span style="text-align:right">-${discount.toFixed(2)}</span></div>`;
  }
  
  // Tax if applicable
  const taxRate = order.tax_rate || (subtotal > 0 && tax > 0 ? ((tax / subtotal) * 100) : 0);
  if (tax > 0 || taxRate > 0) {
    const displayTaxRate = taxRate > 0 ? taxRate.toFixed(1) : '0.0';
    html += `<div class="total-row small"><span>Tax (${displayTaxRate}%)</span><span></span><span style="text-align:right">${tax.toFixed(2)}</span></div>`;
  }
  
  // TOTAL AMOUNT - bold and prominent like in image
  html += '<div class="professional-total">';
  html += `<div class="total-row grand-total bold"><span>TOTAL AMOUNT</span><span style="text-align:right">${total.toFixed(2)}</span></div>`;
  html += '</div>';
  
  // Payment details section - show balance received and subtotals
  const { payment_received = 0, balance_amount = 0, is_credit, cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0, payment_method } = order;
  const isSplit = payment_method === 'split' || (cash_amount > 0 && (card_amount > 0 || upi_amount > 0 || credit_amount > 0));
  
  // Always show payment breakdown
  html += '<div class="separator"></div>';
  
  if (isSplit) {
    html += '<div class="center bold small mb-1">BALANCE RECEIVED</div>';
    if (cash_amount > 0) html += `<div class="total-row small"><span>Cash Received</span><span style="text-align:right">${cash_amount.toFixed(2)}</span></div>`;
    if (card_amount > 0) html += `<div class="total-row small"><span>Card Received</span><span style="text-align:right">${card_amount.toFixed(2)}</span></div>`;
    if (upi_amount > 0) html += `<div class="total-row small"><span>UPI Received</span><span style="text-align:right">${upi_amount.toFixed(2)}</span></div>`;
    
    const totalReceived = cash_amount + card_amount + upi_amount;
    if (totalReceived > 0) {
      html += `<div class="total-row bold"><span>Total Received</span><span style="text-align:right">${totalReceived.toFixed(2)}</span></div>`;
    }
    
    if (credit_amount > 0 || balance_amount > 0) {
      const balanceDue = credit_amount || balance_amount;
      html += `<div class="total-row bold" style="color:#dc2626;"><span>Balance Due</span><span style="text-align:right">${balanceDue.toFixed(2)}</span></div>`;
    }
    
    // Show change if overpaid
    if (totalReceived > total) {
      const change = totalReceived - total;
      html += `<div class="total-row bold" style="color:#22c55e;"><span>Change to Return</span><span style="text-align:right">${change.toFixed(2)}</span></div>`;
    }
  } else {
    // Single payment method - show received amount and balance
    const methodDisplay = { 
      cash: 'CASH', 
      card: 'CARD', 
      upi: 'UPI', 
      credit: 'CREDIT' 
    }[payment_method] || (payment_method ? payment_method.toUpperCase() : 'CASH');
    
    html += '<div class="center bold small mb-1">BALANCE RECEIVED</div>';
    if (payment_received > 0) {
      html += `<div class="total-row"><span>Payment Mode</span><span style="text-align:right">${methodDisplay}</span></div>`;
      html += `<div class="total-row bold"><span>Amount Received</span><span style="text-align:right">${payment_received.toFixed(2)}</span></div>`;
      
      // Show change if overpaid
      if (payment_received > total) {
        const change = payment_received - total;
        html += `<div class="total-row bold" style="color:#22c55e;"><span>Change to Return</span><span style="text-align:right">${change.toFixed(2)}</span></div>`;
      }
    }
    
    if (is_credit || balance_amount > 0) {
      html += `<div class="total-row bold" style="color:#dc2626;"><span>Balance Due</span><span style="text-align:right">${balance_amount.toFixed(2)}</span></div>`;
    } else if (payment_received >= total) {
      html += `<div class="total-row bold" style="color:#22c55e;"><span>Status</span><span style="text-align:right">PAID</span></div>`;
    }
  }
  
  // QR code section for unpaid bills
  const isUnpaid = is_credit || balance_amount > 0;
  if (settings.qr_code_enabled && isUnpaid) {
    html += '<div class="separator"></div>';
    html += '<div class="center bold small mb-1">SCAN TO PAY BALANCE</div>';
    
    const paymentUrl = generatePaymentUrl(order, b);
    const qrSize = settings.paper_width === '58mm' ? 60 : 80;
    const qrCodeDataUrl = generateQRCodeDataUrl(paymentUrl, qrSize);
    
    html += `<div class="center mb-1">
      <div style="display:inline-block;padding:2px;border:1px solid #000;background:#fff;">
        <img src="${qrCodeDataUrl}" alt="Payment QR Code" style="width:${qrSize}px;height:${qrSize}px;display:block;" onerror="this.parentElement.innerHTML='<div style=&quot;width:${qrSize}px;height:${qrSize}px;border:1px solid #000;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:bold;text-align:center;&quot;>QR CODE<br/>FOR<br/>PAYMENT</div>'"/>
      </div>
    </div>`;
    
    html += `<div class="center xsmall bold">Balance Due: ₹${balance_amount.toFixed(2)}</div>`;
    
    const upiId = b.upi_id || (b.phone ? `${b.phone}@${b.preferred_upi_provider || 'paytm'}` : 'payment@restaurant.com');
    html += `<div class="center xsmall">UPI ID: ${upiId}</div>`;
    html += `<div class="center xsmall">Open any UPI app & scan to pay</div>`;
  }
  
  // Footer - clean and simple like in image
  html += '<div class="separator"></div>';
  html += '<div class="footer center">';
  
  const footerMessage = b.footer_message || 'Thank You! Visit Again...';
  html += `<div class="center">${footerMessage}</div>`;
  
  // Software credit (like in the image)
  html += `<div class="center small">Software Developed by BillByteKOT</div>`;
  html += `<div class="center xsmall">(billbytekot.in)</div>`;
  
  html += '</div>';
  
  return html;
};

// Default theme receipt generation (existing implementation)
const generateDefaultReceiptHTML = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const b = businessOverride || getBusinessSettings();
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Apply settings-based styling
  const fontSize = settings.font_size === 'small' ? '11px' : 
                   settings.font_size === 'large' ? '15px' : '13px';
  
  // Header with logo
  if (settings.show_logo && b.logo_url) {
    const logoSizes = {
      small: 'max-width:40px;max-height:30px;',
      medium: 'max-width:70px;max-height:50px;',
      large: 'max-width:100px;max-height:70px;'
    };
    const logoSize = logoSizes[settings.logo_size] || logoSizes.medium;
    html += `<div class="center mb-1"><img src="${b.logo_url}" alt="Logo" style="${logoSize}" onerror="this.style.display='none'"/></div>`;
  }
  
  // Restaurant name with header style
  const headerClass = settings.header_style === 'left' ? 'left' : 
                     settings.header_style === 'right' ? 'right' : 'center';
  html += `<div class="${headerClass} header-logo">${b.restaurant_name || 'Restaurant'}</div>`;
  
  if (settings.show_tagline && b.tagline) html += `<div class="center small mb-1">${b.tagline}</div>`;
  if (settings.show_fssai && b.fssai) html += `<div class="center xsmall bold">FSSAI NO: ${b.fssai}</div>`;
  if (settings.show_address && b.address) html += `<div class="center xsmall">${b.address}</div>`;
  if (settings.show_phone && b.phone) html += `<div class="center xsmall">Contact: ${b.phone}</div>`;
  if (settings.show_email && b.email) html += `<div class="center xsmall">Email: ${b.email}</div>`;
  if (settings.show_website && b.website) html += `<div class="center xsmall">Web: ${b.website}</div>`;
  if (settings.show_gstin && b.gstin) html += `<div class="center xsmall">GSTIN: ${b.gstin}</div>`;
  
  // Separator based on settings
  const separatorClass = settings.separator_style === 'dots' ? 'dotted-line' :
                        settings.separator_style === 'equals' ? 'double-line' :
                        settings.separator_style === 'line' ? 'separator' : 'separator';
  html += `<div class="${separatorClass}"></div>`;
  
  // Bill header
  html += '<div class="center large mb-1">BILL</div>';
  
  const date = new Date(order.created_at || Date.now());
  html += `<div class="bill-info"><span>Bill No:${billNo}</span><span>Table:${order.table_number ? 'T' + order.table_number : 'Counter'}</span><span>Date:${date.toLocaleDateString('en-IN')}</span></div>`;
  
  // Order details based on settings
  let orderDetails = '';
  if (settings.show_waiter_name && order.waiter_name) orderDetails += `Captain:${order.waiter_name} `;
  if (settings.show_order_time) orderDetails += `(${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })})`;
  if (orderDetails) html += `<div class="bill-info"><span>${orderDetails}</span></div>`;
  
  if (settings.show_customer_name && order.customer_name) html += `<div class="bill-info"><span>Customer: ${order.customer_name}</span></div>`;
  
  // Border style
  const borderClass = settings.border_style === 'double' ? 'double-line' : 'separator';
  html += `<div class="${borderClass}"></div>`;
  
  html += '<div class="table-header"><span style="flex:2">Item</span><span style="width:35px;text-align:center">Qty</span><span style="width:55px;text-align:right">Rate</span><span style="width:60px;text-align:right">Amt</span></div>';
  
  (order.items || []).forEach(item => {
    html += `<div class="item-row"><span style="flex:2">${item.name}</span><span style="width:35px;text-align:center">${item.quantity}</span><span style="width:55px;text-align:right">${item.price.toFixed(2)}</span><span style="width:60px;text-align:right">${(item.quantity * item.price).toFixed(2)}</span></div>`;
    if (settings.show_item_notes && item.notes) html += `<div style="font-size:0.85em;margin-left:3mm;font-style:italic">Note: ${item.notes}</div>`;
  });
  
  html += `<div class="${separatorClass}"></div>`;
  
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
  
  html += `<div class="${borderClass}"></div>`;
  html += `<div class="total-row grand-total"><span>TOTAL AMOUNT</span><span>${total.toFixed(2)}</span></div>`;
  
  const { payment_received = 0, balance_amount = 0, is_credit, cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0, payment_method } = order;
  const isSplit = payment_method === 'split' || (cash_amount > 0 && (card_amount > 0 || upi_amount > 0 || credit_amount > 0)) || (card_amount > 0 && (upi_amount > 0 || credit_amount > 0)) || (upi_amount > 0 && credit_amount > 0);
  
  // Always show payment section
  html += `<div class="${separatorClass}"></div>`;
  
  if (isSplit) {
    html += '<div class="center bold small mb-1">BALANCE RECEIVED</div>';
    if (cash_amount > 0) html += `<div class="total-row small"><span>Cash</span><span>${cash_amount.toFixed(2)}</span></div>`;
    if (card_amount > 0) html += `<div class="total-row small"><span>Card</span><span>${card_amount.toFixed(2)}</span></div>`;
    if (upi_amount > 0) html += `<div class="total-row small"><span>UPI</span><span>${upi_amount.toFixed(2)}</span></div>`;
    if (credit_amount > 0) html += `<div class="total-row small"><span>Credit (Due)</span><span>${credit_amount.toFixed(2)}</span></div>`;
    const totalPaid = cash_amount + card_amount + upi_amount;
    if (totalPaid > 0) html += `<div class="total-row"><span>Total Received</span><span>${totalPaid.toFixed(2)}</span></div>`;
    if (credit_amount > 0) html += `<div class="total-row bold"><span>BALANCE DUE</span><span>${credit_amount.toFixed(2)}</span></div>`;
  } else {
    // Single payment method
    const methodDisplay = { cash: 'CASH', card: 'CARD', upi: 'UPI', credit: 'CREDIT' }[payment_method] || (payment_method ? payment_method.toUpperCase() : 'CASH');
    html += '<div class="center bold small mb-1">BALANCE RECEIVED</div>';
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
  
  html += `<div class="${borderClass}"></div>`;
  
  // Add QR code for unpaid/overdue bills with enhanced optimization
  const isUnpaid = is_credit || balance_amount > 0;
  if (settings.qr_code_enabled && isUnpaid) {
    html += `<div class="${separatorClass}"></div>`;
    html += '<div class="center bold small mb-1">SCAN TO PAY BALANCE</div>';
    
    // Generate enhanced payment URL for QR code
    const paymentUrl = generatePaymentUrl(order, b);
    
    // Optimize QR code size based on paper width
    const qrSize = settings.paper_width === '58mm' ? 80 : 100;
    const qrCodeDataUrl = generateQRCodeDataUrl(paymentUrl, qrSize);
    
    html += `<div class="center mb-1">
      <div style="display:inline-block;padding:4px;border:2px solid #000;background:#fff;border-radius:2px;">
        <img src="${qrCodeDataUrl}" alt="Payment QR Code" style="width:${qrSize}px;height:${qrSize}px;display:block;image-rendering:pixelated;image-rendering:-moz-crisp-edges;image-rendering:crisp-edges;" onerror="this.parentElement.innerHTML='<div style=&quot;width:${qrSize}px;height:${qrSize}px;border:2px solid #000;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:bold;text-align:center;&quot;>QR CODE<br/>FOR<br/>UPI<br/>PAYMENT</div>'"/>
      </div>
    </div>`;
    
    html += `<div class="center xsmall bold">Balance Due: ₹${balance_amount.toFixed(2)}</div>`;
    
    // Enhanced UPI ID display with provider info
    const upiId = b.upi_id || (b.phone ? `${b.phone}@${b.preferred_upi_provider || 'paytm'}` : 'payment@restaurant.com');
    html += `<div class="center xsmall">UPI ID: ${upiId}</div>`;
    
    if (order.customer_phone) {
      html += `<div class="center xsmall">Or call: ${order.customer_phone}</div>`;
    }
    
    // Add payment instructions for better user experience
    html += `<div class="center xsmall" style="margin-top:1mm;">Open any UPI app & scan to pay</div>`;
  }
  
  // Footer based on settings
  const footerMessage = settings.footer_style === 'detailed' ? 
    `${b.footer_message || 'Thank you! Visit Again...'}\nBill generated by BillByteKOT\n(billbytekot.in)` :
    b.footer_message || 'Thank you! Visit Again...';
    
  html += `<div class="footer center"><div class="bold">${footerMessage}</div>`;
  if (settings.footer_style === 'simple') {
    html += `<div class="xsmall mt-1">Bill generated by BillByteKOT</div><div class="xsmall">(billbytekot.in)</div>`;
  }
  html += `</div>`;
  
  return html;
};

export const generateKOTHTML = (order) => {
  const settings = getPrintSettings();
  const kotTheme = settings.kot_theme || 'classic';
  
  // Route to appropriate theme function
  switch (kotTheme) {
    case 'modern':
      return generateModernKOTHTML(order, settings);
    case 'compact':
      return generateCompactKOTHTML(order, settings);
    case 'detailed':
      return generateDetailedKOTHTML(order, settings);
    case 'minimal':
      return generateMinimalKOTHTML(order, settings);
    case 'colorful':
      return generateColorfulKOTHTML(order, settings);
    case 'classic':
    default:
      return generateClassicKOTHTML(order, settings);
  }
};

// 1. Classic KOT Theme (Original)
const generateClassicKOTHTML = (order, settings) => {
  const billNo = getBillNumber(order);
  
  // Optimize spacing and font sizes for thermal printers
  const isCompactMode = settings.paper_width === '58mm';
  const kotFontClass = settings.kot_font_size === 'large' ? 'large' : 
                      settings.kot_font_size === 'medium' ? '' : 'small';
  
  let html = '';
  
  // Compact header for thermal printers
  if (isCompactMode) {
    html += '<div class="center bold" style="font-size:1.2em;margin-bottom:1mm">*** KOT ***</div>';
    html += '<div class="center small">KITCHEN ORDER</div>';
  } else {
    html += '<div class="center" style="font-size:1.5em;font-weight:900">*** KOT ***</div>';
    html += '<div class="center large">KITCHEN ORDER TICKET</div>';
  }
  
  html += '<div class="double-line"></div>';
  
  // Compact order info
  html += `<div class="bill-info"><span class="bold">Order #${billNo}</span><span class="bold">Table: ${order.table_number ? 'T' + order.table_number : 'Counter'}</span></div>`;
  
  // Conditional details based on settings and space
  if (!isCompactMode || settings.kot_show_time) {
    html += `<div class="bill-info"><span>Captain: ${order.waiter_name || 'Self'}</span>`;
    if (settings.kot_show_time) {
      html += `<span>Time: ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>`;
    }
    html += '</div>';
  }
  
  if (order.customer_name && !isCompactMode) {
    html += `<div class="bill-info"><span>Customer: ${order.customer_name}</span></div>`;
  }
  
  // Compact separator
  html += isCompactMode ? '<div class="separator"></div>' : '<div class="double-line"></div>';
  
  // Items header - more compact
  html += isCompactMode ? 
    '<div class="center bold small">ITEMS TO PREPARE</div><div class="separator"></div>' :
    '<div class="center large bold mb-1">ITEMS TO PREPARE</div><div class="separator"></div>';
  
  // Optimized item display
  (order.items || []).forEach(item => {
    if (isCompactMode) {
      // Ultra-compact format for 58mm
      html += `<div class="kot-item" style="font-size:1em;margin:1mm 0;padding:1mm;border:1px solid #000;">${item.quantity}x ${item.name.toUpperCase()}</div>`;
      if (settings.kot_highlight_notes && item.notes) {
        html += `<div class="kot-note" style="padding:1mm;margin:0 0 1mm 2mm;font-size:0.9em;">*** ${item.notes.toUpperCase()} ***</div>`;
      }
    } else {
      // Standard format for 80mm
      html += `<div class="kot-item ${kotFontClass}">${item.quantity} × ${item.name.toUpperCase()}</div>`;
      if (settings.kot_highlight_notes && item.notes) {
        html += `<div class="kot-note">*** ${item.notes.toUpperCase()} ***</div>`;
      }
    }
  });
  
  // Compact footer
  html += '<div class="separator"></div>';
  
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  html += isCompactMode ? 
    `<div class="center bold">TOTAL: ${totalItems} ITEMS</div>` :
    `<div class="center large bold" style="margin-top:2mm">TOTAL ITEMS: ${totalItems}</div>`;
  
  html += '<div class="double-line"></div>';
  
  // Priority indicator - compact
  const priority = order.priority === 'high' ? '*** HIGH PRIORITY ***' : 'NORMAL PRIORITY';
  html += `<div class="center bold ${order.priority === 'high' ? 'large' : 'small'}">${priority}</div>`;
  
  return html;
};

// 2. Modern KOT Theme
const generateModernKOTHTML = (order, settings) => {
  const billNo = getBillNumber(order);
  const isCompactMode = settings.paper_width === '58mm';
  
  let html = '';
  
  // Modern header with clean design
  html += '<div style="text-align:center;padding:3mm;background:#f8f9fa;border:2px solid #000;margin-bottom:2mm;">';
  html += '<div style="font-size:1.4em;font-weight:900;margin-bottom:1mm;">🍽️ KITCHEN ORDER</div>';
  html += `<div style="font-size:1.1em;font-weight:700;">ORDER #${billNo}</div>`;
  html += '</div>';
  
  // Order details in modern card format
  html += '<div style="border:1px solid #000;padding:2mm;margin-bottom:2mm;">';
  html += `<div style="display:flex;justify-content:space-between;margin-bottom:1mm;"><span><strong>Table:</strong> ${order.table_number ? 'T' + order.table_number : 'Counter'}</span><span><strong>Time:</strong> ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span></div>`;
  if (order.waiter_name) html += `<div><strong>Server:</strong> ${order.waiter_name}</div>`;
  if (order.customer_name) html += `<div><strong>Customer:</strong> ${order.customer_name}</div>`;
  html += '</div>';
  
  // Items in modern format
  html += '<div style="border:2px solid #000;padding:2mm;margin-bottom:2mm;">';
  html += '<div style="text-align:center;font-weight:900;font-size:1.2em;margin-bottom:2mm;background:#000;color:#fff;padding:1mm;">ITEMS TO PREPARE</div>';
  
  (order.items || []).forEach((item, index) => {
    html += `<div style="border-bottom:1px dashed #ccc;padding:2mm 0;${index === (order.items || []).length - 1 ? 'border-bottom:none;' : ''}">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;">`;
    html += `<span style="font-size:1.1em;font-weight:700;">${item.name.toUpperCase()}</span>`;
    html += `<span style="background:#000;color:#fff;padding:1mm 2mm;border-radius:2px;font-weight:900;">×${item.quantity}</span>`;
    html += `</div>`;
    if (settings.kot_highlight_notes && item.notes) {
      html += `<div style="margin-top:1mm;padding:1mm;background:#fff3cd;border:1px solid #ffeaa7;font-weight:700;color:#856404;">📝 ${item.notes.toUpperCase()}</div>`;
    }
    html += '</div>';
  });
  
  html += '</div>';
  
  // Modern footer
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  html += '<div style="text-align:center;background:#000;color:#fff;padding:2mm;font-weight:900;font-size:1.2em;">';
  html += `TOTAL: ${totalItems} ITEMS`;
  if (order.priority === 'high') html += ' | 🔥 HIGH PRIORITY';
  html += '</div>';
  
  return html;
};

// 3. Compact KOT Theme
const generateCompactKOTHTML = (order, settings) => {
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Ultra-compact header
  html += '<div class="center bold" style="font-size:1em;">KOT</div>';
  html += '<div class="separator"></div>';
  
  // Minimal order info
  html += `<div style="display:flex;justify-content:space-between;font-size:0.9em;"><span>#${billNo}</span><span>T${order.table_number || 'C'}</span><span>${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })}</span></div>`;
  
  html += '<div class="separator"></div>';
  
  // Compact items - one line per item
  (order.items || []).forEach(item => {
    html += `<div style="font-size:0.95em;margin:0.5mm 0;">${item.quantity}× ${item.name}`;
    if (settings.kot_highlight_notes && item.notes) {
      html += ` (${item.notes})`;
    }
    html += '</div>';
  });
  
  html += '<div class="separator"></div>';
  
  // Compact footer
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  html += `<div class="center bold" style="font-size:0.9em;">${totalItems} ITEMS${order.priority === 'high' ? ' - URGENT' : ''}</div>`;
  
  return html;
};

// 4. Detailed KOT Theme
const generateDetailedKOTHTML = (order, settings) => {
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Detailed header with full information
  html += '<div style="text-align:center;border:3px double #000;padding:3mm;margin-bottom:3mm;">';
  html += '<div style="font-size:1.6em;font-weight:900;margin-bottom:2mm;">🏪 KITCHEN ORDER TICKET</div>';
  html += `<div style="font-size:1.2em;font-weight:700;">ORDER NUMBER: ${billNo}</div>`;
  html += '</div>';
  
  // Comprehensive order details
  html += '<div style="border:2px solid #000;padding:3mm;margin-bottom:3mm;">';
  html += '<div style="font-weight:900;font-size:1.1em;margin-bottom:2mm;text-decoration:underline;">ORDER DETAILS</div>';
  
  const orderDate = new Date(order.created_at || Date.now());
  html += `<div style="margin-bottom:1mm;"><strong>Date:</strong> ${orderDate.toLocaleDateString('en-IN')}</div>`;
  html += `<div style="margin-bottom:1mm;"><strong>Time:</strong> ${orderDate.toLocaleTimeString('en-IN')}</div>`;
  html += `<div style="margin-bottom:1mm;"><strong>Table:</strong> ${order.table_number ? `Table ${order.table_number}` : 'Counter Service'}</div>`;
  if (order.waiter_name) html += `<div style="margin-bottom:1mm;"><strong>Server:</strong> ${order.waiter_name}</div>`;
  if (order.customer_name) html += `<div style="margin-bottom:1mm;"><strong>Customer:</strong> ${order.customer_name}</div>`;
  html += `<div style="margin-bottom:1mm;"><strong>Priority:</strong> ${order.priority === 'high' ? '🔥 HIGH PRIORITY' : '📋 Normal'}</div>`;
  html += '</div>';
  
  // Detailed items section
  html += '<div style="border:2px solid #000;padding:3mm;margin-bottom:3mm;">';
  html += '<div style="font-weight:900;font-size:1.1em;margin-bottom:2mm;text-decoration:underline;">ITEMS TO PREPARE</div>';
  
  (order.items || []).forEach((item, index) => {
    html += `<div style="border:1px solid #ccc;padding:2mm;margin-bottom:2mm;background:#f9f9f9;">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1mm;">`;
    html += `<span style="font-size:1.1em;font-weight:700;">${index + 1}. ${item.name.toUpperCase()}</span>`;
    html += `<span style="background:#000;color:#fff;padding:1mm 3mm;border-radius:3px;font-weight:900;">QTY: ${item.quantity}</span>`;
    html += `</div>`;
    if (settings.kot_highlight_notes && item.notes) {
      html += `<div style="background:#fff3cd;border-left:4px solid #ffc107;padding:2mm;margin-top:1mm;">`;
      html += `<strong>⚠️ SPECIAL INSTRUCTIONS:</strong><br>${item.notes.toUpperCase()}`;
      html += `</div>`;
    }
    html += '</div>';
  });
  
  html += '</div>';
  
  // Detailed summary
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  html += '<div style="border:3px double #000;padding:3mm;text-align:center;">';
  html += `<div style="font-size:1.3em;font-weight:900;">SUMMARY</div>`;
  html += `<div style="font-size:1.1em;margin-top:1mm;">Total Items: ${totalItems}</div>`;
  html += `<div style="font-size:1.1em;">Total Dishes: ${(order.items || []).length}</div>`;
  if (order.priority === 'high') {
    html += '<div style="background:#dc3545;color:#fff;padding:2mm;margin-top:2mm;font-weight:900;">🚨 RUSH ORDER - PREPARE IMMEDIATELY</div>';
  }
  html += '</div>';
  
  return html;
};

// 5. Minimal KOT Theme
const generateMinimalKOTHTML = (order, settings) => {
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Minimal header
  html += `<div style="text-align:center;font-size:1.2em;font-weight:900;margin-bottom:2mm;">KOT ${billNo}</div>`;
  
  // Essential info only
  html += `<div style="text-align:center;font-size:0.9em;margin-bottom:2mm;">T${order.table_number || 'C'} | ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>`;
  
  html += '<div style="border-top:1px solid #000;margin:2mm 0;"></div>';
  
  // Simple item list
  (order.items || []).forEach(item => {
    html += `<div style="margin:1mm 0;font-size:1em;">${item.quantity} ${item.name}`;
    if (settings.kot_highlight_notes && item.notes) {
      html += ` *${item.notes}*`;
    }
    html += '</div>';
  });
  
  html += '<div style="border-top:1px solid #000;margin:2mm 0;"></div>';
  
  // Minimal footer
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  html += `<div style="text-align:center;font-size:0.9em;">${totalItems} items${order.priority === 'high' ? ' - URGENT' : ''}</div>`;
  
  return html;
};

// 6. Colorful KOT Theme (using text symbols for thermal printers)
const generateColorfulKOTHTML = (order, settings) => {
  const billNo = getBillNumber(order);
  
  let html = '';
  
  // Colorful header with symbols
  html += '<div style="text-align:center;border:2px solid #000;padding:2mm;margin-bottom:2mm;">';
  html += '<div style="font-size:1.4em;font-weight:900;">🍳 KITCHEN ORDER 🍳</div>';
  html += `<div style="font-size:1.1em;font-weight:700;">━━━ ORDER #${billNo} ━━━</div>`;
  html += '</div>';
  
  // Order info with symbols
  html += '<div style="border:1px solid #000;padding:2mm;margin-bottom:2mm;">';
  html += `<div>🏠 Table: ${order.table_number ? order.table_number : 'Counter'} | ⏰ ${new Date(order.created_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>`;
  if (order.waiter_name) html += `<div>👨‍💼 Server: ${order.waiter_name}</div>`;
  if (order.customer_name) html += `<div>👤 Customer: ${order.customer_name}</div>`;
  html += '</div>';
  
  // Colorful items with category symbols
  html += '<div style="border:2px solid #000;padding:2mm;margin-bottom:2mm;">';
  html += '<div style="text-align:center;font-weight:900;font-size:1.1em;margin-bottom:2mm;">🍽️ ITEMS TO PREPARE 🍽️</div>';
  
  (order.items || []).forEach((item, index) => {
    // Add category symbols based on item name
    let symbol = '🍽️'; // default
    const itemName = item.name.toLowerCase();
    if (itemName.includes('chicken') || itemName.includes('mutton') || itemName.includes('fish')) symbol = '🍖';
    else if (itemName.includes('rice') || itemName.includes('biryani')) symbol = '🍚';
    else if (itemName.includes('naan') || itemName.includes('roti') || itemName.includes('bread')) symbol = '🍞';
    else if (itemName.includes('curry') || itemName.includes('dal')) symbol = '🍛';
    else if (itemName.includes('tea') || itemName.includes('coffee') || itemName.includes('juice')) symbol = '☕';
    else if (itemName.includes('ice cream') || itemName.includes('dessert')) symbol = '🍨';
    
    html += `<div style="border-bottom:1px dashed #000;padding:1mm 0;margin-bottom:1mm;">`;
    html += `<div style="display:flex;justify-content:space-between;align-items:center;">`;
    html += `<span>${symbol} ${item.name.toUpperCase()}</span>`;
    html += `<span style="font-weight:900;">×${item.quantity}</span>`;
    html += `</div>`;
    if (settings.kot_highlight_notes && item.notes) {
      html += `<div style="margin-top:1mm;font-weight:700;">⚠️ ${item.notes.toUpperCase()}</div>`;
    }
    html += '</div>';
  });
  
  html += '</div>';
  
  // Colorful footer
  const totalItems = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  html += '<div style="text-align:center;border:2px solid #000;padding:2mm;font-weight:900;">';
  html += `📊 TOTAL: ${totalItems} ITEMS`;
  if (order.priority === 'high') {
    html += '<br>🚨 HIGH PRIORITY - RUSH ORDER 🚨';
  }
  html += '</div>';
  
  return html;
};


// ============ PLAIN TEXT FOR BLUETOOTH ============

export const generatePlainTextReceipt = (order, businessOverride = null) => {
  const settings = getPrintSettings();
  const theme = settings.print_theme || 'default';
  
  if (theme === 'professional') {
    return generateProfessionalPlainTextReceipt(order, businessOverride);
  }
  
  // Default theme (existing implementation)
  return generateDefaultPlainTextReceipt(order, businessOverride);
};

// NEW: Professional theme plain text receipt
const generateProfessionalPlainTextReceipt = (order, businessOverride = null) => {
  const b = businessOverride || getBusinessSettings();
  const billNo = getBillNumber(order);
  const w = 48;
  const sep = '─'.repeat(w);
  const dsep = '═'.repeat(w);
  const center = (t) => t.length >= w ? t.substring(0, w) : ' '.repeat(Math.floor((w - t.length) / 2)) + t;
  
  let r = dsep + '\n';
  r += center(b.restaurant_name || 'Restaurant') + '\n';
  
  // Business details in professional format
  if (b.address) r += center(b.address.substring(0, w)) + '\n';
  if (b.phone) r += center(`Contact: ${b.phone}`) + '\n';
  
  // License info in one line
  const licenseInfo = [];
  if (b.fssai) licenseInfo.push(`FSSAI: ${b.fssai}`);
  if (b.gstin) licenseInfo.push(`GSTIN: ${b.gstin}`);
  if (licenseInfo.length > 0) {
    r += center(licenseInfo.join(' | ').substring(0, w)) + '\n';
  }
  
  if (b.tagline) r += center(b.tagline.substring(0, w)) + '\n';
  
  r += dsep + '\n';
  r += center('BILL') + '\n';
  r += sep + '\n';
  
  const d = new Date(order.created_at || Date.now());
  r += `Bill No: ${billNo.padEnd(12)} Date: ${d.toLocaleDateString('en-IN')}\n`;
  r += `Table: ${(order.table_number ? 'T' + order.table_number : 'Counter').padEnd(15)} Time: ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}\n`;
  
  if (order.customer_name) r += `Customer: ${order.customer_name}\n`;
  if (order.waiter_name) r += `Captain: ${order.waiter_name}\n`;
  
  r += sep + '\n';
  r += 'Item                 Qty   Rate    Amount\n';
  r += sep + '\n';
  
  (order.items || []).forEach(i => {
    const itemName = i.name.substring(0, 18).padEnd(18);
    const qty = i.quantity.toString().padStart(3);
    const rate = i.price.toFixed(2).padStart(7);
    const amt = (i.quantity * i.price).toFixed(2).padStart(8);
    r += `${itemName} ${qty} ${rate} ${amt}\n`;
    
    if (i.notes) {
      r += `  Note: ${i.notes.substring(0, 42)}\n`;
    }
  });
  
  r += sep + '\n';
  
  const sub = order.subtotal || 0;
  const tax = order.tax || 0;
  const tot = order.total || 0;
  const discount = order.discount || order.discount_amount || 0;
  const items = (order.items || []).reduce((s, i) => s + i.quantity, 0);
  
  const itemsTotal = (order.items || []).reduce((s, i) => s + (i.price * i.quantity), 0);
  const displaySub = discount > 0 ? itemsTotal : sub;
  
  r += `Sub Total (${items} items)${displaySub.toFixed(2).padStart(w - 20)}\n`;
  
  if (discount > 0) {
    r += `Discount${('-' + discount.toFixed(2)).padStart(w - 8)}\n`;
  }
  
  const taxRate = order.tax_rate || (sub > 0 && tax > 0 ? ((tax / sub) * 100) : 0);
  if (tax > 0 || taxRate > 0) {
    r += `Tax (${taxRate.toFixed(0)}%)${tax.toFixed(2).padStart(w - 12)}\n`;
  }
  
  r += dsep + '\n';
  r += `TOTAL AMOUNT${('₹' + tot.toFixed(2)).padStart(w - 12)}\n`;
  r += dsep + '\n';
  
  // Payment details
  const { payment_received = 0, balance_amount = 0, is_credit, cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0, payment_method } = order;
  const isSplit = payment_method === 'split' || (cash_amount > 0 && (card_amount > 0 || upi_amount > 0 || credit_amount > 0));
  
  r += 'BALANCE RECEIVED:\n';
  if (isSplit) {
    if (cash_amount > 0) r += `Cash Payment${('₹' + cash_amount.toFixed(2)).padStart(w - 12)}\n`;
    if (card_amount > 0) r += `Card Payment${('₹' + card_amount.toFixed(2)).padStart(w - 12)}\n`;
    if (upi_amount > 0) r += `UPI Payment${('₹' + upi_amount.toFixed(2)).padStart(w - 11)}\n`;
    if (credit_amount > 0) r += `Credit (Pending)${('₹' + credit_amount.toFixed(2)).padStart(w - 16)}\n`;
    
    const totalPaid = cash_amount + card_amount + upi_amount;
    if (totalPaid > 0) r += `Total Received${('₹' + totalPaid.toFixed(2)).padStart(w - 14)}\n`;
    if (credit_amount > 0) r += `BALANCE DUE${('₹' + credit_amount.toFixed(2)).padStart(w - 11)}\n`;
  } else {
    const methodDisplay = { cash: 'CASH', card: 'CARD', upi: 'UPI', credit: 'CREDIT' }[payment_method] || 'CASH';
    r += `Payment Mode${methodDisplay.padStart(w - 12)}\n`;
    
    if (payment_received > 0) {
      r += `Amount Received${('₹' + payment_received.toFixed(2)).padStart(w - 15)}\n`;
      
      if (payment_received > tot) {
        const change = payment_received - tot;
        r += `Change to Return${('₹' + change.toFixed(2)).padStart(w - 16)}\n`;
      }
    }
    
    if (is_credit || balance_amount > 0) {
      r += `BALANCE DUE${('₹' + balance_amount.toFixed(2)).padStart(w - 11)}\n`;
    } else if (payment_received >= tot) {
      r += `Status${('PAID').padStart(w - 6)}\n`;
    }
  }
  
  // QR code section for unpaid bills
  const settings = getPrintSettings();
  const isUnpaid = is_credit || balance_amount > 0;
  if (settings.qr_code_enabled && isUnpaid) {
    r += sep + '\n';
    r += center('SCAN QR CODE TO PAY BALANCE') + '\n';
    r += center(`Balance Due: ₹${balance_amount.toFixed(2)}`) + '\n';
    r += sep + '\n';
    
    // Professional QR code representation
    r += center('┌─────────────────────────┐') + '\n';
    r += center('│ ██ ▄▄▄▄▄ ██▀█ ▄▄▄▄▄ ██ │') + '\n';
    r += center('│ ██ █   █ ██▀▀ █   █ ██ │') + '\n';
    r += center('│ ██ █▄▄▄█ ██▀█ █▄▄▄█ ██ │') + '\n';
    r += center('│ ██▄▄▄▄▄▄▄██▄▀▄▄▄▄▄▄▄██ │') + '\n';
    r += center('│ ██▄▄█▄▀▄▄  ▄▀ ▄▀▄▄█▄▄██ │') + '\n';
    r += center('│ ████▄▄▄▄▄█▀▀▀█▀▀▀█▄▄▄██ │') + '\n';
    r += center('│ ██ ▄▄▄▄▄ █▄█ █ ████▀▄██ │') + '\n';
    r += center('│ ██ █   █ █▄▄▄█▀▀▀▀▀▄▄██ │') + '\n';
    r += center('│ ██ █▄▄▄█ █▀█ █▄▄█▄▄▄▄██ │') + '\n';
    r += center('│ ██▄▄▄▄▄▄▄█▄▄▄█▄█▄▄▄▄▄██ │') + '\n';
    r += center('└─────────────────────────┘') + '\n';
    
    const upiId = b.upi_id || (b.phone ? `${b.phone}@paytm` : 'payment@restaurant.com');
    r += center(`UPI ID: ${upiId}`) + '\n';
    r += center('Open any UPI app & scan to pay') + '\n';
  }
  
  r += sep + '\n';
  r += center(b.footer_message || 'Thank you for dining with us!') + '\n';
  r += center('Bill generated by BillByteKOT') + '\n';
  r += center('(billbytekot.in)') + '\n';
  r += dsep + '\n';
  
  return r;
};

// Default theme plain text receipt (existing implementation)
const generateDefaultPlainTextReceipt = (order, businessOverride = null) => {
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
  r += dsep + '\n' + `TOTAL AMOUNT                   ${tot.toFixed(2).padStart(8)}\n` + dsep + '\n';
  
  // Payment details
  const { payment_received = 0, balance_amount = 0, is_credit, cash_amount = 0, card_amount = 0, upi_amount = 0, credit_amount = 0, payment_method } = order;
  const isSplit = payment_method === 'split' || (cash_amount > 0 && (card_amount > 0 || upi_amount > 0 || credit_amount > 0));
  
  r += 'BALANCE RECEIVED:\n';
  if (isSplit) {
    if (cash_amount > 0) r += `Cash:                          ${cash_amount.toFixed(2).padStart(8)}\n`;
    if (card_amount > 0) r += `Card:                          ${card_amount.toFixed(2).padStart(8)}\n`;
    if (upi_amount > 0) r += `UPI:                           ${upi_amount.toFixed(2).padStart(8)}\n`;
    if (credit_amount > 0) r += `Credit (Due):                  ${credit_amount.toFixed(2).padStart(8)}\n`;
    const totalPaid = cash_amount + card_amount + upi_amount;
    if (totalPaid > 0) r += `Total Received:                ${totalPaid.toFixed(2).padStart(8)}\n`;
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
    
    // Try Bluetooth direct print first (truly silent)
    if (isBluetoothPrinterConnected()) {
      try {
        const { printReceipt: btPrint } = await import('./bluetoothPrint');
        await btPrint(order, businessOverride || getBusinessSettings());
        toast.success('Receipt printed via Bluetooth!');
        return true;
      } catch (btError) {
        console.log('Bluetooth print failed, using thermal print:', btError);
      }
    }
    
    // Use completely silent thermal printing (no dialogs)
    const receiptHTML = generateReceiptHTML(order, businessOverride);
    return printThermal(receiptHTML, settings.paper_width, false); // false = silent
  } catch (e) { 
    console.error('Print failed:', e);
    toast.error('Print failed - please try manual print'); 
    return false; 
  }
};

export const printKOT = async (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    
    // Try Bluetooth direct print first (truly silent)
    if (isBluetoothPrinterConnected()) {
      try {
        const { printKOT: btPrintKOT } = await import('./bluetoothPrint');
        await btPrintKOT(order, businessOverride || getBusinessSettings());
        toast.success('KOT printed via Bluetooth!');
        return true;
      } catch (btError) {
        console.log('Bluetooth KOT print failed, using thermal print:', btError);
      }
    }
    
    // Use completely silent thermal printing (no dialogs)
    const kotHTML = generateKOTHTML(order, businessOverride);
    return printThermal(kotHTML, settings.paper_width, false); // false = silent
  } catch (e) { 
    console.error('KOT print failed:', e);
    toast.error('KOT print failed - please try manual print'); 
    return false; 
  }
};

export const printDocument = (content, title = 'Print') => {
  const w = getPrintSettings().paper_width === '58mm' ? '58mm' : '80mm';
  return printWithDialog(content, w);
};

export const silentPrint = (html, paperWidth = '80mm') => {
  return printThermal(html, paperWidth, false); // Always silent
};

export const printWithDialogExport = (html, paperWidth = '80mm') => {
  return printThermal(html, paperWidth, true); // Force dialog
};

// Manual print function for user-initiated printing
export const manualPrintReceipt = async (order, businessOverride = null) => {
  try {
    const settings = getPrintSettings();
    const receiptHTML = generateReceiptHTML(order, businessOverride);
    return printThermal(receiptHTML, settings.paper_width, true); // Force dialog for manual print
  } catch (e) { 
    console.error('Manual print failed:', e);
    toast.error('Print failed'); 
    return false; 
  }
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
