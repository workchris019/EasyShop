// Adds sample products and three homepage banners so you can see the shop working.
// Run once with: npm run seed   (edit or delete everything later in the admin panel)
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Hero = require('../models/Hero');

const products = [
  { name: 'Samsung Galaxy A14 (64GB)', category: 'phones', condition: 'like-new', price: 210000, discount: 12, stock: 3, featured: true, description: 'Checked and working. Comes with charger and case.' },
  { name: 'Bluetooth speaker, waterproof', category: 'electronics', condition: 'new', price: 24000, discount: 25, stock: 10, featured: true, description: 'Loud, clear sound. About 8 hours of battery.' },
  { name: "Men's denim jacket", category: 'clothes', condition: 'used', price: 12000, stock: 2, featured: true, description: 'Size L. Good condition, no tears.' },
  { name: 'Sports sneakers, size 42', category: 'shoes', condition: 'like-new', price: 25000, discount: 10, stock: 4, featured: true, description: 'Worn twice. Very clean.' },
  { name: 'Non-stick pan set (3 pieces)', category: 'home', condition: 'new', price: 35000, discount: 20, stock: 6, featured: true, description: 'Works on gas, charcoal and electric cookers.' },
  { name: 'Foldable baby stroller', category: 'baby', condition: 'used', price: 45000, stock: 1, description: 'Sturdy frame, washable seat, folds flat for the car.' },
  { name: 'Wireless headphones', category: 'electronics', condition: 'new', price: 60000, discount: 15, stock: 8, description: 'Over-ear, foldable, long battery life.' },
  { name: 'Face cream set', category: 'beauty', condition: 'new', price: 18000, stock: 12, description: 'Day and night cream, sealed.' },
];

const heroes = [
  { badge: 'Special Offer', title: 'Upgrade Your Lifestyle', subtitle: 'Discover amazing products, fair prices and delivery across Rwanda.', buttonText: 'Shop Now', link: 'all', image: '/images/hero/hero-1.svg', order: 1 },
  { badge: 'New Arrivals', title: 'Fresh Finds Every Week', subtitle: 'Phones, clothes and home goods, checked and ready to ship.', buttonText: 'See What\'s New', link: 'all', image: '/images/hero/hero-2.svg', order: 2 },
  { badge: 'Hot Deals', title: 'Save More, Smile More', subtitle: 'Discounted items while stock lasts.', buttonText: 'View Deals', link: 'deals', image: '/images/hero/hero-3.svg', order: 3 },
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  if (await Product.countDocuments()) console.log('Products already exist. None added.');
  else { await Product.create(products); console.log(`Added ${products.length} sample products.`); }
  if (await Hero.countDocuments()) console.log('Banners already exist. None added.');
  else { await Hero.create(heroes); console.log(`Added ${heroes.length} homepage banners.`); }
  await mongoose.disconnect();
})().catch((err) => { console.error(err.message); process.exit(1); });
