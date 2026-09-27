-- ════════════════════════════════════════════════════════════════
-- SurfShare — 차량·숙소 나눠 타기 / 나눠 쓰기
-- Supabase 대시보드 › SQL Editor 에서 실행
--
-- 지금은 "누구 차 타고 가세요?"를 단톡방에서 매주 다시 묻는다.
-- 글이 흘러가버려서 어제 누가 뭘 올렸는지 찾을 수가 없다.
-- ════════════════════════════════════════════════════════════════

-- ── 차량 ─────────────────────────────────────────────────────
create table if not exists rides (
  id          text primary key,            -- '<user_id>|<timestamp>'
  user_id     text not null,
  name        text not null,
  cohort      text not null default '6기', -- 기수끼리만 보인다
  date        date not null,
  dir         text not null,               -- 'go' 가는 편 · 'back' 오는 편
  depart_at   text not null,               -- 'HH:MM'
  from_place  text not null,
  to_place    text not null,
  seats       int  not null default 3,     -- 태울 수 있는 총 인원
  riders      jsonb not null default '[]', -- [{id,name}] 탄 사람
  note        text,
  contact     text,                        -- 오픈채팅 링크 등. 전화번호는 넣지 말라고 안내한다
  created_at  timestamptz default now()
);

-- ── 숙소 ─────────────────────────────────────────────────────
create table if not exists stays (
  id          text primary key,
  user_id     text not null,
  name        text not null,               -- 올린 사람
  cohort      text not null default '6기',
  place       text not null,               -- 숙소 이름
  date_from   date not null,
  date_to     date not null,
  capacity    int  not null default 4,     -- 총 몇 명
  guests      jsonb not null default '[]', -- [{id,name}]
  price       text,                        -- '1인 2만' 처럼 자유 입력
  lat         double precision,            -- 낙산 기준 지도에 찍기 위함
  lon         double precision,
  perks       jsonb not null default '[]', -- ['온수 샤워','보드 보관','주차'] 등
  note        text,
  contact     text,
  created_at  timestamptz default now()
);

create index if not exists rides_date_idx on rides (cohort, date desc);
create index if not exists stays_date_idx on stays (cohort, date_from desc);

alter table rides enable row level security;
alter table stays enable row level security;

-- 앱은 anon 키로 접근한다. 다른 테이블과 같은 수준으로 연다.
do $$ begin
  for t in select unnest(array['rides','stays']) loop end loop;
end $$;

drop policy if exists "rides read"   on rides;
drop policy if exists "rides write"  on rides;
drop policy if exists "rides update" on rides;
drop policy if exists "rides delete" on rides;
create policy "rides read"   on rides for select using (true);
create policy "rides write"  on rides for insert with check (true);
create policy "rides update" on rides for update using (true) with check (true);  -- 좌석에 이름 넣고 빼기
create policy "rides delete" on rides for delete using (true);                    -- 올린 사람이 내리기

drop policy if exists "stays read"   on stays;
drop policy if exists "stays write"  on stays;
drop policy if exists "stays update" on stays;
drop policy if exists "stays delete" on stays;
create policy "stays read"   on stays for select using (true);
create policy "stays write"  on stays for insert with check (true);
create policy "stays update" on stays for update using (true) with check (true);
create policy "stays delete" on stays for delete using (true);

-- ── 확인 ─────────────────────────────────────────────────────
select 'rides' as t, count(*) from rides union all select 'stays', count(*) from stays;
