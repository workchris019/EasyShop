const { Schema, model } = require('mongoose');
const cfg = require('../config');

const orderSchema = new Schema(
  {
    ref: { type: String, unique: true, index: true },
    // Snapshot of each item at the time of purchase, so later edits or
    // deletions of a product never change past orders.
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        price: Number, // price paid per item (after discount)
        qty: Number,
        image: String,
      },
    ],
    customer: {
      name: String,
      phone: String, // stored as 2507XXXXXXXX
      district: String,
      address: String,
    },
    deliveryMethod: { type: String, enum: ['delivery', 'pickup'], required: true },
    payment: {
      method: { type: String, enum: cfg.paymentMethods, required: true },
      reference: { type: String, default: '' },
    },
    driver: { name: String, phone: String },
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    status: { type: String, enum: cfg.orderStatuses, default: 'new', index: true },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'customer.phone': 1 });

module.exports = model('Order', orderSchema);
