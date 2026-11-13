// Connects EasyShop to the EasyPay payment gateway.
// Needs EASYPAY_URL, EASYPAY_API_KEY, EASYPAY_WEBHOOK_SECRET and SITE_URL in .env.
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');

const baseUrl = () => String(process.env.EASYPAY_URL || '').replace(/\/$/, '');
const siteUrl = () => String(process.env.SITE_URL || '').replace(/\/$/, '');

// The EasyPay option only appears at checkout when these are set.
const enabled = () => !!(baseUrl() && process.env.EASYPAY_API_KEY && siteUrl());

async function call(path, options = {}) {
  const res = await fetch(baseUrl() + path, {
    ...options,
    headers: { 'x-api-key': process.env.EASYPAY_API_KEY, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`EasyPay ${res.status}: ${data.error || 'request failed'}`);
  return data;
}

// Creates the payment. The amount is the order total calculated by the server.
async function createPayment(order) {
  const data = await call('/v1/payments', {
    method: 'POST',
    body: JSON.stringify({
      amount: order.total,
      description: `Order ${order.ref}`,
      externalRef: order.ref,
      returnUrl: `${siteUrl()}/order-confirmed.html`,
    }),
  });
  if (!data.id || !data.checkoutUrl) throw new Error('EasyPay gave no checkout link');
  return { id: data.id, checkoutUrl: data.checkoutUrl };
}

// Moves an order forward once, even if the webhook and the polling both report the same result.
async function applyStatus(ref, easypayId, status) {
  const match = { ref, 'payment.easypayId': easypayId, 'payment.status': 'pending' };

  if (status === 'SUCCESSFUL') {
    const order = await Order.findOneAndUpdate(match, { $set: { 'payment.status': 'paid' } }, { new: true });
    if (order && order.status === 'cancelled') {
      console.warn(`Order ${ref} was paid after it was cancelled. Refund the customer.`);
    }
    return order;
  }

  if (status === 'FAILED' || status === 'EXPIRED') {
    const before = await Order.findOneAndUpdate(match, { $set: { 'payment.status': 'failed', status: 'cancelled' } });
    if (before && before.status !== 'cancelled') {
      for (const item of before.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } });
    }
    return before;
  }
  return null; // still waiting
}

// Asks EasyPay where a pending payment stands and updates the order.
async function syncPayment(order) {
  if (order.payment.status !== 'pending' || !order.payment.easypayId) return order;
  try {
    const p = await call(`/v1/payments/${encodeURIComponent(order.payment.easypayId)}`);
    await applyStatus(order.ref, order.payment.easypayId, p.status);
  } catch (e) {
    console.error('EasyPay sync:', e.message);
  }
  return (await Order.findById(order._id)) || order;
}

// Runs every few minutes: settles orders whose customer never finished paying.
async function sweep() {
  const old = new Date(Date.now() - 3 * 60 * 1000);
  const orders = await Order.find({ 'payment.status': 'pending', createdAt: { $lt: old } }).limit(50);
  for (const o of orders) await syncPayment(o);
}

function validSignature(rawBody, signature, secret) {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature || ''));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// POST /webhooks/easypay (mounted in server.js before express.json)
async function webhook(req, res) {
  const secret = process.env.EASYPAY_WEBHOOK_SECRET;
  if (!secret || !Buffer.isBuffer(req.body) || !validSignature(req.body, req.get('X-EasyPay-Signature'), secret)) {
    return res.sendStatus(401);
  }
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); } catch (e) { return res.sendStatus(400); }

  const order = await Order.findOne({ ref: String(event.externalRef), 'payment.easypayId': String(event.paymentId) });
  if (!order) return res.sendStatus(200);

  // Never mark an order paid if the amount does not match the order total.
  if (event.status === 'SUCCESSFUL' && Number(event.amount) !== Number(order.total)) {
    console.error(`EasyPay amount mismatch on order ${order.ref}: paid ${event.amount}, expected ${order.total}`);
    return res.sendStatus(200);
  }
  await applyStatus(order.ref, order.payment.easypayId, event.status);
  res.sendStatus(200);
}

module.exports = { enabled, createPayment, syncPayment, sweep, webhook };
