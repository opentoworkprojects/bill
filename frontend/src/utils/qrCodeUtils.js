// QR Code generation utilities for payment QR codes

/**
 * Generate a QR code data URL for payment
 * @param {string} text - The text/URL to encode in QR code
 * @param {number} size - Size of the QR code (default: 150)
 * @returns {string} Data URL for the QR code image
 */
export const generatePaymentQRCode = (text, size = 150) => {
  try {
    // Use Google Charts API for reliable QR code generation
    // This works well for thermal printers and is widely supported
    const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8&chld=M|0`;
    return qrUrl;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return generateFallbackQRCode(size);
  }
};

/**
 * Generate a fallback QR code SVG when online generation fails
 * @param {number} size - Size of the QR code
 * @returns {string} Data URL for fallback QR code SVG
 */
const generateFallbackQRCode = (size = 150) => {
  const svgContent = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="white" stroke="black" stroke-width="3"/>
      
      <!-- Corner markers -->
      <rect x="10" y="10" width="30" height="30" fill="black"/>
      <rect x="15" y="15" width="20" height="20" fill="white"/>
      <rect x="20" y="20" width="10" height="10" fill="black"/>
      
      <rect x="${size-40}" y="10" width="30" height="30" fill="black"/>
      <rect x="${size-35}" y="15" width="20" height="20" fill="white"/>
      <rect x="${size-30}" y="20" width="10" height="10" fill="black"/>
      
      <rect x="10" y="${size-40}" width="30" height="30" fill="black"/>
      <rect x="15" y="${size-35}" width="20" height="20" fill="white"/>
      <rect x="20" y="${size-30}" width="10" height="10" fill="black"/>
      
      <!-- Data pattern simulation -->
      <rect x="50" y="20" width="10" height="10" fill="black"/>
      <rect x="70" y="20" width="10" height="10" fill="black"/>
      <rect x="90" y="20" width="10" height="10" fill="black"/>
      
      <rect x="20" y="50" width="10" height="10" fill="black"/>
      <rect x="40" y="50" width="10" height="10" fill="black"/>
      <rect x="60" y="50" width="10" height="10" fill="black"/>
      <rect x="80" y="50" width="10" height="10" fill="black"/>
      <rect x="100" y="50" width="10" height="10" fill="black"/>
      
      <rect x="30" y="70" width="10" height="10" fill="black"/>
      <rect x="50" y="70" width="10" height="10" fill="black"/>
      <rect x="90" y="70" width="10" height="10" fill="black"/>
      
      <rect x="20" y="90" width="10" height="10" fill="black"/>
      <rect x="60" y="90" width="10" height="10" fill="black"/>
      <rect x="80" y="90" width="10" height="10" fill="black"/>
      <rect x="100" y="90" width="10" height="10" fill="black"/>
      
      <rect x="50" y="110" width="10" height="10" fill="black"/>
      <rect x="70" y="110" width="10" height="10" fill="black"/>
      <rect x="90" y="110" width="10" height="10" fill="black"/>
      
      <!-- Center text -->
      <text x="${size/2}" y="${size/2 + 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="black">PAY</text>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svgContent)}`;
};

/**
 * Generate UPI payment URL for QR code
 * @param {Object} order - Order object with payment details
 * @param {Object} businessSettings - Business settings with UPI details
 * @returns {string} UPI payment URL
 */
export const generateUPIPaymentUrl = (order, businessSettings) => {
  const billNo = order.order_number || order.id || 'BILL001';
  const amount = order.balance_amount || order.total || 0;
  const restaurantName = businessSettings?.restaurant_name || 'Restaurant';
  
  // Determine UPI ID - prioritize configured UPI ID
  let upiId = businessSettings?.upi_id;
  
  // If no UPI ID configured, create one from phone with proper format
  if (!upiId && businessSettings?.phone) {
    const phone = businessSettings.phone.replace(/\D/g, ''); // Remove non-digits
    if (phone.length === 10) {
      // Use proper UPI format - try common UPI providers
      upiId = `${phone}@paytm`; // You can change this to @phonepe, @googlepay, etc.
    }
  }
  
  // Fallback to a generic UPI ID
  if (!upiId) {
    upiId = 'merchant@upi'; // Generic fallback
  }
  
  // Create UPI payment URL according to NPCI standards
  const paymentUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(restaurantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Bill ${billNo} - ${restaurantName}`)}`;
  
  return paymentUrl;
};

/**
 * Generate QR code for thermal printer (optimized for black and white printing)
 * @param {string} text - Text to encode
 * @param {number} size - Size of QR code (default: 120 for thermal printers)
 * @returns {string} QR code data URL optimized for thermal printing
 */
export const generateThermalQRCode = (text, size = 120) => {
  try {
    // Use higher error correction for thermal printers (M = ~15% error correction)
    // Add margin=0 to maximize QR code size within the given dimensions
    const qrUrl = `https://chart.googleapis.com/chart?chs=${size}x${size}&cht=qr&chl=${encodeURIComponent(text)}&choe=UTF-8&chld=M|0`;
    return qrUrl;
  } catch (error) {
    console.error('Thermal QR code generation failed:', error);
    return generateFallbackQRCode(size);
  }
};

/**
 * Test if QR code generation is working
 * @returns {Promise<boolean>} True if QR code generation is working
 */
export const testQRCodeGeneration = async () => {
  try {
    const testUrl = generatePaymentQRCode('test', 50);
    
    // Try to load the image to verify it works
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = testUrl;
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(false), 5000);
    });
  } catch (error) {
    console.error('QR code test failed:', error);
    return false;
  }
};

/**
 * Get QR code with automatic fallback
 * @param {string} text - Text to encode
 * @param {number} size - Size of QR code
 * @returns {Promise<string>} QR code data URL
 */
export const getQRCodeWithFallback = async (text, size = 150) => {
  try {
    const qrUrl = generatePaymentQRCode(text, size);
    
    // Test if the URL is accessible
    const isWorking = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = qrUrl;
      
      // Quick timeout for responsiveness
      setTimeout(() => resolve(false), 2000);
    });
    
    if (isWorking) {
      return qrUrl;
    } else {
      console.warn('Online QR code generation failed, using fallback');
      return generateFallbackQRCode(size);
    }
  } catch (error) {
    console.error('QR code generation error:', error);
    return generateFallbackQRCode(size);
  }
};

export default {
  generatePaymentQRCode,
  generateUPIPaymentUrl,
  generateThermalQRCode,
  testQRCodeGeneration,
  getQRCodeWithFallback
};