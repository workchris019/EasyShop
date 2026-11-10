const Category = require('../models/Category');
const cfg = require('../config');

const DEFAULTS = {
  phones: ['Phones', '📱'], electronics: ['Electronics', '🎧'], clothes: ['Clothes', '👕'], shoes: ['Shoes', '👟'],
  home: ['Home & Kitchen', '🏠'], beauty: ['Beauty', '💄'], baby: ['Baby & Kids', '🧸'], other: ['Other', '✨'],
};

let cache = null;

// Creates the starting categories the first time the shop runs.
async function seedCategories() {
  if (await Category.countDocuments()) return;
  await Category.insertMany(cfg.categories.map((key, i) => ({
    key, label: DEFAULTS[key][0], icon: DEFAULTS[key][1], image: '/images/categories/' + key + '.svg', order: i + 1,
  })));
}

async function getCategories() {
  if (!cache) cache = await Category.find().sort({ order: 1, createdAt: 1 }).lean();
  return cache;
}
const clearCategories = () => { cache = null; };
const categoryKeys = async () => (await getCategories()).map((c) => c.key);

module.exports = { seedCategories, getCategories, clearCategories, categoryKeys };
