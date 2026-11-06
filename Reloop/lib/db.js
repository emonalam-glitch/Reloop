const { neon } = require('@neondatabase/serverless');
let sql;
async function q(text, params = []) {
  if (!sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    sql = neon(process.env.DATABASE_URL);
  }
  const r = typeof sql.query === 'function' ? await sql.query(text, params) : await sql(text, params);
  return Array.isArray(r) ? r : (r.rows || []);
}
module.exports = { q };
