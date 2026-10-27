create extension if not exists pgcrypto;
create table if not exists users(
  id serial primary key,
  role text not null check (role in ('STUDENT','ALUMNI','ADMIN')),
  name text not null, email text unique not null, password_hash text not null,
  enrollment text, branch text, year text, career_goal text,
  grad_year text, company text, job_role text, industry text, location text,
  skills text[] not null default '{}',
  open_mentorship boolean not null default false, open_referrals boolean not null default false,
  created_at timestamptz not null default now());
create index if not exists users_role_idx on users(role);
create table if not exists connections(
  user_id int references users(id) on delete cascade,
  target_id int references users(id) on delete cascade,
  kind text check (kind in ('connect','mentor')),
  primary key (user_id, target_id, kind));
create table if not exists jobs(
  id serial primary key, title text not null, company text not null,
  location text, type text not null default 'Full-time',
  posted_by int references users(id) on delete set null, created_at timestamptz not null default now());
create table if not exists saved_jobs(
  user_id int references users(id) on delete cascade,
  job_id int references jobs(id) on delete cascade, primary key (user_id, job_id));
create table if not exists messages(
  id serial primary key, from_id int references users(id) on delete cascade,
  to_id int references users(id) on delete cascade, body text not null,
  created_at timestamptz not null default now());
create table if not exists settings(key text primary key, enabled boolean not null);
