-- ════════════════════════════════════════════════════════════════
-- 맛집·서핑 스팟 댓글 / 대댓글 / 등록 요청 — Supabase 대시보드 › SQL Editor
--
-- 한 표에 셋을 담는다.
--   target = 'food:<북마크id>' | 'spot:<북마크id>'  → 그 가게·스팟에 단 댓글 (parent 가 있으면 대댓글)
--   target = 'add:food' | 'add:spot'                 → 앱에서 바로 등록한 가게·스팟 (title·area·link·pid·text)
--        등록하면 앱 목록에 바로 뜨고, 운영자가 네이버 '양서학' 리스트에 넣으면 같은 장소(pid)를 찾아 ❌ → ⭕ 로 바뀐다.
-- 추천·공감은 이미 있는 reacts 표를 그대로 쓴다(target 'ft:p:…' / 'ft:c:…'). reacts 표가 없다면 supabase-reacts.sql 먼저.
--
-- 앱은 anon 키로 접근한다 — 다른 표(chat·reacts·stay_reviews)와 같은 수준으로 연다.
-- 지운 글을 되살릴 수는 없으니 delete 도 연다(내가 쓴 글을 내가 지운다 — 앱이 본인 글에만 버튼을 보여준다).
-- ════════════════════════════════════════════════════════════════

create table if not exists place_talk (
  id          text primary key,             -- '<user_id>|<밀리초>'
  target      text not null,
  parent      text,                         -- 대댓글이면 위 댓글의 id
  user_id     text not null,
  name        text not null,
  cohort      text not null default 'open', -- '6기' 등 — 글쓴이 옆에 기수로 보인다
  title       text,                         -- 앱 등록: 가게·스팟 이름
  area        text,                         -- 앱 등록: 양양·속초·고성·강릉·기타
  link        text,                         -- 앱 등록: 네이버지도 링크(앱이 네이버 주소만 받는다)
  pid         text,                         -- 앱 등록: 링크에서 뽑은 네이버 장소 번호 — 리스트 반영 여부를 이걸로 맞춘다
  text        text,
  created_at  timestamptz default now()
);

-- 이미 예전 버전으로 만들었다면 빠진 칸만 더한다(다시 실행해도 안전)
alter table place_talk add column if not exists area text;
alter table place_talk add column if not exists pid  text;

create index if not exists place_talk_target_idx on place_talk (target, created_at);
create index if not exists place_talk_recent_idx on place_talk (created_at desc);

alter table place_talk enable row level security;

drop policy if exists "pt read"   on place_talk;
drop policy if exists "pt write"  on place_talk;
drop policy if exists "pt delete" on place_talk;
create policy "pt read"   on place_talk for select using (true);
create policy "pt write"  on place_talk for insert with check (true);
create policy "pt delete" on place_talk for delete using (true);

-- ── 확인 ─────────────────────────────────────────────────────
-- select target, count(*) from place_talk group by 1 order by 2 desc;
