const { Schema, model } = require('mongoose');
const cfg = require('../config');

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: cfg.categories, required: true },
    condition: { type: String, enum: cfg.conditions, default: 'new' },
    // price = normal price, discount = percent off (0-90), salePrice = what the customer pays.
    // All in whole Rwandan francs.
    price: {
      type: Number, required: true, min: 1,
      validate: { validator: Number.isInteger, message: 'Price must be a whole number' },
    },
    discount: { type: Number, default: 0, min: 0, max: 90, validate: { validator: Number.isInteger, message: 'Discount must be a whole number' } },
    salePrice: { type: Number, index: true },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    images: [String],
    stock: { type: Number, min: 0, default: 1 },
    featured: { type: Boolean, default: false },
    likes: { type: Number, default: 0, min: 0 },
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Always keep salePrice in step with price and discount.
productSchema.pre('validate', function (next) {
  this.salePrice = Math.round((this.price * (100 - (this.discount || 0))) / 100);
  next();
});

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ featured: -1, createdAt: -1 });

module.exports = model('Product', productSchema);
