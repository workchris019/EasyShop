// Customer side of support chat and announcements. The customer is identified by `cid`,
// a long random id created in their browser, so nobody can read another person's chat.
const express = require('express');
const rateLimit = require('express-rate-limit');

const Conversation = require('../models/Conversation');
const Announcement = require('../models/Announcement');
const { normalizePhone } = require('../utils/phone');
const { wrap, httpError } = require('../utils/http');

const router = express.Router();
const limiter = (max, windowMs, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { error: message } });

const CID = /^[a-f0-9]{24,64}$/;
const cidOf = (v) => {
  const cid = String(v || '').toLowerCase();
  if (!CID.test(cid)) throw httpError(400, 'Something went wrong. Please refresh the page.');
  return cid;
};

// The customer sends a message. The chat is created on the first one.
router.post('/support/send', limiter(40, 15 * 60 * 1000, 'Too many messages. Please wait a few minutes.'), wrap(async (req, res) => {
  const b = req.body || {};
  const cid = cidOf(b.cid);
  const text = String(b.text || '').trim().slice(0, 1000);
  if (!text) throw httpError(400, 'Write your message first.');

  const set = { lastAt: new Date() };
  const name = String(b.name || '').trim().slice(0, 80);
  if (name) set.name = name;
  if (b.phone) {
    const phone = normalizePhone(b.phone);
    if (!phone) throw httpError(400, 'Enter a valid Rwandan phone number, or leave it empty.');
    set.phone = phone;
  }
  const existing = await Conversation.findOne({ cid }).select('name').lean();
  if (!existing && !name) throw httpError(400, 'Enter your name so we know who we are talking to.');

  await Conversation.updateOne(
    { cid },
    {
      $set: set,
      $inc: { unreadAdmin: 1 },
      $push: { messages: { $each: [{ from: 'customer', text, at: new Date() }], $slice: -300 } },
      $setOnInsert: { cid },
    },
    { upsert: true }
  );
  res.status(201).json({ ok: true });
}));

// The customer opens the chat (or the page checks for new replies). `read=1` marks admin replies as seen.
router.get('/support/thread', limiter(600, 15 * 60 * 1000, 'Too many requests.'), wrap(async (req, res) => {
  const cid = cidOf(req.query.cid);
  const c = await Conversation.findOne({ cid }).lean();
  if (!c) return res.json({ name: '', phone: '', messages: [], unread: 0 });
  if (req.query.read === '1' && c.unreadCustomer) await Conversation.updateOne({ cid }, { $set: { unreadCustomer: 0 } });
  res.json({
    name: c.name, phone: c.phone, unread: req.query.read === '1' ? 0 : c.unreadCustomer,
    messages: c.messages.map((m) => ({ from: m.from, text: m.text, at: m.at })),
  });
}));

// Messages for the website: to everyone, or to this customer (by chat id or phone number).
router.get('/announcements', limiter(300, 15 * 60 * 1000, 'Too many requests.'), wrap(async (req, res) => {
  const or = [{ 'target.type': 'all' }];
  if (CID.test(String(req.query.cid || '').toLowerCase())) or.push({ 'target.type': 'customer', 'target.cid': String(req.query.cid).toLowerCase() });
  const phone = normalizePhone(req.query.phone);
  if (phone) or.push({ 'target.type': 'customer', 'target.phone': phone });
  const list = await Announcement.find({ active: true, $or: or }).sort({ createdAt: -1 }).limit(5).lean();
  res.json(list.map((a) => ({ id: String(a._id), text: a.text, personal: a.target.type === 'customer', at: a.createdAt })));
}));

module.exports = router;
