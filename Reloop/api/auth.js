const { q } = require('../lib/db');
const A = require('../lib/auth');
const { handle, fail, phone } = require('../lib/http');

module.exports = handle(async (req, res) => {
  const s = A.getSession(req);
  if (req.method === 'GET') {
    let setup = false, support = null, linked = [], user = null;
    try {
      const a = await q("SELECT whatsapp FROM users WHERE role='admin' ORDER BY id LIMIT 1");
      setup = !a.length; support = a[0] && a[0].whatsapp;
    } catch (e) { setup = true; }
    if (!setup && s.linked.length) {
      linked = await q(`SELECT ${A.PUB} FROM users WHERE id = ANY($1::int[])`, ['{' + s.linked.join(',') + '}']);
      user = linked.find(u => u.id === s.active) || null;
    }
    return res.json({ user, linked, support, setup });
  }
  if (req.method !== 'POST') throw fail(405, 'Method not allowed');
  const act = req.query.action, b = req.body || {};

  if (act === 'register' || act === 'login') {
    const email = String(b.email || '').trim().toLowerCase(), pw = String(b.password || '');
    let u;
    if (act === 'register') {
      const name = String(b.name || '').trim();
      if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || pw.length < 8)
        throw fail(400, 'Enter your name, a valid email and a password of at least 8 characters');
      if ((await q('SELECT 1 FROM users WHERE email=$1', [email])).length) throw fail(409, 'This email is already registered');
      u = (await q(`INSERT INTO users(name,email,password_hash,whatsapp,phone) VALUES($1,$2,$3,$4,$5) RETURNING ${A.PUB}`,
        [name, email, A.hashPw(pw), phone(b.whatsapp), phone(b.phone)]))[0];
    } else {
      const r = (await q('SELECT * FROM users WHERE email=$1', [email]))[0];
      if (!r || !A.checkPw(pw, r.password_hash)) throw fail(401, 'Email or password is incorrect');
      u = { id: r.id, name: r.name, email: r.email, role: r.role, whatsapp: r.whatsapp, phone: r.phone };
    }
    if (!s.linked.includes(u.id)) {
      if (s.linked.length >= A.MAX) throw fail(409, 'You can link up to 7 accounts. Remove one first.');
      s.linked.push(u.id);
    }
    s.active = u.id; A.setSession(req, res, s);
    return res.json({ user: u });
  }
  if (act === 'logout' || act === 'remove') {
    const id = act === 'logout' ? s.active : Number(b.id);
    s.linked = s.linked.filter(x => x !== id);
    if (s.active === id) s.active = s.linked[0] || null;
    A.setSession(req, res, s);
    return res.json({ ok: true });
  }
  if (act === 'switch') {
    const id = Number(b.id);
    if (!s.linked.includes(id)) throw fail(403, 'Account is not linked');
    s.active = id; A.setSession(req, res, s);
    return res.json({ ok: true });
  }
  if (act === 'profile') {
    const u = await A.need(req), name = String(b.name || '').trim();
    if (name.length < 2) throw fail(400, 'Enter your name');
    await q('UPDATE users SET name=$1, whatsapp=$2, phone=$3 WHERE id=$4', [name, phone(b.whatsapp), phone(b.phone), u.id]);
    return res.json({ ok: true });
  }
  throw fail(400, 'Unknown action');
});
