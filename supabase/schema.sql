-- Cartwright HR tool: schema
-- Run this in the Supabase SQL editor (or supabase db push) before first use.

-- ── Enums ──────────────────────────────────────────────
create type meeting_type as enum ('one_to_one', 'review', 'interview_debrief', 'other');
create type writeup_status as enum ('draft', 'edited', 'shared', 'archived');
create type objective_status as enum ('on_track', 'at_risk', 'done');

-- ── Tables ─────────────────────────────────────────────
create table employees (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  job_title text,
  manager_name text,
  start_date date,
  status text not null default 'active',
  responsibilities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table meetings (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  granola_note_id text,
  meeting_type meeting_type not null default 'one_to_one',
  meeting_date date not null default current_date,
  raw_note text, -- kept so HR can see the original note alongside the AI write-up
  created_at timestamptz not null default now()
);

create table objectives (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  title text not null,
  status objective_status not null default 'on_track',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table writeups (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references meetings(id) on delete cascade,
  employee_id uuid not null references employees(id) on delete cascade,
  status writeup_status not null default 'draft',
  formatted_content text not null,
  review_flags jsonb not null default '[]',
  suggestions jsonb not null default '[]',
  model_format text,
  model_review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table guidelines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  content text not null,
  created_at timestamptz not null default now()
);

create table share_links (
  id uuid primary key default gen_random_uuid(),
  writeup_id uuid not null references writeups(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  view_count int not null default 0,
  created_at timestamptz not null default now()
);

create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid,          -- auth.uid() of the HR user
  action text not null, -- created / edited / shared / revoked / viewed
  entity text not null,
  entity_id uuid,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────
-- Policy: any signed-in user is HR staff. This is a single-team internal
-- tool; only invite HR into Supabase Auth. Tighten to a role check later
-- if more people need logins.
alter table employees   enable row level security;
alter table meetings    enable row level security;
alter table writeups    enable row level security;
alter table objectives  enable row level security;
alter table guidelines  enable row level security;
alter table share_links enable row level security;
alter table audit_log   enable row level security;

create policy "hr full access" on employees   for all to authenticated using (true) with check (true);
create policy "hr full access" on meetings    for all to authenticated using (true) with check (true);
create policy "hr full access" on writeups    for all to authenticated using (true) with check (true);
create policy "hr full access" on objectives  for all to authenticated using (true) with check (true);
create policy "hr full access" on guidelines  for all to authenticated using (true) with check (true);
create policy "hr full access" on share_links for all to authenticated using (true) with check (true);
create policy "hr read audit"  on audit_log   for select to authenticated using (true);

-- No anon policies at all. The public share page never touches these
-- tables with a user session; it goes through a server endpoint using
-- the service role key after validating the token hash and expiry.
