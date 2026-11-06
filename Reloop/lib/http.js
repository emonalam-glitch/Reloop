const fail = (status, message) => Object.assign(new Error(message), { status });
const handle = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (e) {
    if (!e.status) console.error(e);
    res.status(e.status || 500).json({ error: e.status ? e.message : 'Server error. Check the Vercel function logs.' });
  }
};
// Normalises a phone number to international digits. Bangladesh is the default (01XXXXXXXXX -> 8801XXXXXXXXX).
function phone(v) {
  if (!v) return null;
  let d = String(v).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '880' + d.slice(1);
  else if (d.length === 10 && d[0] === '1') d = '880' + d;
  if (d.length < 10 || d.length > 15) throw fail(400, 'Enter a valid phone or WhatsApp number');
  return d;
}
const money = n => Math.round(n * 100) / 100;
module.exports = { fail, handle, phone, money };
