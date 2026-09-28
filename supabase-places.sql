-- ════════════════════════════════════════════════════════════════
-- 숙소 정보판 — Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run
--
-- rides·stays 는 "내가 이번 주에 잡은 방"이라 올린 사람 것입니다.
-- 이 표는 다릅니다 — "낙산에 어떤 숙소가 있나"라는 **같이 쌓는 정보**입니다.
-- 그래서 누구나 고칠 수 있게 열어두고, 대신 **누가 무엇을 언제 고쳤는지 남깁니다.**
-- 잠그는 대신 보이게 하는 쪽을 골랐습니다. 20명이 쓰는 곳에서는 그게 더 잘 굴러갑니다.
--
-- 씨앗 8곳은 on conflict do nothing 이라 다시 실행해도 남의 수정을 덮어쓰지 않습니다.
-- ════════════════════════════════════════════════════════════════

create table if not exists places (
  id           text primary key,
  name         text not null,
  kind         text,                            -- 호텔 · 콘도 · 펜션 · 민박 · 스테이
  lat          double precision,
  lon          double precision,
  addr         text,
  phone        text,
  note         text,
  perks        jsonb not null default '[]',
  updated_at   timestamptz default now(),
  updated_by   text,
  updated_name text
);

-- 누가 무엇을 어떻게 고쳤는지. 지우지 않습니다 — 지울 수 있으면 기록이 아닙니다.
create table if not exists place_edits (
  id         text primary key,
  place_id   text not null,
  place_name text,
  user_id    text not null,
  name       text not null,
  field      text not null,                     -- '이름' '좌표' '한마디' …
  before     text,
  after      text,
  created_at timestamptz default now()
);
create index if not exists place_edits_idx on place_edits (place_id, created_at desc);
create index if not exists place_edits_all on place_edits (created_at desc);

alter table places      enable row level security;
alter table place_edits enable row level security;

drop policy if exists "places read"   on places;
drop policy if exists "places write"  on places;
drop policy if exists "places update" on places;
create policy "places read"   on places for select using (true);
create policy "places write"  on places for insert with check (true);
create policy "places update" on places for update using (true) with check (true);
-- delete 정책은 일부러 없습니다. 정보판에서 남의 항목을 지울 수 있으면 안 됩니다.

drop policy if exists "edits read"  on place_edits;
drop policy if exists "edits write" on place_edits;
create policy "edits read"  on place_edits for select using (true);
create policy "edits write" on place_edits for insert with check (true);
-- update·delete 정책 없음 = 기록은 고쳐지지도 지워지지도 않습니다.


-- ── 씨앗 ─────────────────────────────────────────────────────
-- 좌표는 OpenStreetMap 에서 확인한 값입니다(2026-09-28).
-- '낙산 스테이'만 아고다에 올라온 주소(강현면 주청2길 28)를 지오코딩해 넣었습니다.
-- 거리는 양양서핑학교(양양읍 일출로 159-12, 조산리) 기준.
insert into places (id, name, kind, lat, lon, addr, note, perks, updated_name) values
 ('dignity','디그니티 호텔','호텔',38.10858,128.64053,'양양읍 일출로 159-5',
  '학교 바로 옆. 전 객실 스위트(투룸형)라 넓고 4명 이상도 지낼 수 있어요. 1층에 식당·펍. 주차는 뒷편 공영주차장도 쓸 수 있습니다.',
  '["해변 도보","주차","조식"]','씨앗'),
 ('beachcondo','양양비치콘도','콘도',38.10852,128.64130,'양양읍 일출로',
  '전 객실에 주방이 있어 간단한 취사가 됩니다(고기·생선처럼 연기 나는 조리는 제한). 낙산해변과 남대천이 만나는 자리.',
  '["해변 도보","주차","취사"]','씨앗'),
 ('songlim','송림마을펜션','펜션',38.11077,128.63852,null,
  '학교에서 걸어서 갈 만한 거리. 다녀오신 분이 채워주세요.','[]','씨앗'),
 ('freya','프레야 낙산콘도','콘도',38.11156,128.63755,null,
  '지도에는 있는데 그 밖으로는 확인이 안 됐어요. 아시는 분이 고쳐주세요.','[]','씨앗'),
 ('chamsae','참새방앗간 민박','민박',38.10953,128.63587,null,
  '다녀오신 분이 채워주세요.','[]','씨앗'),
 ('salmon','연어의 고향','민박',38.10919,128.63504,'양양읍 동해신묘길',
  '다녀오신 분이 채워주세요.','[]','씨앗'),
 ('neuti','낙산느티나무민박','민박',38.10965,128.63342,null,
  '다녀오신 분이 채워주세요.','[]','씨앗'),
 ('naksanstay','낙산 스테이','스테이',38.11778,128.62971,'양양군 강현면 주청2길 28',
  '단톡방에 나온 곳(추석 방 쉐어 이야기). 낙산해변까지 290m, 다만 **학교와는 반대쪽**이라 1.4km·걸어서 19분 걸립니다(학교는 남쪽 조산리, 여기는 북쪽 주청리). 바비큐 시설과 숙소 내 주차가 있고 엘리베이터·반려동물은 안 됩니다. 아고다 평점 9.5(7건)로 청결 평이 특히 좋습니다.',
  '["해변 도보","주차"]','씨앗')
on conflict (id) do nothing;


-- ── 확인 ─────────────────────────────────────────────────────
select id, name, kind, (lat is not null) as 좌표있음, updated_name as 마지막수정 from places order by name;
select count(*) as 수정기록 from place_edits;
