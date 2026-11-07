const { q } = require('../lib/db');
const { removeImages } = require('../lib/blob');
const { handle, fail } = require('../lib/http');

// Runs once a day (see vercel.json). Frees storage so the free Blob allowance does not fill up.
//  - sold items: images removed 30 days after "Mark sold"
//  - unsold items: images removed after 90 days
//  - chat images: removed after 15 days (the text stays)
module.exports = handle(async (req, res) => {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== 'Bearer ' + secret) throw fail(401, 'Unauthorized');
  let n = 0;
  const L = await q(`SELECT id,images FROM listings WHERE cardinality(images) > 0
    AND ((sold AND sold_at < now() - interval '30 days') OR (NOT sold AND created_at < now() - interval '90 days')) LIMIT 100`);
  for (const l of L) { await removeImages(l.images); await q("UPDATE listings SET images='{}' WHERE id=$1", [l.id]); n += l.images.length; }
  const M = await q(`SELECT id,image_url FROM messages WHERE image_url IS NOT NULL AND image_url <> 'expired' AND created_at < now() - interval '15 days' LIMIT 200`);
  for (const m of M) { await removeImages([m.image_url]); await q("UPDATE messages SET image_url='expired' WHERE id=$1", [m.id]); n++; }
  res.json({ ok: true, imagesRemoved: n });
});
