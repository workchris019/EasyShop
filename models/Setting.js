const { Schema, model } = require('mongoose');

// A single document holding the shop settings edited in Admin > Settings.
// Allowed keys are whitelisted in utils/settings.js.
module.exports = model('Setting', new Schema({ key: { type: String, default: 'main', unique: true } }, { strict: false, timestamps: true }));
