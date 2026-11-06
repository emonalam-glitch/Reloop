const { q } = require('../lib/db');
const { need } = require('../lib/auth');
const { handle, fail, money } = require('../lib/http');

module.exports = handle(async (req, res) => {
  const u = await need(req), adm = u.role === 'admin', b = req.body || {};
  if (req.method === 'GET') {
    const rows = await q(`SELECT r.id,r.user_id,r.material,r.unit,r.rate::float8 AS rate,r.qty::float8 AS qty,r.total::float8 AS total,
      r.address,r.status,r.created_at,x.name AS seller_name,x.whatsapp AS seller_whatsapp,x.phone AS seller_phone
      FROM requests r JOIN users x ON x.id=r.user_id ${adm ? '' : 'WHERE r.user_id=$1'} ORDER BY r.id DESC LIMIT 300`, adm ? [] : [u.id]);
    return res.json({ requests: rows });
  }
  if (req.method === 'POST') {
    const r = (await q('SELECT * FROM rates WHERE id=$1', [Number(b.rateId)]))[0];
    const qty = Number(b.qty), address = String(b.address || '').trim();
    if (!r || !(qty > 0) || !address) throw fail(400, 'Choose a material, quantity and pickup address');
    if (r.unit === 'piece' && !Number.isInteger(qty)) throw fail(400, 'Enter a whole number of pieces');
    const total = money(Number(r.rate) * qty); // payout is always calculated on the server from the admin rate
    await q('INSERT INTO requests(user_id,material,unit,rate,qty,total,address) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [u.id, r.name, r.unit, r.rate, qty, total, address]);
    return res.json({ ok: true, total });
  }
  if (req.method === 'PATCH') {
    if (!adm) throw fail(403, 'Only the administrator can do this');
    const from = { Approved: 'Pending', Rejected: 'Pending', Paid: 'Approved' }[b.status];
    if (!from) throw fail(400, 'Invalid status');
    const r = await q('UPDATE requests SET status=$1 WHERE id=$2 AND status=$3 RETURNING id', [b.status, Number(b.id), from]);
    if (!r.length) throw fail(409, 'This request cannot move to that status');
    return res.json({ ok: true });
  }
  throw fail(405, 'Method not allowed');
});
