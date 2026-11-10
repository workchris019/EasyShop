const { Schema, model } = require('mongoose');

// One support chat between a customer (identified by a private random id kept in their browser) and the admin.
const conversationSchema = new Schema(
  {
    cid: { type: String, required: true, unique: true },
    name: { type: String, trim: true, maxlength: 80, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' }, // 2507XXXXXXXX when the customer gave one
    messages: [
      {
        from: { type: String, enum: ['customer', 'admin'], required: true },
        text: { type: String, required: true, maxlength: 1000 },
        at: { type: Date, default: Date.now },
      },
    ],
    unreadAdmin: { type: Number, default: 0 }, // customer messages the admin has not opened yet
    unreadCustomer: { type: Number, default: 0 }, // admin replies the customer has not seen yet
    lastAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = model('Conversation', conversationSchema);
