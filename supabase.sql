-- 오늘 파도 어때 · 6기 공유 데이터
-- Supabase 대시보드 → SQL Editor → 전체 붙여넣고 Run

create table if not exists surfers (
  id text primary key,
  cohort text, name text, profile jsonb,
  xp int default 0, level int default 0, attend int default 0, rides int default 0, missions int default 0,
  updated_at timestamptz default now()
);
create table if not exists cards (
  id text primary key,
  from_id text, from_name text, to_name text,
  tpl text, text text,
  created_at timestamptz default now()
);

alter table surfers enable row level security;
alter table cards   enable row level security;

-- 친구 그룹용: 누구나 읽고, 누구나 자기 행을 올린다 (anon key로 접근)
create policy "surfers read"   on surfers for select using (true);
create policy "surfers insert" on surfers for insert with check (true);
create policy "surfers update" on surfers for update using (true);
create policy "cards read"     on cards   for select using (true);
create policy "cards insert"   on cards   for insert with check (true);

-- 코치 출석부 (2차 추가)
create table if not exists attendance (
  id text primary key,            -- 이름|날짜
  name text, date date, present boolean, week int, by_id text,
  updated_at timestamptz default now()
);
alter table attendance enable row level security;
create policy "att read"   on attendance for select using (true);
create policy "att insert" on attendance for insert with check (true);
create policy "att update" on attendance for update using (true);
