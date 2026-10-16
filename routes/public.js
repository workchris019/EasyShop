const crypto = require('crypto');
const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const cfg = require('../config');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Hero = require('../models/Hero');
const { getSettings } = require('../utils/settings');
const { shapeProduct } = require('../utils/shape');
const { rx } = require('../utils/text');
const { normalizePhone } = require('../utils/phone');
const { wrap, httpError } = require('../utils/http');

const router = express.Router();
const limiter = (max, windowMs, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message } });

/* ---------- Shop settings (safe to expose) ---------- */
router.get('/config', wrap(async (req, res) => {
  const s = await getSettings();
  res.json({
    shopName: s.shopName, tagline: s.tagline, about: s.about, announcement: s.announcement,
    address: s.address, email: s.email, phone: s.phone, whatsapp: s.whatsapp,
    freeDeliveryOver: s.freeDeliveryOver,
    categories: cfg.categories, conditions: cfg.conditions, orderStatuses: cfg.orderStatuses,
    kigali: cfg.kigaliDistricts, upcountry: cfg.upcountryDistricts,
    fees: { kigali: s.feeKigali, upcountry: s.feeUpcountry },
    payments: {
      mtn: { code: s.mtnCode, name: s.mtnName },
      airtel: { code: s.airtelCode, name: s.airtelName },
    },
  });
}));

/* ---------- Homepage banner slides ---------- */
router.get('/hero', wrap(async (req, res) => {
  const slides = await Hero.find({ active: true, image: { $ne: '' } }).sort({ order: 1, createdAt: 1 }).limit(10).lean();
  res.json(slides);
}));

/* ---------- Products ---------- */
router.get('/categories', wrap(async (req, res) => {
  const rows = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }]);
  res.json(Object.fromEntries(rows.map((r) => [r._id, r.n])));
}));

const SORTS = {
  featured: { featured: -1, createdAt: -1 },
  new: { createdAt: -1 },
  'price-asc': { salePrice: 1 },
  'price-desc': { salePrice: -1 },
  discount: { discount: -1, createdAt: -1 },
};

router.get('/products', wrap(async (req, res) => {
  const q = req.query;

  // ?ids=a,b,c  (used by the saved-items list and by the cart to refresh prices)
  if (typeof q.ids === 'string') {
    const ids = q.ids.split(',').filter((id) => mongoose.isValidObjectId(id)).slice(0, 40);
    const items = await Product.find({ _id: { $in: ids } }).lean();
    return res.json({ items: items.map(shapeProduct), total: items.length, pages: 1 });
  }

  const filter = {};
  if (typeof q.category === 'string' && cfg.categories.includes(q.category)) filter.category = q.category;
  if (typeof q.condition === 'string' && cfg.conditions.includes(q.condition)) filter.condition = q.condition;
  if (q.deals === '1') filter.discount = { $gt: 0 };
  if (q.featured === '1') filter.featured = true;
  if (typeof q.q === 'string' && q.q.trim()) filter.name = rx(q.q);

  const sort = { ...(SORTS[q.sort] || SORTS.featured), _id: -1 };
  const limit = Math.min(40, Math.max(1, parseInt(q.limit, 10) || 12));
  const page = Math.max(1, parseInt(q.page, 10) || 1);

  const [items, total] = await Promise.all([
    Product.find(filter).sort(sort).skip((page - 1) * limit).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ items: items.map(shapeProduct), total, pages: Math.max(1, Math.ceil(total / limit)) });
}));

router.get('/products/:id', wrap(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found.');
  const p = await Product.findById(req.params.id).lean();
  if (!p) throw httpError(404, 'Product not found.');
  res.json(shapeProduct(p));
}));

router.post('/products/:id/rate',
  limiter(30, 60 * 60 * 1000, 'Too many ratings from this connection. Please try again later.'),
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found.');
    const stars = parseInt((req.body || {}).stars, 10);
    if (!(stars >= 1 && stars <= 5)) throw httpError(400, 'Choose 1 to 5 stars.');
    const p = await Product.findByIdAndUpdate(req.params.id, { $inc: { ratingSum: stars, ratingCount: 1 } }, { new: true }).lean();
    if (!p) throw httpError(404, 'Product not found.');
    const { rating, ratingCount } = shapeProduct(p);
    res.json({ rating, ratingCount });
  }));

// Heart button: counts how many people saved a product (shown to the admin).
router.post('/products/:id/like',
  limiter(120, 60 * 60 * 1000, 'Too many requests. Please try again later.'),
  wrap(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw httpError(404, 'Product not found.');
    const on = (req.body || {}).on !== false;
    const filter = on ? { _id: req.params.id } : { _id: req.params.id, likes: { $gt: 0 } };
    const p = await Product.findOneAndUpdate(filter, { $inc: { likes: on ? 1 : -1 } }, { new: true }).lean();
    res.json({ likes: p ? p.likes : 0 });
  }));

/* ---------- Orders ---------- */
function newOrderRef() {
  return 'IS' + Date.now().toString(36).toUpperCase().slice(-5) + crypto.randomBytes(2).toString('hex').toUpperCase();
}

router.post('/orders',
  // Generous enough that many customers sharing one mobile-network IP are not blocked.
  limiter(30, 15 * 60 * 1000, 'Too many orders from this connection. Please wait a few minutes.'),
  wrap(async (req, res) => {
    const body = req.body || {};
    const items = body.items;
    const customer = body.customer || {};
    const payment = body.payment || {};
    const deliveryMethod = body.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

    if (!Array.isArray(items) || items.length === 0 || items.length > 30) throw httpError(400, 'Your cart is empty.');

    const name = String(customer.name || '').trim().slice(0, 80);
    if (name.length < 2) throw httpError(400, 'Enter your name.');

    const phone = normalizePhone(customer.phone);
    if (!phone) throw httpError(400, 'Enter a valid Rwandan phone number, for example 0788 123 456.');

    let district = '';
    let address = '';
    if (deliveryMethod === 'delivery') {
      district = String(customer.district || '');
      if (!cfg.districts.includes(district)) throw httpError(400, 'Choose your district.');
      address = String(customer.address || '').trim().slice(0, 200);
      if (address.length < 3) throw httpError(400, 'Add your neighbourhood, street or a landmark.');
    }

    const method = payment.method;
    if (!cfg.paymentMethods.includes(method)) throw httpError(400, 'Choose how you will pay.');

    const inKigali = cfg.kigaliDistricts.includes(district);
    if (method === 'cod' && deliveryMethod === 'delivery' && !inKigali) {
      throw httpError(400, 'Pay on delivery is only available in Kigali. Please pay with Mobile Money.');
    }

    // Merge duplicate lines and validate quantities.
    const qtyById = new Map();
    for (const it of items) {
      const id = String(it && it.id);
      const qty = parseInt(it && it.qty, 10);
      if (!mongoose.isValidObjectId(id) || !(qty >= 1 && qty <= 20)) {
        throw httpError(400, 'Something is wrong with your cart. Please refresh the page.');
      }
      qtyById.set(id, (qtyById.get(id) || 0) + qty);
    }

    // Prices always come from the database, never from the browser.
    const products = await Product.find({ _id: { $in: [...qtyById.keys()] } });
    if (products.length !== qtyById.size) throw httpError(409, 'Some items in your cart are no longer available.');

    // Reserve stock one product at a time. The condition on `stock` makes each
    // step atomic, so two customers can never buy the last item together.
    const reserved = [];
    try {
      for (const p of products) {
        const qty = qtyById.get(String(p._id));
        const result = await Product.updateOne({ _id: p._id, stock: { $gte: qty } }, { $inc: { stock: -qty } });
        if (result.modifiedCount !== 1) {
          const fresh = await Product.findById(p._id).select('stock').lean();
          const left = Math.max(0, (fresh && fresh.stock) || 0);
          throw httpError(409, left === 0 ? `${p.name} just sold out.` : `${p.name}: only ${left} left.`);
        }
        reserved.push({ id: p._id, qty });
      }

      const lines = products.map((p) => ({
        product: p._id, name: p.name, price: p.salePrice, qty: qtyById.get(String(p._id)), image: (p.images && p.images[0]) || '',
      }));
      const subtotal = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

      const s = await getSettings();
      let deliveryFee = deliveryMethod === 'pickup' ? 0 : inKigali ? s.feeKigali : s.feeUpcountry;
      if (deliveryMethod === 'delivery' && inKigali && s.freeDeliveryOver > 0 && subtotal >= s.freeDeliveryOver) deliveryFee = 0;

      const order = await Order.create({
        ref: newOrderRef(),
        items: lines,
        customer: { name, phone, district, address },
        deliveryMethod,
        payment: { method, reference: String(payment.reference || '').trim().slice(0, 40) },
        subtotal, deliveryFee, total: subtotal + deliveryFee,
      });

      res.status(201).json({
        ref: order.ref,
        items: lines.map(({ name: n, price, qty }) => ({ name: n, price, qty })),
        customer: order.customer, deliveryMethod, payment: order.payment,
        subtotal, deliveryFee, total: order.total,
      });
    } catch (err) {
      // Put reserved stock back if anything failed.
      for (const r of reserved) await Product.updateOne({ _id: r.id }, { $inc: { stock: r.qty } }).catch(() => {});
      throw err;
    }
  }));

// Customers check where their order is with order number + phone number.
router.get('/orders/track',
  limiter(30, 15 * 60 * 1000, 'Too many lookups. Please wait a few minutes.'),
  wrap(async (req, res) => {
    const ref = String(req.query.ref || '').trim().toUpperCase();
    const phone = normalizePhone(req.query.phone);
    if (!ref || !phone) throw httpError(400, 'Enter your order number and the phone number you ordered with.');
    const o = await Order.findOne({ ref, 'customer.phone': phone }).lean();
    if (!o) throw httpError(404, 'We could not find that order. Check the order number and phone number.');
    res.json({
      ref: o.ref, status: o.status, createdAt: o.createdAt, deliveryMethod: o.deliveryMethod, district: o.customer.district,
      items: o.items.map(({ name, qty, price, image }) => ({ name, qty, price, image })),
      subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total, payment: o.payment.method,
      driver: o.status === 'shipped' && o.driver && o.driver.name ? { name: o.driver.name, phone: o.driver.phone } : null,
    });
  }));

module.exports = router;
