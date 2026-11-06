const { q } = require('../lib/db');
const { need } = require('../lib/auth');
const { handle, fail } = require('../lib/http');

module.exports = handle(async (req, res) => {
  if (req.method === 'GET') return res.json({ rates: await q('SELECT id,name,unit,rate::float8 AS rate FROM rates ORDER BY id') });
  await need(req, 'admin');
  const b = req.body || {};
  const check = () => {
    const name = String(b.name || '').trim(), rate = Number(b.rate);
    if (!name || !['kg', 'piece'].includes(b.unit) || !(rate >= 0)) throw fail(400, 'Enter a name, unit and rate');
    return [name, b.unit, rate];
  };
  if (req.method === 'POST') await q('INSERT INTO rates(name,unit,rate) VALUES($1,$2,$3)', check());
  else if (req.method === 'PUT') await q('UPDATE rates SET name=$1,unit=$2,rate=$3 WHERE id=$4', [...check(), Number(b.id)]);
  else if (req.method === 'DELETE') await q('DELETE FROM rates WHERE id=$1', [Number(req.query.id)]);
  else throw fail(405, 'Method not allowed');
  res.json({ ok: true });
});
