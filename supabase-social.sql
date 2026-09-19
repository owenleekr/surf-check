-- 3차: 파도 별점 · 체크인 · 파티 모집 (SQL Editor에서 전체 실행)
create table if not exists ratings (
  id text primary key,                 -- user|beach|date
  user_id text, name text, beach text, date date, hour int,
  stars numeric, comment text, chart jsonb,
  created_at timestamptz default now()
);
create table if not exists checkins (
  id text primary key,                 -- user|date
  user_id text, name text, beach text, at timestamptz, active boolean default true, profile jsonb,
  updated_at timestamptz default now()
);
create table if not exists parties (
  id text primary key,
  user_id text, name text, date date, beach text, time text, note text,
  joins jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
alter table ratings  enable row level security;
alter table checkins enable row level security;
alter table parties  enable row level security;
do $$ begin
  create policy "ratings read"    on ratings  for select using (true);
  create policy "ratings insert"  on ratings  for insert with check (true);
  create policy "ratings update"  on ratings  for update using (true);
  create policy "checkins read"   on checkins for select using (true);
  create policy "checkins insert" on checkins for insert with check (true);
  create policy "checkins update" on checkins for update using (true);
  create policy "parties read"    on parties  for select using (true);
  create policy "parties insert"  on parties  for insert with check (true);
  create policy "parties update"  on parties  for update using (true);
exception when duplicate_object then null; end $$;
