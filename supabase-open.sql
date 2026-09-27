-- ════════════════════════════════════════════════════════════════
-- SurfShare 먼저 열기 · 학교는 코드로 — 한 번에 실행
-- Supabase 대시보드 › SQL Editor
--
-- 세계관: SurfShare(차·숙소 나눔)가 먼저 열리고, 코드를 받은 사람만
--        학교(라인업 앱 — 파도 예보·수업·자세 분석·마을)로 미리 들어간다.
--
-- ★ 아래 '여기에_학교_초대코드' 를 실제 코드로 바꿔서 실행하세요.
--   6기 인증 암호와 달라도 되고, 같아도 됩니다.
-- ════════════════════════════════════════════════════════════════

-- ── 1. 학교 초대 코드 ────────────────────────────────────────
-- cohort_codes 표와 verify_cohort() 는 이미 만들어 두셨습니다.
-- 'app' 이라는 한 줄만 더 넣으면 앱 문이 그 코드로 열립니다.
insert into cohort_codes (cohort, code_hash, label)
values ('app', extensions.crypt('여기에_학교_초대코드', extensions.gen_salt('bf')), '라인업 앱 초대 코드')
on conflict (cohort) do update
  set code_hash = excluded.code_hash, label = excluded.label, updated_at = now();

-- 확인 — true 가 나와야 합니다
-- select verify_cohort('app', '여기에_학교_초대코드');


-- ── 2. SurfShare 표 ──────────────────────────────────────────
create table if not exists rides (
  id          text primary key,
  user_id     text not null,
  name        text not null,
  cohort      text not null default 'open',
  profile     jsonb not null default '{}',   -- 캐릭터 도트를 그리려고 같이 싣는다
  date        date not null,
  dir         text not null,                 -- 'go' 가는 편 · 'back' 오는 편
  depart_at   text not null,                 -- 'HH:MM'
  from_place  text not null,
  to_place    text not null,
  seats       int  not null default 3,
  riders      jsonb not null default '[]',   -- [{id,name,profile}]
  note        text,
  contact     text,
  created_at  timestamptz default now()
);

create table if not exists stays (
  id          text primary key,
  user_id     text not null,
  name        text not null,
  cohort      text not null default 'open',
  profile     jsonb not null default '{}',
  place       text not null,
  date_from   date not null,
  date_to     date not null,
  capacity    int  not null default 4,
  guests      jsonb not null default '[]',
  price       text,
  lat         double precision,
  lon         double precision,
  perks       jsonb not null default '[]',
  note        text,
  contact     text,
  created_at  timestamptz default now()
);

create index if not exists rides_date_idx on rides (cohort, date desc);
create index if not exists stays_date_idx on stays (cohort, date_from desc);

alter table rides enable row level security;
alter table stays enable row level security;

drop policy if exists "rides read"   on rides;
drop policy if exists "rides write"  on rides;
drop policy if exists "rides update" on rides;
drop policy if exists "rides delete" on rides;
create policy "rides read"   on rides for select using (true);
create policy "rides write"  on rides for insert with check (true);
create policy "rides update" on rides for update using (true) with check (true);
create policy "rides delete" on rides for delete using (true);

drop policy if exists "stays read"   on stays;
drop policy if exists "stays write"  on stays;
drop policy if exists "stays update" on stays;
drop policy if exists "stays delete" on stays;
create policy "stays read"   on stays for select using (true);
create policy "stays write"  on stays for insert with check (true);
create policy "stays update" on stays for update using (true) with check (true);
create policy "stays delete" on stays for delete using (true);


-- ── 3. 꾸미기가 서버에 저장되게 ──────────────────────────────
-- SurfShare에서 캐릭터를 바꾸면 surfers.profile 을 갱신합니다.
-- 그 표에 update 정책이 없으면 조용히 실패하니 열어둡니다.
drop policy if exists "surfers update" on surfers;
create policy "surfers update" on surfers for update using (true) with check (true);


-- ── 확인 ─────────────────────────────────────────────────────
select verify_cohort('app', '여기에_학교_초대코드') as 앱코드_맞나;
select 'rides' as t, count(*) from rides union all select 'stays', count(*) from stays;
