/**
 * Android Thermal Printing - TWA / Bubblewrap helper
 *
 * Web Bluetooth is unreliable inside Android TWA/Chrome Custom Tabs on many
 * devices. To make thermal printing actually work inside a Bubblewrap-packaged
 * app, we support the de-facto Android bridges:
 *
 *   1. RawBT  (market: pe.diegoveloper.flutter.rawbt / ru.a402d.rawbtprinter)
 *      - Accepts ESC/POS bytes as base64 via `rawbt:` URI.
 *      - Zero-configuration once the printer is paired in RawBT app.
 *   2. intent://  text share fallback (Android native share sheet → any printer app)
 *   3. Web Bluetooth (direct BLE) if available
 *
 * For non-Android platforms we fall through to the caller's existing flow.
 */
import { toast } from 'sonner';

const ESC = 0x1B;
const GS  = 0x1D;

export const isAndroid = () =>
  typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

export const isAndroidTWA = () => {
  if (!isAndroid()) return false;
  // TWA launches inside Chrome Custom Tab. Detection heuristics:
  if (document.referrer?.startsWith('android-app://')) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.navigator.standalone) return true;
  return false;
};

// -------- ESC/POS builder (shared) --------
const bytes = (...arr) => {
  const out = [];
  for (const a of arr) {
    if (Array.isArray(a)) out.push(...a);
    else if (typeof a === 'string') out.push(...new TextEncoder().encode(a));
    else out.push(a);
  }
  return out;
};

const repeatCh = (ch, n) => ch.repeat(n);

/**
 * Convert order + settings into ESC/POS byte array (Uint8Array)
 */
export const buildReceiptEscPos = (order, business = {}, opts = {}) => {
  const { paperWidth = '80mm' } = opts;
  const cols = paperWidth === '58mm' ? 32 : 48;
  const data = [];

  data.push(...bytes(ESC, 0x40));                 // init
  data.push(...bytes(ESC, 0x74, 0x10));           // code page windows-1252 (safer for ₹ symbol via text)

  // Header - centered, bold, double size
  data.push(...bytes(ESC, 0x61, 0x01));           // center
  data.push(...bytes(ESC, 0x45, 0x01));           // bold
  data.push(...bytes(GS, 0x21, 0x11));            // double height+width
  data.push(...bytes(business.restaurant_name || business.business_name || 'Restaurant'));
  data.push(0x0A);
  data.push(...bytes(GS, 0x21, 0x00));            // normal size
  data.push(...bytes(ESC, 0x45, 0x00));           // bold off

  if (business.tagline) { data.push(...bytes(business.tagline)); data.push(0x0A); }
  if (business.address) { data.push(...bytes(business.address)); data.push(0x0A); }
  if (business.phone)   { data.push(...bytes('Tel: ' + business.phone)); data.push(0x0A); }
  if (business.gstin || business.gst_number) {
    data.push(...bytes('GSTIN: ' + (business.gstin || business.gst_number)));
    data.push(0x0A);
  }

  // Left align for body
  data.push(...bytes(ESC, 0x61, 0x00));
  data.push(...bytes(repeatCh('=', cols))); data.push(0x0A);

  const billNo = order.order_number || (order.id ? String(order.id).slice(-6) : 'N/A');
  const date = new Date(order.created_at || Date.now());
  data.push(...bytes(`Bill: ${billNo}`)); data.push(0x0A);
  data.push(...bytes(`Date: ${date.toLocaleString('en-IN')}`)); data.push(0x0A);
  if (order.table_number) {
    data.push(...bytes(`Table: ${order.table_number}`));
    data.push(0x0A);
  }
  if (order.customer_name) {
    data.push(...bytes(`Customer: ${order.customer_name}`));
    data.push(0x0A);
  }

  data.push(...bytes(repeatCh('-', cols))); data.push(0x0A);

  // Items column widths
  const nameW  = cols - 16;
  const qtyW   = 4;
  const amtW   = 10;
  const header = 'Item'.padEnd(nameW) + 'Qty'.padStart(qtyW) + 'Amt'.padStart(amtW + 2);
  data.push(...bytes(ESC, 0x45, 0x01));
  data.push(...bytes(header.slice(0, cols))); data.push(0x0A);
  data.push(...bytes(ESC, 0x45, 0x00));
  data.push(...bytes(repeatCh('-', cols))); data.push(0x0A);

  const items = order.items || [];
  for (const it of items) {
    const name = (it.name || 'Item').slice(0, nameW - 1).padEnd(nameW);
    const qty  = String(it.quantity || 1).padStart(qtyW);
    const amt  = (((it.price || 0) * (it.quantity || 1)).toFixed(2)).padStart(amtW + 2);
    data.push(...bytes((name + qty + amt).slice(0, cols))); data.push(0x0A);
    if (it.notes) {
      data.push(...bytes(('  ~ ' + it.notes).slice(0, cols))); data.push(0x0A);
    }
  }

  data.push(...bytes(repeatCh('-', cols))); data.push(0x0A);

  const subtotal = order.subtotal ?? items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);
  const tax = order.tax || 0;
  const discount = order.discount || order.discount_amount || 0;
  const total = order.total ?? (subtotal + tax - discount);

  const line = (label, value) => {
    const v = ('Rs.' + Number(value).toFixed(2)).padStart(cols - label.length);
    data.push(...bytes(label + v)); data.push(0x0A);
  };
  line('Sub Total', subtotal);
  if (discount > 0) line('Discount', -discount);
  if (tax > 0) line(`Tax`, tax);

  data.push(...bytes(repeatCh('=', cols))); data.push(0x0A);
  data.push(...bytes(ESC, 0x45, 0x01));
  data.push(...bytes(GS, 0x21, 0x01));            // double height
  line('TOTAL', total);
  data.push(...bytes(GS, 0x21, 0x00));
  data.push(...bytes(ESC, 0x45, 0x00));
  data.push(...bytes(repeatCh('=', cols))); data.push(0x0A);

  if (order.payment_method) {
    data.push(...bytes(`Payment: ${String(order.payment_method).toUpperCase()}`));
    data.push(0x0A);
  }
  data.push(0x0A);

  data.push(...bytes(ESC, 0x61, 0x01));
  data.push(...bytes(business.footer_message || 'Thank You! Visit Again')); data.push(0x0A);
  data.push(...bytes(ESC, 0x61, 0x00));

  // Feed + partial cut
  data.push(...bytes(ESC, 0x64, 0x04));
  data.push(...bytes(GS, 0x56, 0x01));

  return new Uint8Array(data);
};

/**
 * Build ESC/POS for KOT ticket
 */
export const buildKotEscPos = (order, opts = {}) => {
  const { paperWidth = '80mm' } = opts;
  const cols = paperWidth === '58mm' ? 32 : 48;
  const data = [];

  data.push(...bytes(ESC, 0x40));
  data.push(...bytes(ESC, 0x61, 0x01));
  data.push(...bytes(ESC, 0x45, 0x01));
  data.push(...bytes(GS, 0x21, 0x11));
  data.push(...bytes('*** KOT ***')); data.push(0x0A);
  data.push(...bytes(GS, 0x21, 0x00));
  data.push(...bytes(ESC, 0x45, 0x00));
  data.push(...bytes(repeatCh('=', cols))); data.push(0x0A);
  data.push(...bytes(ESC, 0x61, 0x00));

  const billNo = order.order_number || (order.id ? String(order.id).slice(-6) : 'N/A');
  data.push(...bytes(`Order: ${billNo}`)); data.push(0x0A);
  data.push(...bytes(`Time:  ${new Date().toLocaleTimeString('en-IN')}`)); data.push(0x0A);
  if (order.table_number) {
    data.push(...bytes(ESC, 0x45, 0x01));
    data.push(...bytes(GS, 0x21, 0x01));
    data.push(...bytes(`TABLE: ${order.table_number}`)); data.push(0x0A);
    data.push(...bytes(GS, 0x21, 0x00));
    data.push(...bytes(ESC, 0x45, 0x00));
  }
  data.push(...bytes(repeatCh('-', cols))); data.push(0x0A);

  for (const it of order.items || []) {
    data.push(...bytes(ESC, 0x45, 0x01));
    data.push(...bytes(`${it.quantity || 1}x ${it.name}`.slice(0, cols)));
    data.push(0x0A);
    data.push(...bytes(ESC, 0x45, 0x00));
    if (it.notes) {
      data.push(...bytes(`   Note: ${it.notes}`.slice(0, cols)));
      data.push(0x0A);
    }
  }
  data.push(...bytes(repeatCh('=', cols))); data.push(0x0A);
  data.push(...bytes(ESC, 0x45, 0x01));
  const totalQty = (order.items || []).reduce((s, i) => s + (i.quantity || 1), 0);
  data.push(...bytes(`Total Items: ${totalQty}`)); data.push(0x0A);
  data.push(...bytes(ESC, 0x45, 0x00));

  data.push(...bytes(ESC, 0x64, 0x03));
  data.push(...bytes(GS, 0x56, 0x01));

  return new Uint8Array(data);
};

/**
 * Convert Uint8Array to base64 (browser safe for large buffers)
 */
const uint8ToBase64 = (u8) => {
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  return btoa(bin);
};

/**
 * Try RawBT via intent URI. Returns true if attempted.
 * Works in any Android WebView / Chrome / TWA (Bubblewrap).
 *
 * Users must install RawBT once from Play Store and pair their printer there.
 */
export const printViaRawBT = (escPosBytes) => {
  if (!isAndroid()) return false;
  try {
    const b64 = uint8ToBase64(escPosBytes);
    // rawbt:base64,<payload>  -- documented scheme
    const url = `rawbt:base64,${b64}`;

    // Use a hidden iframe to avoid any blank navigation page in TWA
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    setTimeout(() => {
      try { document.body.removeChild(iframe); } catch (e) { /* noop */ }
    }, 2500);

    toast.success('Sent to RawBT printer');
    return true;
  } catch (err) {
    console.error('RawBT print failed', err);
    return false;
  }
};

/**
 * Android intent fallback — open the system share sheet so the user can pick
 * any installed printer service (Google Cloud Print, HP, Canon, Epson …).
 */
export const shareReceiptText = async (text) => {
  if (!navigator.share) return false;
  try {
    await navigator.share({ title: 'Receipt', text });
    return true;
  } catch (e) {
    if (e?.name !== 'AbortError') console.error('share failed', e);
    return false;
  }
};

/**
 * One-shot entry: takes ESC/POS bytes and chooses the best Android bridge.
 * Returns true when something was attempted.
 */
export const androidPrint = async (escPosBytes, plainText = '') => {
  if (!isAndroid()) return false;

  // 1) RawBT (most reliable for Bubblewrap TWA)
  if (printViaRawBT(escPosBytes)) return true;

  // 2) share fallback
  if (plainText) {
    const ok = await shareReceiptText(plainText);
    if (ok) return true;
  }

  return false;
};

/**
 * Helper: check RawBT availability via simple feature-detection probe.
 * We can't truly detect if RawBT is installed, but we can tell the user how.
 */
export const getAndroidPrintingHelpText = () => {
  if (!isAndroid()) return null;
  return {
    primary: 'For instant one-tap thermal printing, install the free "RawBT Print Service" app from Google Play and pair your Bluetooth / USB printer there once.',
    link: 'https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter'
  };
};

export default {
  isAndroid,
  isAndroidTWA,
  buildReceiptEscPos,
  buildKotEscPos,
  printViaRawBT,
  shareReceiptText,
  androidPrint,
  getAndroidPrintingHelpText,
};
