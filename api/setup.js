const { q } = require('../lib/db');
const A = require('../lib/auth');
const SCHEMA = require('../lib/schema');
const { handle, fail } = require('../lib/http');

// One-time setup: creates the tables, default rates and the first admin account.
module.exports = handle(async (req, res) => {
  if (req.method !== 'POST') throw fail(405, 'Method not allowed');
  const b = req.body || {};
  if (!process.env.ADMIN_SETUP_KEY || b.key !== process.env.ADMIN_SETUP_KEY) throw fail(403, 'The setup key is incorrect');
  const had = (await q("SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='read_at'")).length;
  for (const stmt of SCHEMA) await q(stmt); // safe to repeat: it also upgrades an existing database
  if (!had) await q('UPDATE messages SET read_at=created_at WHERE read_at IS NULL');
  if ((await q("SELECT 1 FROM users WHERE role='admin'")).length) return res.json({ ok: true, migrated: true });
  const email = String(b.email || '').trim().toLowerCase(), name = String(b.name || '').trim(), pw = String(b.password || '');
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || pw.length < 8) throw fail(400, 'Enter a name, valid email and a password of at least 8 characters');
  const u = (await q(`INSERT INTO users(name,email,password_hash,role) VALUES($1,$2,$3,'admin') RETURNING ${A.PUB}`, [name, email, A.hashPw(pw)]))[0];
  if (!(await q('SELECT 1 FROM rates LIMIT 1')).length)
    await q(`INSERT INTO rates(name,unit,rate) VALUES ('Mobile phones (scrap)','piece',350),('Mixed plastics','kg',28),('Steel','kg',42),('Glass','kg',6),('Books and paper','kg',22)`);
  A.setSession(req, res, { linked: [u.id], active: u.id });
  res.json({ user: u });
});
