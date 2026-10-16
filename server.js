require('dotenv').config(); // must run before config.js is loaded

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./models/Admin');
const { UPLOAD_DIR } = require('./middleware/upload');

for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}
if (process.env.JWT_SECRET.length < 24) {
  console.error('JWT_SECRET is too short. Use a long random string (see .env.example).');
  process.exit(1);
}

const isProd = process.env.NODE_ENV === 'production';
const app = express();

app.set('trust proxy', 1); // correct client IPs behind Nginx / Caddy / Cloudflare

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'"],
        'style-src': ["'self'"],
        'img-src': ["'self'", 'data:', 'blob:'],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': isProd ? [] : null,
      },
    },
  })
);

// Gzip every text response. Smaller pages mean cheaper, faster browsing on mobile data.
app.use(compression());
app.use(express.json({ limit: '50kb' }));
app.use(cookieParser());

// Product photos never change once saved, so browsers can keep them for a long time.
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: isProd ? '1h' : 0, index: 'index.html' }));

// The admin panel is one page: public/admin.html
app.get(['/admin', '/admin/'], (req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 240, standardHeaders: true, legacyHeaders: false }));
app.use('/api', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((req, res) => res.status(404).sendFile(path.join(__dirname, 'public', '404.html')));

// Central error handler: always reply with { error: "plain message" }.
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That photo is too large (max 12 MB).' : 'Upload problem: ' + err.message;
    return res.status(400).json({ error: msg });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Bad request.' });
  if (err.name === 'ValidationError') return res.status(400).json({ error: Object.values(err.errors)[0].message });

  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Something went wrong. Please try again.' : err.message });
});

async function seedAdmin() {
  if (await Admin.countDocuments()) return;
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.error('Set ADMIN_PASSWORD (8 or more characters) in .env to create the first admin.');
    process.exit(1);
  }
  const username = (process.env.ADMIN_USER || 'admin').trim().toLowerCase();
  await Admin.create({ username, passwordHash: await bcrypt.hash(password, 12) });
  console.log(`Admin account "${username}" created. You can now remove ADMIN_PASSWORD from .env.`);
}

const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(seedAdmin)
  .then(() => app.listen(port, () => console.log(`Shop running at http://localhost:${port}  (admin: /admin/)`)))
  .catch((err) => {
    console.error('Could not start:', err.message);
    process.exit(1);
  });
