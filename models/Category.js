const { Schema, model } = require('mongoose');

// A product category. Managed in Admin > Categories. The picture is shown on the home page tiles.
const categorySchema = new Schema(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[a-z0-9-]{1,40}$/ },
    label: { type: String, required: true, trim: true, maxlength: 30 },
    icon: { type: String, trim: true, maxlength: 8, default: '' }, // small emoji, used only if there is no picture
    image: { type: String, default: '' }, // /uploads/xxx.webp or /images/categories/xxx.svg
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = model('Category', categorySchema);
