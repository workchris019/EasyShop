# EasyShop

# ShopEasy: online shop for Rwanda

Node.js + Express + MongoDB. A multi-page storefront (phone and laptop layouts) and a multi-page admin panel.
No frontend framework and no web fonts, so pages stay small on mobile data.

## Run it

```bash
npm install
cp .env.example .env      # open .env and set MONGODB_URI, JWT_SECRET, ADMIN_PASSWORD
npm run seed              # optional: sample products and 3 slideshow banners
npm run dev
```

Shop: http://localhost:3000   Admin: http://localhost:3000/admin (signs you in at /admin-login.html)

## Files (open the folder in VS Code)

```
server.js, config.js            server and fixed lists (categories, districts)
models/ routes/ middleware/ utils/   database models and the API
scripts/seed.js                 sample data
uploads/                        photos uploaded from the admin (created automatically)
public/                         everything the browser loads
  index.html  shop.html  product.html  cart.html  checkout.html
  order-confirmed.html  wishlist.html  track.html  about.html  contact.html  404.html
  admin-login.html  admin.html (dashboard)  admin-products.html  admin-product-form.html
  admin-orders.html  admin-deliveries.html  admin-customers.html  admin-hero.html
  admin-reports.html  admin-settings.html
  css/store.css  css/admin.css
  js/common.js (header, cart, hearts)  js/<page>.js  js/admin-common.js  js/admin-<page>.js
  js/i18n.js                    English / Kinyarwanda / French texts
  images/hero/                  put your own banner pictures here
```

## Slideshow (hero banners)

Admin > **Hero banners**: add, edit, reorder, hide or delete slides. Each slide has a small label, title, description, button text and where the button goes (all products, deals, a category, or any link).
Two ways to add the picture:
1. **Upload** it in the form (resized automatically), or
2. **Put the file in `public/images/hero/` in VS Code**, reload the admin page, and choose it from the list ("Use a file from my project").

## Discounts and hearts

- Admin > Products > Add/Edit: set **Discount (%)**. Customers see the red `-15%` badge, the old price crossed out, and a "Hot Deals" section and Deals page.
- The heart on every product saves it to the customer's **Wishlist** (kept on their phone) and counts as a like. You see the likes per product in the products table.

## Made for Rwanda

RWF prices, MTN MoMo / Airtel Money codes at checkout, pay on delivery in Kigali, WhatsApp order button, rider (moto) assignment, all 30 districts, free delivery over an amount, EN / RW / FR. Please have a native speaker review the Kinyarwanda and French in `public/js/i18n.js`.

Shop name, contact details, fees and Mobile Money codes are edited in Admin > **Settings** (no code needed).

## Going live

Run with `pm2 start server.js`, put Caddy or Nginx in front for HTTPS, set `NODE_ENV=production`, use MongoDB Atlas or a MongoDB on the server with backups (also back up `uploads/`), and use a strong `JWT_SECRET` and admin password.

Automatic MoMo payment confirmation needs the MTN MoMo API (merchant onboarding). Today you confirm payments in the admin.
