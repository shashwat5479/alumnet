// Usage: DATABASE_URL=postgres://... npm run db:setup   (safe to re-run)
const fs = require('fs'), path = require('path'), { Client } = require('pg');
(async () => {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL first');
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  await c.query(fs.readFileSync(path.join(__dirname, '../db/schema.sql'), 'utf8'));
  const { rows: [n] } = await c.query('select count(*)::int n from users');
  if (!n.n) await c.query(fs.readFileSync(path.join(__dirname, '../db/seed.sql'), 'utf8'));
  const { rows: [t] } = await c.query('select count(*)::int n from users');
  console.log(`Done. ${t.n} users in database.`);
  await c.end();
})().catch(e => { console.error(e.message); process.exit(1); });
