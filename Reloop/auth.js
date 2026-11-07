const crypto = require('crypto');
const { q } = require('./db');
const { fail } = require('./http');
const COOKIE = 'rl_session', MAX = 7, AGE = 60 * 60 * 24 * 60;
const PUB = 'id,name,email,role,whatsapp,phone,avatar_url';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) throw new Error('JWT_SECRET is missing or too short');
  return s;
}
const mac = body => crypto.createHmac('sha256', secret()).update(body).digest('base64url');
function sign(p) {
  const body = Buffer.from(JSON.stringify({ ...p, exp: Math.floor(Date.now() / 1000) + AGE })).toString('base64url');
  return body + '.' + mac(body);
}
function verify(t) {
  try {
    const [body, sig] = t.split('.');
    const a = Buffer.from(sig), b = Buffer.from(mac(body));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p.exp > Date.now() / 1000 ? p : null;
  } catch (e) { return null; }
}
function hashPw(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  return salt + ':' + crypto.scryptSync(pw, salt, 64).toString('hex');
}
function checkPw(pw, stored) {
  const [salt, h] = stored.split(':');
  const a = Buffer.from(h, 'hex'), b = crypto.scryptSync(pw, salt, 64);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function getSession(req) {
  const m = /(?:^|;\s*)rl_session=([^;]+)/.exec(req.headers.cookie || '');
  const p = m && verify(m[1]);
  return p && Array.isArray(p.linked) ? { linked: p.linked.map(Number), active: p.active } : { linked: [], active: null };
}
function setSession(req, res, s) {
  const sec = (req.headers['x-forwarded-proto'] || '') === 'https' ? '; Secure' : '';
  res.setHeader('Set-Cookie', s.linked.length
    ? `${COOKIE}=${sign({ linked: s.linked, active: s.active })}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${AGE}${sec}`
    : `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${sec}`);
}
async function current(req) {
  const s = getSession(req);
  if (!s.active || !s.linked.includes(s.active)) return null;
  return (await q(`SELECT ${PUB} FROM users WHERE id=$1`, [s.active]))[0] || null;
}
async function need(req, role) {
  const u = await current(req);
  if (!u) throw fail(401, 'Please sign in');
  if (role && u.role !== role) throw fail(403, 'You do not have access to this');
  return u;
}
module.exports = { MAX, PUB, hashPw, checkPw, getSession, setSession, current, need };
