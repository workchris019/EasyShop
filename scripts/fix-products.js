// Repairs products saved before discounts existed. Safe to run more than once.
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const all = await Product.find();
  let fixed = 0;
  for (const p of all) {
    if (!Number.isFinite(p.price) || p.price < 1) {
      console.log('NO VALID PRICE (delete or edit in the admin):', p._id.toString(), p.name);
      continue;
    }
    p.discount = p.discount || 0;
    p.likes = p.likes || 0;
    p.markModified('salePrice'); // recalculated automatically on save
    await p.save();
    fixed++;
  }
  console.log('Fixed ' + fixed + ' of ' + all.length + ' products.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });