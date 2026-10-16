// Fixed lists used by both the server and the pages. Editable settings
// (shop name, fees, MoMo codes...) live in the admin panel under Settings.
const kigali = ['Gasabo', 'Kicukiro', 'Nyarugenge'];

const upcountry = [
  // Northern
  'Burera', 'Gakenke', 'Gicumbi', 'Musanze', 'Rulindo',
  // Southern
  'Gisagara', 'Huye', 'Kamonyi', 'Muhanga', 'Nyamagabe', 'Nyanza', 'Nyaruguru', 'Ruhango',
  // Eastern
  'Bugesera', 'Gatsibo', 'Kayonza', 'Kirehe', 'Ngoma', 'Nyagatare', 'Rwamagana',
  // Western
  'Karongi', 'Ngororero', 'Nyabihu', 'Nyamasheke', 'Rubavu', 'Rusizi', 'Rutsiro',
];

module.exports = {
  categories: ['phones', 'electronics', 'clothes', 'shoes', 'home', 'beauty', 'baby', 'other'],
  conditions: ['new', 'like-new', 'used'],
  kigaliDistricts: kigali,
  upcountryDistricts: upcountry,
  districts: [...kigali, ...upcountry],
  paymentMethods: ['mtn', 'airtel', 'cod'],
  orderStatuses: ['new', 'confirmed', 'shipped', 'delivered', 'cancelled'],
};
