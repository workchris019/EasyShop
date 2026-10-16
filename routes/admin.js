const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const cfg = require('../config');
const Admin = require('../models/Admin');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Hero = require('../models/Hero');
const { getSettings, saveSettings } = require('../utils/settings');
const { rx } = require('../utils/text');
const { normalizePhone } = require('../utils/phone');
const { wrap, httpError } = require('../utils/http');
const { requireAdmin } = require('../middleware/auth');
const { upload, saveImages, removeImages } = require('../middleware/upload');

const router = express.Router();
const DAY = 24 * 60 * 60 * 1000;
const validId = (id) => mongoose.isValidObjectId(id);

/* ---------- Sign in / out ---------- */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
});

router.post('/login', loginLimiter, wrap(async (req, res) => {
  const { username, password } = req.body || {};
  const admin = await Admin.findOne({ username: String(username || '').trim().toLowerCase() });
  const ok = admin && (await bcrypt.compare(String(password || ''), admin.passwordHash));
  if (!ok) throw httpError(401, 'Wrong username or password.');

  const token = jwt.sign({ id: admin._id, u: admin.username }, process.env.JWT_SECRET, { expiresIn: '8h' });
  res.cookie('admin_token', token, {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', maxAge: 8 * 60 * 60 * 1000,
  });
  res.json({ ok: true });
}));

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// Everything below needs a signed-in admin.
router.use(requireAdmin);

router.get('/me', (req, res) => res.json({ username: req.admin.u }));

router.post('/password', wrap(async (req, res) => {
  const { current, next } = req.body || {};
  if (String(next || '').length < 8) throw httpError(400, 'The new password must be at least 8 characters.');
  const admin = await Admin.findById(req.admin.id);
  if (!admin || !(await bcrypt.compare(String(current || ''), admin.passwordHash))) throw httpError(400, 'Your current password is wrong.');
  admin.passwordHash = await bcrypt.hash(String(next), 12);
  await admin.save();
  res.json({ ok: true });
}));

/* ---------- Settings ---------- */
router.get('/settings', wrap(async (req, res) => res.json(await getSettings())));
router.put('/settings', wrap(async (req, res) => res.json(await saveSettings(req.body || {}))));

/* ---------- Dashboard numbers ---------- */
const pct = (now, before) => (before > 0 ? Math.round(((now - before) / before) * 100) : null);

// Customers whose very first order falls in [from, to). Uses two simple lookups so it
// runs on any MongoDB-compatible server.
async function newCustomersBetween(from, to) {
  const [inRange, before] = await Promise.all([
    Order.distinct('customer.phone', { createdAt: { $gte: from, $lt: to } }),
    Order.distinct('customer.phone', { createdAt: { $lt: from } }),
  ]);
  const seen = new Set(before);
  return inRange.filter((p) => !seen.has(p)).length;
}

// Best sellers from the latest 1000 orders (plain tally, so it works on any MongoDB-compatible server).
function topProducts(orders) {
  const tally = new Map();
  for (const o of orders) {
    for (const it of o.items || []) {
      const row = tally.get(it.name) || { name: it.name, qty: 0, revenue: 0 };
      row.qty += it.qty || 0;
      row.revenue += (it.price || 0) * (it.qty || 0);
      tally.set(it.name, row);
    }
  }
  return [...tally.values()].sort((x, y) => y.qty - x.qty).slice(0, 5);
}

router.get('/stats', wrap(async (req, res) => {
  const now = new Date();
  const weekAgo = new Date(now - 7 * DAY);
  const twoWeeksAgo = new Date(now - 14 * DAY);
  const notCancelled = { status: { $ne: 'cancelled' } };

  const [products, productsWeek, lowStock, outOfStock, orders, ordersWeek, ordersPrev, newOrders, shipped,
    customerPhones, customersWeek, customersPrev, daily, top, revenueRows, activeDeliveries] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ createdAt: { $gte: weekAgo } }),
    Product.countDocuments({ stock: { $gt: 0, $lte: 3 } }),
    Product.countDocuments({ stock: 0 }),
    Order.countDocuments(),
    Order.countDocuments({ createdAt: { $gte: weekAgo } }),
    Order.countDocuments({ createdAt: { $gte: twoWeeksAgo, $lt: weekAgo } }),
    Order.countDocuments({ status: 'new' }),
    Order.countDocuments({ status: 'shipped' }),
    Order.distinct('customer.phone'),
    newCustomersBetween(weekAgo, now),
    newCustomersBetween(twoWeeksAgo, weekAgo),
    Order.find({ createdAt: { $gte: new Date(now - 8 * DAY) }, ...notCancelled }).select('createdAt total').lean(),
    Order.find(notCancelled).sort({ createdAt: -1 }).limit(1000).select('items').lean(),
    Order.aggregate([{ $match: notCancelled }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments({ deliveryMethod: 'delivery', status: { $in: ['new', 'confirmed', 'shipped'] } }),
  ]);

  // Last 7 days in Kigali time, oldest first, with zeros filled in.
  const kigaliDay = (d) => d.toLocaleDateString('en-CA', { timeZone: 'Africa/Kigali' });
  const byDay = new Map();
  for (const o of daily) {
    const key = kigaliDay(new Date(o.createdAt));
    const row = byDay.get(key) || { total: 0, count: 0 };
    row.total += o.total || 0;
    row.count += 1;
    byDay.set(key, row);
  }
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * DAY);
    const key = kigaliDay(d);
    const row = byDay.get(key);
    days.push({ date: key, label: d.toLocaleDateString('en-GB', { timeZone: 'Africa/Kigali', weekday: 'short' }), total: row ? row.total : 0, count: row ? row.count : 0 });
  }

  res.json({
    products, productsWeek, lowStock, outOfStock,
    orders, ordersWeek, ordersChange: pct(ordersWeek, ordersPrev), newOrders, shipped, activeDeliveries,
    customers: customerPhones.length, customersWeek, customersChange: pct(customersWeek, customersPrev),
    revenue: revenueRows[0] ? revenueRows[0].total : 0,
    days, top: topProducts(top),
  });
}));

/* ---------- Products ---------- */
function parseProduct(b, partial = false) {
  const out = {};
  const has = (k) => b[k] !== undefined;

  if (!partial || has('name')) {
    out.name = String(b.name || '').trim().slice(0, 120);
    if (out.name.length < 2) throw httpError(400, 'Enter the product name.');
  }
  if (!partial || has('category')) {
    if (!cfg.categories.includes(b.category)) throw httpError(400, 'Choose a category.');
    out.category = b.category;
  }
  if (!partial || has('condition')) {
    if (!cfg.conditions.includes(b.condition)) throw httpError(400, 'Choose the condition.');
    out.condition = b.condition;
  }
  if (!partial || has('price')) {
    const n = Number(b.price);
    if (!Number.isInteger(n) || n < 1) throw httpError(400, 'Price must be a whole number in RWF, like 25000.');
    out.price = n;
  }
  if (has('discount')) {
    const n = b.discount === '' ? 0 : Number(b.discount);
    if (!Number.isInteger(n) || n < 0 || n > 90) throw httpError(400, 'Discount must be a whole number from 0 to 90.');
    out.discount = n;
  }
  if (!partial || has('stock')) {
    const n = Number(b.stock);
    if (!Number.isInteger(n) || n < 0) throw httpError(400, 'Stock must be a whole number (0 or more).');
    out.stock = n;
  }
  if (has('description')) out.description = String(b.description).trim().slice(0, 2000);
  if (has('featured')) out.featured = b.featured === true || b.featured === 'true' || b.featured === 'on';
  return out;
}

router.get('/products', wrap(async (req, res) => {
  const q = req.query;
  const filter = {};
  if (typeof q.q === 'string' && q.q.trim()) filter.name = rx(q.q);
  if (cfg.categories.includes(q.category)) filter.category = q.category;
  if (cfg.conditions.includes(q.condition)) filter.condition = q.condition;
  if (q.stock === 'in') filter.stock = { $gt: 3 };
  if (q.stock === 'low') filter.stock = { $gt: 0, $lte: 3 };
  if (q.stock === 'out') filter.stock = 0;

  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get('/products/:id', wrap(async (req, res) => {
  const p = validId(req.params.id) && (await Product.findById(req.params.id).lean());
  if (!p) throw httpError(404, 'Product not found.');
  res.json(p);
}));

router.post('/products', upload.array('images', 4), wrap(async (req, res) => {
  const data = parseProduct(req.body || {});
  const images = await saveImages(req.files || []);
  try {
    res.status(201).json(await Product.create({ ...data, images }));
  } catch (err) {
    await removeImages(images);
    throw err;
  }
}));

// Edit a product. Works for quick edits (JSON) and for the full form (multipart with photos).
router.patch('/products/:id', upload.array('images', 4), wrap(async (req, res) => {
  const doc = validId(req.params.id) && (await Product.findById(req.params.id));
  if (!doc) throw httpError(404, 'Product not found.');
  const body = req.body || {};
  const changes = parseProduct(body, true);

  let remove = [];
  if (body.removeImages) { try { remove = JSON.parse(body.removeImages); } catch { remove = []; } }
  remove = Array.isArray(remove) ? remove.filter((u) => doc.images.includes(u)) : [];
  const keep = doc.images.filter((u) => !remove.includes(u));
  const files = req.files || [];
  if (keep.length + files.length > 4) throw httpError(400, 'A product can have up to 4 photos.');

  const added = await saveImages(files);
  doc.set({ ...changes, images: [...keep, ...added] });
  try {
    await doc.save();
  } catch (err) {
    await removeImages(added);
    throw err;
  }
  await removeImages(remove);
  res.json(doc);
}));

router.delete('/products/:id', wrap(async (req, res) => {
  const p = validId(req.params.id) && (await Product.findByIdAndDelete(req.params.id));
  if (!p) throw httpError(404, 'Product not found.');
  await removeImages(p.images);
  res.json({ ok: true });
}));

router.post('/products/delete-many', wrap(async (req, res) => {
  const ids = (Array.isArray((req.body || {}).ids) ? req.body.ids : []).filter(validId).slice(0, 100);
  if (!ids.length) throw httpError(400, 'Choose at least one product.');
  const found = await Product.find({ _id: { $in: ids } }).select('images').lean();
  await Product.deleteMany({ _id: { $in: ids } });
  for (const p of found) await removeImages(p.images);
  res.json({ ok: true, deleted: found.length });
}));

/* ---------- Hero banners ---------- */
const okPath = (u) => /^\/(images|uploads)\/[A-Za-z0-9_\-./]+$/.test(u) && !u.includes('..');

function parseHero(b, partial = false) {
  const out = {};
  const has = (k) => b[k] !== undefined;
  if (!partial || has('title')) {
    out.title = String(b.title || '').trim().slice(0, 80);
    if (out.title.length < 2) throw httpError(400, 'Enter the banner title.');
  }
  if (has('badge')) out.badge = String(b.badge).trim().slice(0, 40);
  if (has('subtitle')) out.subtitle = String(b.subtitle).trim().slice(0, 200);
  if (has('buttonText')) out.buttonText = String(b.buttonText).trim().slice(0, 30) || 'Shop Now';
  if (has('link')) {
    const l = String(b.link).trim().slice(0, 200) || 'all';
    const ok = l === 'all' || l === 'deals' || (l.startsWith('cat:') && cfg.categories.includes(l.slice(4))) ||
      (l.startsWith('/') && !l.startsWith('//')) || /^https?:\/\//i.test(l);
    if (!ok) throw httpError(400, 'That button link is not valid.');
    out.link = l;
  }
  if (has('order')) {
    const n = Number(b.order);
    if (!Number.isInteger(n) || n < 0 || n > 999) throw httpError(400, 'Position must be a whole number from 0 to 999.');
    out.order = n;
  }
  if (has('active')) out.active = b.active === true || b.active === 'true' || b.active === 'on';
  return out;
}

// Lists image files you placed in public/images/ (for example in VS Code) so they can be chosen as banners.
router.get('/hero-files', wrap(async (req, res) => {
  const root = path.join(__dirname, '..', 'public', 'images');
  const out = [];
  async function walk(dir, rel, depth) {
    let entries = [];
    try { entries = await fs.readdir(dir, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
      if (e.isDirectory() && depth < 2) await walk(path.join(dir, e.name), rel + '/' + e.name, depth + 1);
      else if (/\.(png|jpe?g|webp|svg|gif)$/i.test(e.name)) out.push(rel + '/' + e.name);
    }
  }
  await walk(root, '/images', 0);
  res.json(out.sort());
}));

router.get('/hero', wrap(async (req, res) => {
  res.json(await Hero.find().sort({ order: 1, createdAt: 1 }).lean());
}));

// Image: upload a file (field "image") OR give a path of a file you placed in public/images/ (field "imageUrl").
router.post('/hero', upload.single('image'), wrap(async (req, res) => {
  const data = parseHero(req.body || {}, false);
  let image = '';
  let uploaded = [];
  if (req.file) { uploaded = await saveImages([req.file], { max: 1600, quality: 78 }); image = uploaded[0]; }
  else if ((req.body || {}).imageUrl) {
    if (!okPath(req.body.imageUrl)) throw httpError(400, 'The image path must start with /images/ or /uploads/.');
    image = req.body.imageUrl;
  } else throw httpError(400, 'Add a banner image.');
  try {
    res.status(201).json(await Hero.create({ ...data, image }));
  } catch (err) {
    await removeImages(uploaded);
    throw err;
  }
}));

router.patch('/hero/:id', upload.single('image'), wrap(async (req, res) => {
  const doc = validId(req.params.id) && (await Hero.findById(req.params.id));
  if (!doc) throw httpError(404, 'Banner not found.');
  const body = req.body || {};
  const changes = parseHero(body, true);

  let newImage = '';
  let uploaded = [];
  if (req.file) { uploaded = await saveImages([req.file], { max: 1600, quality: 78 }); newImage = uploaded[0]; }
  else if (body.imageUrl) {
    if (!okPath(body.imageUrl)) throw httpError(400, 'The image path must start with /images/ or /uploads/.');
    newImage = body.imageUrl;
  }
  const oldImage = doc.image;
  doc.set(changes);
  if (newImage) doc.image = newImage;
  try {
    await doc.save();
  } catch (err) {
    await removeImages(uploaded);
    throw err;
  }
  if (newImage && newImage !== oldImage) await removeImages([oldImage]);
  res.json(doc);
}));

router.delete('/hero/:id', wrap(async (req, res) => {
  const h = validId(req.params.id) && (await Hero.findByIdAndDelete(req.params.id));
  if (!h) throw httpError(404, 'Banner not found.');
  await removeImages([h.image]);
  res.json({ ok: true });
}));

/* ---------- Orders and deliveries ---------- */
router.get('/orders', wrap(async (req, res) => {
  const q = req.query;
  const filter = {};
  const statuses = String(q.status || '').split(',').filter((s) => cfg.orderStatuses.includes(s));
  if (statuses.length) filter.status = { $in: statuses };
  if (q.delivery === '1') filter.deliveryMethod = 'delivery';
  if (typeof q.q === 'string' && q.q.trim()) {
    const r = rx(q.q);
    filter.$or = [{ ref: r }, { 'customer.name': r }, { 'customer.phone': r }];
  }
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);
  res.json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.patch('/orders/:id', wrap(async (req, res) => {
  const order = validId(req.params.id) && (await Order.findById(req.params.id));
  if (!order) throw httpError(404, 'Order not found.');
  const { status } = req.body || {};
  if (!cfg.orderStatuses.includes(status)) throw httpError(400, 'Unknown status.');
  if (order.status === 'cancelled' && status !== 'cancelled') {
    throw httpError(400, 'A cancelled order cannot be reopened. Ask the customer to order again.');
  }
  // Cancelling puts the items back in stock.
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } });
  }
  order.status = status;
  await order.save();
  res.json(order);
}));

// Assign a delivery rider (moto driver). Marks the order "on the way".
router.patch('/orders/:id/driver', wrap(async (req, res) => {
  const order = validId(req.params.id) && (await Order.findById(req.params.id));
  if (!order) throw httpError(404, 'Order not found.');
  if (order.deliveryMethod !== 'delivery') throw httpError(400, 'This order is for pickup, so it needs no rider.');
  if (['delivered', 'cancelled'].includes(order.status)) throw httpError(400, 'This order is already closed.');
  const name = String((req.body || {}).name || '').trim().slice(0, 60);
  const phone = normalizePhone((req.body || {}).phone);
  if (name.length < 2) throw httpError(400, 'Enter the rider name.');
  if (!phone) throw httpError(400, 'Enter a valid Rwandan phone number for the rider.');
  order.driver = { name, phone };
  if (['new', 'confirmed'].includes(order.status)) order.status = 'shipped';
  await order.save();
  res.json(order);
}));

/* ---------- Customers (built from orders) ---------- */
router.get('/customers', wrap(async (req, res) => {
  const q = req.query;
  const match = {};
  if (typeof q.q === 'string' && q.q.trim()) { const r = rx(q.q); match.$or = [{ 'customer.name': r }, { 'customer.phone': r }]; }
  const limit = Math.min(100, Math.max(1, parseInt(q.limit, 10) || 10));
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  // Group the latest 5000 orders by phone number (plain code, works on any MongoDB-compatible server).
  const orders = await Order.find(match).sort({ createdAt: -1 }).limit(5000).select('customer total status createdAt').lean();
  const byPhone = new Map();
  for (const o of orders) {
    const phone = o.customer.phone;
    const c = byPhone.get(phone) || { phone, name: o.customer.name, district: o.customer.district, orders: 0, spent: 0, last: o.createdAt };
    c.orders += 1;
    if (o.status !== 'cancelled') c.spent += o.total || 0;
    byPhone.set(phone, c); // orders come newest first, so name/district/last are from the latest order
  }
  const all = [...byPhone.values()];
  const total = all.length;
  res.json({ items: all.slice((page - 1) * limit, page * limit), total, page, pages: Math.max(1, Math.ceil(total / limit)) });
}));

module.exports = router;
