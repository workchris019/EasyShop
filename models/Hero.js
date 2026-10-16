const { Schema, model } = require('mongoose');

// One slide of the homepage banner carousel. Managed in Admin > Hero banners.
const heroSchema = new Schema(
  {
    badge: { type: String, trim: true, maxlength: 40, default: '' },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    subtitle: { type: String, trim: true, maxlength: 200, default: '' },
    buttonText: { type: String, trim: true, maxlength: 30, default: 'Shop Now' },
    // 'all', 'deals', 'cat:phones', a path like '/about', or a full https:// link
    link: { type: String, trim: true, maxlength: 200, default: 'all' },
    image: { type: String, default: '' }, // /uploads/xxx.webp or /images/hero/xxx.jpg
    order: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Hero', heroSchema);
