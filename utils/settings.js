const Setting = require('../models/Setting');
const { httpError } = require('./http');

const intEnv = (v, d) => (Number.isInteger(parseInt(v, 10)) ? parseInt(v, 10) : d);

// Used until the admin saves their own values. .env values act as the first defaults.
function defaults() {
  const e = process.env;
  return {
    shopName: e.SHOP_NAME || 'ShopEasy',
    tagline: 'Better Products. Happier You.',
    about: '',
    announcement: '',
    address: 'Kigali, Rwanda',
    email: '',
    phone: '',
    whatsapp: String(e.WHATSAPP_NUMBER || '').replace(/\D/g, ''),
    freeDeliveryOver: intEnv(e.DELIVERY_FREE_OVER, 0),
    feeKigali: intEnv(e.DELIVERY_FEE_KIGALI, 1500),
    feeUpcountry: intEnv(e.DELIVERY_FEE_UPCOUNTRY, 3500),
    mtnCode: e.MTN_MOMO_CODE || '',
    mtnName: e.MTN_MOMO_NAME || '',
    airtelCode: e.AIRTEL_MONEY_CODE || '',
    airtelName: e.AIRTEL_MONEY_NAME || '',
  };
}

// key: [type, maxLength]   s = text, d = digits only, n = whole number
const FIELDS = {
  shopName: ['s', 60], tagline: ['s', 100], about: ['s', 600], announcement: ['s', 140], address: ['s', 140],
  email: ['s', 100], phone: ['s', 30], whatsapp: ['d', 15],
  mtnCode: ['s', 30], mtnName: ['s', 60], airtelCode: ['s', 30], airtelName: ['s', 60],
  freeDeliveryOver: ['n'], feeKigali: ['n'], feeUpcountry: ['n'],
};

function sanitize(input = {}) {
  const out = {};
  for (const [key, [type, max]] of Object.entries(FIELDS)) {
    if (input[key] === undefined) continue;
    const v = input[key];
    if (type === 's') out[key] = String(v).trim().slice(0, max);
    else if (type === 'd') out[key] = String(v).replace(/\D/g, '').slice(0, max);
    else {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 0 || n > 10000000) throw httpError(400, 'Fees and amounts must be whole numbers (0 or more).');
      out[key] = n;
    }
  }
  if (out.shopName !== undefined && out.shopName.length < 2) throw httpError(400, 'Enter a shop name.');
  return out;
}

let cache = null;

async function getSettings() {
  if (cache) return cache;
  const doc = await Setting.findOne({ key: 'main' }).lean();
  const saved = {};
  for (const k of Object.keys(FIELDS)) if (doc && doc[k] !== undefined && doc[k] !== null) saved[k] = doc[k];
  cache = { ...defaults(), ...saved };
  return cache;
}

async function saveSettings(input) {
  const clean = sanitize(input);
  await Setting.findOneAndUpdate({ key: 'main' }, { $set: clean }, { upsert: true });
  cache = null;
  return getSettings();
}

module.exports = { getSettings, saveSettings, sanitize };
