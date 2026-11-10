const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const media = require('../utils/media');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads'); // old pictures may still be here; new ones go to the database
const IMAGE_MAX = 12 * 1024 * 1024;
const VIDEO_MAX = 25 * 1024 * 1024;

const bad = (msg) => Object.assign(new Error(msg), { status: 400 });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VIDEO_MAX, files: 6 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      if (/^video\/(mp4|webm)$/.test(file.mimetype)) return cb(null, true);
      return cb(bad('The video must be an MP4 or WebM file.'));
    }
    if (/^image\/(jpeg|png|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(bad('Only JPG, PNG or WebP photos are allowed.'));
  },
});

// Phone cameras often produce 4-10 MB photos, so allow big uploads, then shrink them.
// opts.max = longest side in px, opts.quality = WebP quality.
async function saveImages(files = [], opts = {}) {
  const max = opts.max || 900;
  const quality = opts.quality || 72;
  const urls = [];
  try {
    for (const file of files) {
      if (file.size > IMAGE_MAX) throw bad('That photo is too large (max 12 MB).');
      const name = crypto.randomBytes(8).toString('hex') + '.webp';
      const buffer = await sharp(file.buffer)
        .rotate() // respect phone camera orientation
        .resize({ width: max, height: max, fit: 'inside', withoutEnlargement: true })
        .webp({ quality })
        .toBuffer();
      await media.put(name, buffer, 'image/webp');
      urls.push('/uploads/' + name);
    }
  } catch (err) {
    await removeImages(urls);
    throw err;
  }
  return urls;
}

async function saveVideo(file) {
  if (!file) return '';
  const ext = file.mimetype === 'video/webm' ? '.webm' : '.mp4';
  const name = crypto.randomBytes(8).toString('hex') + ext;
  await media.put(name, file.buffer, file.mimetype);
  return '/uploads/' + name;
}

// Removes files from the database (and from the old uploads/ folder if they were still there).
async function removeImages(urls = []) {
  for (const url of urls) {
    if (!String(url).startsWith('/uploads/')) continue; // never touch files from public/images
    const name = path.basename(url); // basename() stops any path trickery
    await media.remove(name).catch(() => {});
    await fs.unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
  }
}

module.exports = { upload, saveImages, saveVideo, removeImages, UPLOAD_DIR };
