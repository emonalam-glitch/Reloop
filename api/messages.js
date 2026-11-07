const { q } = require('../lib/db');
const { need } = require('../lib/auth');
const { handle, fail } = require('../lib/http');
const { saveImage } = require('../lib/blob');

module.exports = handle(async (req, res) => {
  const u = await need(req), b = req.body || {};
  if (req.method === 'GET' && req.query.count) { // light check used for the notification badge
    const r = await q(`SELECT count(*) OVER()::int AS n,m.id,m.body,x.name FROM messages m JOIN users x ON x.id=m.from_id
      WHERE m.to_id=$1 AND m.read_at IS NULL ORDER BY m.id DESC LIMIT 1`, [u.id]);
    return res.json({ unread: r[0] ? r[0].n : 0, latest: r[0] ? { id: r[0].id, name: r[0].name, body: (r[0].body || '').slice(0, 80) } : null });
  }
  if (req.method === 'GET') {
    const rows = (await q(`SELECT m.id,m.listing_id,m.request_id,m.from_id,m.to_id,m.body,m.image_url,m.read_at,m.created_at,l.title AS ltitle,r.material AS rmat
      FROM messages m LEFT JOIN listings l ON l.id=m.listing_id LEFT JOIN requests r ON r.id=m.request_id
      WHERE m.from_id=$1 OR m.to_id=$1 ORDER BY m.id DESC LIMIT 500`, [u.id])).reverse();
    const ids = [...new Set(rows.map(m => (m.from_id === u.id ? m.to_id : m.from_id)))];
    const people = ids.length ? await q('SELECT id,name,whatsapp,phone,avatar_url FROM users WHERE id = ANY($1::int[])', ['{' + ids.join(',') + '}']) : [];
    return res.json({ messages: rows, people: Object.fromEntries(people.map(p => [p.id, p])), unread: rows.filter(m => m.to_id === u.id && !m.read_at).length });
  }
  if (req.method === 'PATCH') { // mark one conversation as read
    const c = String(b.ctx || ''), lid = c[0] === 'L' ? Number(c.slice(1)) : null, rid = c[0] === 'R' ? Number(c.slice(1)) : null;
    await q(`UPDATE messages SET read_at=now() WHERE to_id=$1 AND from_id=$2 AND read_at IS NULL
      AND listing_id IS NOT DISTINCT FROM $3::int AND request_id IS NOT DISTINCT FROM $4::int`, [u.id, Number(b.from), lid, rid]);
    return res.json({ ok: true });
  }
  if (req.method !== 'POST') throw fail(405, 'Method not allowed');
  const to = Number(b.to), body = String(b.body || '').trim(), c = String(b.ctx || '');
  if (!to || to === u.id || (!body && !b.image) || body.length > 1000) throw fail(400, 'Invalid message');
  if (!(await q('SELECT 1 FROM users WHERE id=$1', [to])).length) throw fail(404, 'User not found');
  const img = b.image ? await saveImage(b.image, 'messages') : null;
  const lid = c[0] === 'L' ? Number(c.slice(1)) || null : null, rid = c[0] === 'R' ? Number(c.slice(1)) || null : null;
  await q('INSERT INTO messages(listing_id,request_id,from_id,to_id,body,image_url) VALUES($1,$2,$3,$4,$5,$6)', [lid, rid, u.id, to, body || null, img]);
  res.json({ ok: true });
});
