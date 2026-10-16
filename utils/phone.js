// Accepts 0788123456, 788123456, 250788123456, +250 788 123 456, 0788-123-456.
// Rwandan mobile numbers start with 072, 073 (Airtel) or 078, 079 (MTN).
// Returns 2507XXXXXXXX or null if the number is not valid.
function normalizePhone(input) {
  const digits = String(input || '').replace(/[\s\-().]/g, '');
  const match = digits.match(/^(?:\+?250|0)?(7[2389]\d{7})$/);
  return match ? '250' + match[1] : null;
}

module.exports = { normalizePhone };
