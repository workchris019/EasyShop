// Stores uploaded photos and videos in MongoDB (GridFS) instead of the server's disk.
// Why: a disk can be wiped or may not be shared between servers, which made pictures vanish on other
// devices. In the database they always travel with your products. They are still served at /uploads/<name>.
const path = require('path');
const fs = require('fs/promises');
const mongoose = require('mongoose');

let bucket = null;
const getBucket = () => {
  if (!bucket) bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'media' });
  return bucket;
};

const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };

async function find(name) {
  const [file] = await getBucket().find({ filename: name }).limit(1).toArray();
  return file || null;
}

function put(name, buffer, contentType) {
  return new Promise((resolve, reject) => {
    const up = getBucket().openUploadStream(name, { contentType });
    up.on('error', reject);
    up.on('finish', () => resolve(name));
    up.end(buffer);
  });
}

async function remove(name) {
  const file = await find(name);
  if (file) await getBucket().delete(file._id).catch(() => {});
}

// Express handler for GET /uploads/:name. Supports Range requests, which phones need to play videos.
async function serve(req, res, next) {
  try {
    const name = req.params.name;
    if (name !== path.basename(name)) return next();
    const file = await find(name);
    if (!file) return next(); // not in the database: let the old disk folder try
    const size = file.length;
    res.set({
      'Content-Type': file.contentType || MIME[path.extname(name).toLowerCase()] || 'application/octet-stream',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=2592000, immutable',
      'X-Content-Type-Options': 'nosniff',
    });
    let start = 0;
    let end = size - 1;
    const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (m && size > 0) {
      if (m[1] === '' && m[2] !== '') start = Math.max(0, size - Number(m[2]));
      else { if (m[1] !== '') start = Number(m[1]); if (m[2] !== '') end = Math.min(end, Number(m[2])); }
      if (start > end || start >= size) { res.status(416).set('Content-Range', 'bytes */' + size).end(); return; }
      res.status(206).set('Content-Range', 'bytes ' + start + '-' + end + '/' + size);
    }
    res.set('Content-Length', String(size ? end - start + 1 : 0));
    if (req.method === 'HEAD' || size === 0) { res.end(); return; }
    const stream = getBucket().openDownloadStreamByName(name, { start, end: end + 1 });
    stream.on('error', (err) => { if (!res.headersSent) next(err); else res.destroy(); });
    stream.pipe(res);
  } catch (err) { next(err); }
}

// One-time copy of pictures already saved in the uploads/ folder into the database.
async function importDiskFiles(dir) {
  let names = [];
  try { names = await fs.readdir(dir); } catch (e) { return 0; }
  let copied = 0;
  for (const name of names) {
    if (!/^[\w.-]+$/.test(name) || !MIME[path.extname(name).toLowerCase()]) continue;
    if (await find(name)) continue;
    try {
      await put(name, await fs.readFile(path.join(dir, name)), MIME[path.extname(name).toLowerCase()]);
      copied++;
    } catch (e) { /* skip unreadable files */ }
  }
  return copied;
}

module.exports = { put, remove, find, serve, importDiskFiles };
