const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Case-insensitive "contains" regex from user text (safe against regex injection).
const rx = (s) => new RegExp(escapeRegex(String(s).trim().slice(0, 60)), 'i');

module.exports = { escapeRegex, rx };
