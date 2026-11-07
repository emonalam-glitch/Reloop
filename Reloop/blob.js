const { put, del } = require('@vercel/blob');
const { fail } = require('./http');
const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 600 * 1024; // the browser shrinks photos far below this; this is only a safety cap

async function saveImage(dataUrl, folder) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) throw fail(400, 'Unsupported image. Use JPG, PNG or WebP.');
  const buf = Buffer.from(m[2], 'base64');
  if (!buf.length || buf.length > MAX_BYTES) throw fail(413, 'Image is too large. Try a smaller photo.');
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw fail(503, 'Image storage is not set up yet. Connect Vercel Blob to the project.');
  const r = await put(`${folder}/${Date.now()}.${TYPES[m[1]]}`, buf, { access: 'public', contentType: m[1], addRandomSuffix: true });
  return r.url;
}
async function removeImages(urls) {
  const list = (urls || []).filter(u => typeof u === 'string' && u.includes('blob.vercel-storage.com'));
  if (!list.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try { await del(list); } catch (e) { console.error('blob delete failed', e.message); }
}
module.exports = { saveImage, removeImages };
