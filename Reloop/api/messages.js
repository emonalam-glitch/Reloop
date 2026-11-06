const { q } = require('../lib/db');
const { need } = require('../lib/auth');
const { handle, fail } = require('../lib/http');

module.exports = handle(async (req, res) => {
  const u = await need(req);
  if (req.method === 'GET') {
    const rows = (await q(`SELECT m.id,m.listing_id,m.request_id,m.from_id,m.to_id,m.body,m.created_at,l.title AS ltitle,r.material AS rmat
      FROM messages m LEFT JOIN listings l ON l.id=m.listing_id LEFT JOIN requests r ON r.id=m.request_id
      WHERE m.from_id=$1 OR m.to_id=$1 ORDER BY m.id DESC LIMIT 500`, [u.id])).reverse();
    const ids = [...new Set(rows.map(m => (m.from_id === u.id ? m.to_id : m.from_id)))];
    const people = ids.length ? await q('SELECT id,name,whatsapp,phone FROM users WHERE id = ANY($1::int[])', ['{' + ids.join(',') + '}']) : [];
    return res.json({ messages: rows, people: Object.fromEntries(people.map(p => [p.id, p])) });
  }
  if (req.method !== 'POST') throw fail(405, 'Method not allowed');
  const b = req.body || {}, to = Number(b.to), body = String(b.body || '').trim(), c = String(b.ctx || '');
  if (!to || to === u.id || !body || body.length > 1000) throw fail(400, 'Invalid message');
  if (!(await q('SELECT 1 FROM users WHERE id=$1', [to])).length) throw fail(404, 'User not found');
  const lid = c[0] === 'L' ? Number(c.slice(1)) || null : null, rid = c[0] === 'R' ? Number(c.slice(1)) || null : null;
  await q('INSERT INTO messages(listing_id,request_id,from_id,to_id,body) VALUES($1,$2,$3,$4,$5)', [lid, rid, u.id, to, body]);
  res.json({ ok: true });
});
