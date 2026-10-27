# AlumNet (web)

Web port of the AlumNet Swing demo: Student, Alumni and Admin portals on a static frontend
(`public/index.html`), a Vercel serverless API (`api/[...path].js`) and PostgreSQL.

## 1. Get a Postgres database (free)
Easiest: in your Vercel project go to **Storage → Neon (Postgres)** and connect it. It adds `DATABASE_URL` for you.
Or use any Postgres (Neon, Supabase, Railway) and copy its connection string.

## 2. Create tables + demo data (once)
```bash
npm install
DATABASE_URL="postgres://..." npm run db:setup
```
Safe to re-run; it only seeds when the users table is empty.

## 3. Deploy
```bash
npm i -g vercel
vercel            # first deploy
vercel env add DATABASE_URL     # if not added via Storage
vercel env add SESSION_SECRET   # any long random string
vercel --prod
```
Local dev: `vercel dev` (needs `DATABASE_URL` in `.env`).

## Demo accounts
Student `priya@nietstudent.in` / `student123` · Alumni `rahul@alumni.com` / `alumni123` · Admin `admin@alumnet.com` / `admin123`

Change or delete these before sharing the link publicly.
