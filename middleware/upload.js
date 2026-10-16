const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const upload = multer({
  storage: multer.memoryStorage(),
  // Phone cameras often produce 4-10 MB photos, so allow big uploads...
  limits: { fileSize: 12 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    const err = new Error('Only JPG, PNG or WebP photos are allowed.');
    err.status = 400;
    cb(err);
  },
});

// ...then shrink them. A 6 MB photo becomes roughly 50-150 KB, which loads
// fast on mobile data and saves customers money.
// opts.max = longest side in px, opts.quality = WebP quality.
async function saveImages(files = [], opts = {}) {
  const max = opts.max || 900;
  const quality = opts.quality || 72;
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const urls = [];
  for (const file of files) {
    const name = crypto.randomBytes(8).toString('hex') + '.webp';
    await sharp(file.buffer)
      .rotate() // respect phone camera orientation
      .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toFile(path.join(UPLOAD_DIR, name));
    urls.push('/uploads/' + name);
  }
  return urls;
}

async function removeImages(urls = []) {
  for (const url of urls) {
    if (!String(url).startsWith('/uploads/')) continue; // never touch files from public/images
    // basename() stops any path trickery; we only ever delete inside uploads/
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
  }
}

module.exports = { upload, saveImages, removeImages, UPLOAD_DIR };
