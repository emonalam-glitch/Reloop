const { q } = require('../lib/db');
const { need } = require('../lib/auth');
const { handle, fail } = require('../lib/http');
const { saveImage, removeImages } = require('../lib/blob');
const CATS = ['Furniture', 'Books', 'Electronics', 'Home and kitchen', 'Other'], CONDS = ['Like new', 'Good', 'Fair'];

module.exports = handle(async (req, res) => {
  const u = await need(req), b = req.body || {}, adm = u.role === 'admin';
  if (req.method === 'GET') {
    const rows = await q(`SELECT l.id,l.user_id,l.title,l.category,l.cond,l.price::float8 AS price,l.description,l.sold,l.created_at,l.images,
      x.name AS seller_name,x.whatsapp AS seller_whatsapp,x.phone AS seller_phone,x.avatar_url AS seller_avatar
      FROM listings l JOIN users x ON x.id=l.user_id ORDER BY l.id DESC LIMIT 300`);
    return res.json({ listings: rows });
  }
  if (req.method === 'POST') {
    const title = String(b.title || '').trim(), desc = String(b.description || '').trim(), price = Number(b.price);
    if (!title || title.length > 80 || !desc || desc.length > 500 || !(price >= 0) || !CATS.includes(b.category) || !CONDS.includes(b.cond))
      throw fail(400, 'Please complete all listing fields');
    const imgs = Array.isArray(b.images) ? b.images.slice(0, 4) : [];
    const urls = [];
    try { for (const d of imgs) urls.push(await saveImage(d, 'listings')); }
    catch (e) { await removeImages(urls); throw e; }
    await q('INSERT INTO listings(user_id,title,category,cond,price,description,images) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [u.id, title, b.category, b.cond, price, desc, urls]);
    return res.json({ ok: true });
  }
  const own = adm ? '' : ' AND user_id=$2', args = adm ? [] : [u.id];
  if (req.method === 'PATCH') {
    await q(`UPDATE listings SET sold=true, sold_at=now() WHERE id=$1${own}`, [Number(b.id), ...args]);
    return res.json({ ok: true });
  }
  if (req.method === 'DELETE') {
    const r = await q(`DELETE FROM listings WHERE id=$1${own} RETURNING images`, [Number(req.query.id), ...args]);
    if (r[0]) await removeImages(r[0].images);
    return res.json({ ok: true });
  }
  throw fail(405, 'Method not allowed');
});
