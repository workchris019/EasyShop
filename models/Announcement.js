const { Schema, model } = require('mongoose');

// A message from the admin shown on the website: to everyone, or to one customer.
const announcementSchema = new Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 300 },
    target: {
      type: { type: String, enum: ['all', 'customer'], default: 'all' },
      cid: { type: String, default: '' }, // a customer who used support chat
      phone: { type: String, default: '' }, // or a customer's phone number (2507XXXXXXXX)
      name: { type: String, default: '' }, // for display in the admin list only
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = model('Announcement', announcementSchema);
