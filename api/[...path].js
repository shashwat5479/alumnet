const { Pool } = require('pg');
const crypto = require('crypto');

const pool = global._pool || (global._pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3 }));
const q = (t, a) => pool.query(t, a).then(r => r.rows);

// --- stateless signed session tokens (no extra deps) ---
const KEY = process.env.SESSION_SECRET || process.env.DATABASE_URL || 'dev-only';
const sig = s => crypto.createHmac('sha256', KEY).update(s).digest('base64url');
const sign = u => { const s = Buffer.from(JSON.stringify({ id: u.id, role: u.role, exp: Date.now() + 6048e5 })).toString('base64url'); return s + '.' + sig(s); };
const verify = h => {
  const [s, g] = (h || '').replace('Bearer ', '').split('.');
  if (!s || !g) return null;
  const a = Buffer.from(sig(s)), b = Buffer.from(g);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const d = JSON.parse(Buffer.from(s, 'base64url')); return d.exp > Date.now() ? d : null; } catch { return null; }
};

const PUB = 'u.id,u.role,u.name,u.enrollment,u.branch,u.year,u.career_goal,u.grad_year,u.company,u.job_role,u.industry,u.location,u.skills,u.open_mentorship,u.open_referrals';
const clean = v => (typeof v === 'string' ? v.trim().slice(0, 200) : undefined) || null;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

module.exports = async (req, res) => {
     const r = new URL(req.url, 'http://x').pathname.replace(/^\/api\//, '').replace(/\/+$/, ''), m = req.method, b = req.body || {}, Q = req.query;
  const out = (c, d) => res.status(c).json(d);
  try {
    // ---------- public ----------
    if (r === 'public') return out(200, (await q(`select count(*) filter (where role='STUDENT')::int students, count(*) filter (where role='ALUMNI')::int alumni, count(distinct location) filter (where role='ALUMNI')::int cities from users`))[0]);

    if (r === 'login' && m === 'POST') {
      const [u] = await q(`select id,role from users where lower(email)=lower($1) and role=$3 and password_hash=crypt($2,password_hash)`, [String(b.email || ''), String(b.password || ''), b.role]);
      if (!u) return out(401, { error: 'Email, password or account type is incorrect.' });
      const [s] = await q(`select enabled from settings where key='Maintenance mode'`);
      if (s?.enabled && u.role !== 'ADMIN') return out(503, { error: 'AlumNet is in maintenance mode. Please try again later.' });
      return out(200, { token: sign(u) });
    }

    if (r === 'register' && m === 'POST') {
      const [s] = await q(`select enabled from settings where key='Allow new registrations'`);
      if (s && !s.enabled) return out(403, { error: 'Registrations are closed right now.' });
      const role = b.role === 'ALUMNI' ? 'ALUMNI' : 'STUDENT', name = clean(b.name), email = clean(b.email);
      if (!name || !EMAIL.test(email || '')) return out(400, { error: 'Enter your name and a valid email address.' });
      if (!b.password || b.password.length < 6) return out(400, { error: 'Password must be at least 6 characters.' });
      if (b.password !== b.confirm) return out(400, { error: 'Passwords do not match.' });
      const f = role === 'STUDENT'
        ? [clean(b.enrollment), clean(b.branch), clean(b.year), clean(b.career_goal), null, null, null, null]
        : [null, null, null, null, clean(b.grad_year), clean(b.company), clean(b.job_role), clean(b.industry)];
      if (f.slice(role === 'STUDENT' ? 0 : 4, role === 'STUDENT' ? 4 : 8).some(x => !x)) return out(400, { error: 'Please complete every field.' });
      try {
        await q(`insert into users(role,name,email,password_hash,enrollment,branch,year,career_goal,grad_year,company,job_role,industry) values($1,$2,$3,crypt($4,gen_salt('bf',8)),$5,$6,$7,$8,$9,$10,$11,$12)`, [role, name, email, b.password, ...f]);
      } catch (e) { if (e.code === '23505') return out(409, { error: 'An account with this email already exists.' }); throw e; }
      return out(201, { ok: true });
    }

    // ---------- authenticated ----------
    const s = verify(req.headers.authorization);
    if (!s) return out(401, { error: 'Please sign in.' });
    const id = s.id, role = s.role, admin = role === 'ADMIN';

    if (r === 'me') {
      if (m === 'PATCH') {
        if (b.email && !EMAIL.test(b.email)) return out(400, { error: 'Enter a valid email address.' });
        if (b.name !== undefined && !clean(b.name)) return out(400, { error: 'Name cannot be empty.' });
        const sk = typeof b.skills === 'string' ? b.skills.split(',').map(x => x.trim()).filter(Boolean).slice(0, 12) : null;
        try {
          await q(`update users set name=coalesce($2,name),email=coalesce($3,email),skills=coalesce($4,skills),career_goal=coalesce($5,career_goal),company=coalesce($6,company),job_role=coalesce($7,job_role),location=coalesce($8,location),open_mentorship=coalesce($9,open_mentorship),open_referrals=coalesce($10,open_referrals) where id=$1`,
            [id, clean(b.name), clean(b.email), sk, clean(b.career_goal), clean(b.company), clean(b.job_role), clean(b.location), role === 'ALUMNI' ? b.open_mentorship ?? null : null, role === 'ALUMNI' ? b.open_referrals ?? null : null]);
        } catch (e) { if (e.code === '23505') return out(409, { error: 'That email is already in use.' }); throw e; }
      }
      return out(200, (await q(`select ${PUB},u.email from users u where u.id=$1`, [id]))[0]);
    }

    if (r === 'home') return out(200, (await q(`select
      (select count(*) from connections where user_id=$1 and kind='connect')::int connections,
      (select count(*) from connections where user_id=$1 and kind='mentor')::int mentors,
      (select count(*) from saved_jobs where user_id=$1)::int saved,
      (select count(*) from jobs where posted_by=$1)::int posted,
      (select count(*) from users where role='STUDENT')::int students,
      (select count(*) from users where role='ALUMNI')::int alumni,
      (select count(*) from jobs)::int jobs, (select count(*) from messages)::int messages`, [id]))[0]);

    if (r === 'people') {
      const a = [Q.role === 'STUDENT' ? 'STUDENT' : 'ALUMNI', id], w = ['u.role=$1'];
      if (Q.q) { a.push('%' + Q.q + '%'); w.push(`concat_ws(' ',u.name,u.company,u.job_role,u.branch,u.career_goal,u.industry,u.location,array_to_string(u.skills,' ')) ilike $${a.length}`); }
      let order = 'u.id';
      if (Q.rec && role === 'STUDENT') order = `(u.job_role=(select career_goal from users where id=$2)) desc, u.open_mentorship desc, u.id`;
      if (Q.rec && role === 'ALUMNI') w.push(`not exists(select 1 from connections c where c.user_id=$2 and c.target_id=u.id and c.kind='mentor')`);
      const lim = Math.min(+Q.limit || 60, 500);
      return out(200, await q(`select ${PUB}${admin ? ',u.email' : ''}, (select coalesce(array_agg(kind),'{}') from connections c where c.user_id=$2 and c.target_id=u.id) done, count(*) over()::int total from users u where ${w.join(' and ')} order by ${order} limit ${lim}`, a));
    }

    if (r === 'connect' && m === 'POST') {
      const kind = b.kind === 'mentor' ? 'mentor' : 'connect';
      if (+b.targetId === id) return out(400, { error: 'You cannot connect with yourself.' });
      const n = await q(`insert into connections select $1,id,$3 from users where id=$2 on conflict do nothing returning 1`, [id, +b.targetId, kind]);
      return out(200, { ok: true, created: n.length > 0 });
    }

    if (r === 'network') return out(200, {
      people: await q(`select ${PUB}, c.kind from connections c join users u on u.id=c.target_id where c.user_id=$1 order by u.name`, [id]),
      jobs: await q(`select j.* from saved_jobs s join jobs j on j.id=s.job_id where s.user_id=$1 order by j.id desc`, [id])
    });

    if (r === 'jobs') {
      if (m === 'POST') {
        if (role === 'STUDENT') return out(403, { error: 'Only alumni and admins can post jobs.' });
        const t = clean(b.title), c = clean(b.company);
        if (!t || !c) return out(400, { error: 'Role and company are required.' });
        await q(`insert into jobs(title,company,location,type,posted_by) values($1,$2,$3,$4,$5)`, [t, c, clean(b.location) || 'Remote', b.type === 'Internship' ? 'Internship' : 'Full-time', id]);
        return out(201, { ok: true });
      }
      return out(200, await q(`select j.*, exists(select 1 from saved_jobs s where s.job_id=j.id and s.user_id=$1) saved from jobs j where concat_ws(' ',j.title,j.company,j.location,j.type) ilike $2 order by j.id desc`, [id, '%' + (Q.q || '') + '%']));
    }
    if (r === 'jobs/save' && m === 'POST') { await q(`insert into saved_jobs values($1,$2) on conflict do nothing`, [id, +b.jobId]); return out(200, { ok: true }); }

    if (r === 'messages') {
      if (m === 'POST') {
        const body = clean(b.body), to = clean(b.to);
        if (!to || !body) return out(400, { error: 'Enter a recipient and a message.' });
        const [t] = await q(`select id from users where lower(email)=lower($1) or name ilike $1 order by (lower(email)=lower($1)) desc limit 1`, [to]);
        if (!t) return out(404, { error: 'No one found with that name or email.' });
        await q(`insert into messages(from_id,to_id,body) values($1,$2,$3)`, [id, t.id, body]);
        return out(201, { ok: true });
      }
      return out(200, await q(`select m.id,m.body,m.created_at,f.name from_name,t.name to_name,(m.from_id=$1) mine from messages m join users f on f.id=m.from_id join users t on t.id=m.to_id where $1 in (m.from_id,m.to_id) order by m.id desc limit 100`, [id]));
    }

    // ---------- admin ----------
    if (r === 'reports' || r === 'settings') {
      if (!admin) return out(403, { error: 'Admins only.' });
      if (r === 'reports') return out(200, await q(`select coalesce(industry,'Other') label, count(*)::int n from users where role='ALUMNI' group by 1 order by 2 desc`));
      if (m === 'POST') await q(`update settings set enabled=not enabled where key=$1`, [b.key]);
      return out(200, await q(`select key,enabled from settings order by key`));
    }

    return out(404, { error: 'Not found' });
  } catch (e) {
    console.error(e);
    return out(500, { error: 'Server error. Check DATABASE_URL and that db:setup has been run.' });
  }
};
