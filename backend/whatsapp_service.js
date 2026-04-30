/**
 * WhatsApp Cloud API Microservice - BillByteKOT
 * Node.js + axios — sends transaction messages via Meta WhatsApp Business API
 * No wa.me redirects. Cloud API only.
 */

'use strict';

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const {
  WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_WEBHOOK_VERIFY_TOKEN = 'billbytekot_webhook',
  WHATSAPP_API_VERSION = 'v18.0',
  PORT = 3001
} = process.env;

// Pre-configured axios instance for WhatsApp Cloud API
const waClient = axios.create({
  baseURL: `https://graph.facebook.com/${WHATSAPP_API_VERSION}`,
  headers: {
    Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Normalize phone number to E.164 format without leading +
 * Handles Indian numbers (10-digit → prepend 91)
 */
function cleanPhone(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.length === 10) return '91' + p;
  if (p.length === 11 && p.startsWith('0')) return '91' + p.slice(1);
  return p;
}

/**
 * Send a plain text message via WhatsApp Cloud API
 */
async function sendTextMessage(to, body) {
  const phone = cleanPhone(to);
  const { data } = await waClient.post(`/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: phone,
    type: 'text',
    text: { preview_url: false, body }
  });
  return data;
}

/**
 * Build a formatted transaction/invoice message
 */
function buildTransactionMessage(order, business = {}) {
  const SYMBOLS = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ' };
  const sym = SYMBOLS[business.currency] || '₹';
  const name = business.restaurant_name || 'Restaurant';
  const orderId = String(order.id || '').slice(0, 8).toUpperCase();
  const date = new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  let msg = `🧾 *${name}*\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  msg += `📋 Invoice #${orderId}\n`;
  msg += `📅 ${date}\n`;
  if (order.table_number) msg += `🍽️ Table: ${order.table_number}\n`;
  if (order.customer_name) msg += `👤 ${order.customer_name}\n`;
  msg += `\n`;

  const items = order.items || [];
  if (items.length) {
    msg += `*Items:*\n`;
    for (const item of items) {
      const lineTotal = ((item.price || 0) * (item.quantity || 1)).toFixed(2);
      msg += `  ${item.quantity}× ${item.name} — ${sym}${lineTotal}\n`;
    }
    msg += `\n`;
  }

  const subtotal = (order.subtotal || 0).toFixed(2);
  const tax = (order.tax || 0).toFixed(2);
  const discount = order.discount || 0;
  const total = (order.total || 0).toFixed(2);

  msg += `💰 *Bill Summary:*\n`;
  msg += `Subtotal: ${sym}${subtotal}\n`;
  if (discount > 0) msg += `Discount: -${sym}${discount.toFixed(2)}\n`;
  msg += `Tax: ${sym}${tax}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*TOTAL: ${sym}${total}*\n\n`;

  const method = (order.payment_method || 'cash').toUpperCase();
  msg += order.is_credit
    ? `📌 *Payment: CREDIT*\n\n`
    : `💳 *Payment: ${method}*\n\n`;

  msg += `✨ Thank you for dining with us!\n`;
  if (business.phone) msg += `📞 ${business.phone}\n`;
  if (business.address) msg += `📍 ${business.address}\n`;
  msg += `\n_Powered by BillByteKOT_`;

  return msg;
}

/**
 * Build a status update message
 */
function buildStatusMessage(orderId, status, restaurantName = 'Restaurant') {
  const id = String(orderId || '').slice(0, 8).toUpperCase();
  const name = restaurantName;

  const templates = {
    pending: `⏳ *${name}*\n\n✅ Order Confirmed!\nOrder #${id}\n\nYour order has been received and will be prepared shortly.\n\n_Powered by BillByteKOT_`,
    preparing: `👨‍🍳 *${name}*\n\n🔥 Order Being Prepared!\nOrder #${id}\n\nOur chef is now cooking your meal. Estimated: 15-20 min.\n\n_Powered by BillByteKOT_`,
    ready: `🔔 *${name}*\n\n✅ Order Ready!\nOrder #${id}\n\nYour order is ready to be served. Enjoy your meal! 😋\n\n_Powered by BillByteKOT_`,
    completed: `🎉 *${name}*\n\n✅ Payment Completed!\nOrder #${id}\n\nThank you for dining with us. See you again! 🙏\n\n_Powered by BillByteKOT_`,
    cancelled: `❌ *${name}*\n\nOrder #${id} has been cancelled.\n\nContact us if you have questions.\n\n_Powered by BillByteKOT_`
  };

  return templates[status] || `📋 *${name}*\n\nOrder #${id} — Status: ${status}\n\n_Powered by BillByteKOT_`;
}

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /send-transaction
 * Auto-send invoice/receipt after payment completion
 * Body: { phone, order, business }
 */
app.post('/send-transaction', async (req, res) => {
  const { phone, order, business } = req.body;

  if (!phone || !order) {
    return res.status(400).json({ success: false, error: 'phone and order are required' });
  }
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return res.status(503).json({ success: false, error: 'WhatsApp Cloud API not configured. Set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.' });
  }

  try {
    const message = buildTransactionMessage(order, business || {});
    const result = await sendTextMessage(phone, message);
    const messageId = result?.messages?.[0]?.id;
    console.log(`✅ WA transaction sent | to=${phone} | msg_id=${messageId} | order=${String(order.id || '').slice(0, 8)}`);
    return res.json({ success: true, message_id: messageId });
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error(`❌ WA transaction failed | to=${phone} | error=${JSON.stringify(detail)}`);
    return res.status(500).json({ success: false, error: detail });
  }
});

/**
 * POST /send-status
 * Send order status update (pending/preparing/ready/completed)
 * Body: { phone, order_id, status, restaurant_name }
 */
app.post('/send-status', async (req, res) => {
  const { phone, order_id, status, restaurant_name } = req.body;

  if (!phone || !status) {
    return res.status(400).json({ success: false, error: 'phone and status are required' });
  }
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return res.status(503).json({ success: false, error: 'WhatsApp Cloud API not configured' });
  }

  try {
    const message = buildStatusMessage(order_id, status, restaurant_name);
    const result = await sendTextMessage(phone, message);
    const messageId = result?.messages?.[0]?.id;
    console.log(`✅ WA status sent | to=${phone} | status=${status} | msg_id=${messageId}`);
    return res.json({ success: true, message_id: messageId });
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error(`❌ WA status failed | to=${phone} | status=${status} | error=${JSON.stringify(detail)}`);
    return res.status(500).json({ success: false, error: detail });
  }
});

/**
 * GET /webhook
 * Meta webhook verification challenge
 */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WHATSAPP_WEBHOOK_VERIFY_TOKEN && challenge) {
    console.log('✅ WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  console.warn('⚠️ WhatsApp webhook verification failed');
  return res.status(403).send('Verification failed');
});

/**
 * POST /webhook
 * Receive WhatsApp message delivery status updates
 */
app.post('/webhook', (req, res) => {
  try {
    const changes = req.body?.entry?.[0]?.changes?.[0]?.value;
    const statuses = changes?.statuses || [];
    const messages = changes?.messages || [];

    for (const s of statuses) {
      console.log(`📨 WA delivery | msg_id=${s.id} | status=${s.status} | to=${s.recipient_id}`);
    }
    for (const m of messages) {
      console.log(`📩 WA inbound | from=${m.from} | type=${m.type}`);
    }
  } catch {
    // Non-blocking — always acknowledge
  }
  return res.json({ success: true });
});

/**
 * GET /health
 */
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'whatsapp-cloud-api',
    configured: !!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID),
    phone_number_id: WHATSAPP_PHONE_NUMBER_ID || null
  });
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 WhatsApp Cloud API Service running on port ${PORT}`);
  console.log(`   Configured: ${!!(WHATSAPP_ACCESS_TOKEN && WHATSAPP_PHONE_NUMBER_ID)}`);
  console.log(`   Phone Number ID: ${WHATSAPP_PHONE_NUMBER_ID || 'NOT SET'}`);
});

module.exports = app;
