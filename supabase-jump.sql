-- ════════════════════════════════════════════════════════════════
-- 파도 점프 단독 페이지(/jump) 공개 순위표 — Supabase › SQL Editor
--
-- 로그인 없이 이름만 넣고 하는 사람들의 점수. 쓰기만 열고(고치기·지우기는 막음),
-- 이름 길이·점수 범위·날짜를 표가 직접 검사한다. 점수는 브라우저가 보내므로 조작할 수 있다 — 재미용 순위표.
-- 표가 없어도 /jump 는 동작한다(순위 없이 이 기기에만 기록).
-- ════════════════════════════════════════════════════════════════

create table if not exists jump_scores (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 12),
  mode        text not null check (mode in ('easy','hard','daily')),
  day         date not null,
  score       int  not null check (score between 0 and 200000),
  created_at  timestamptz default now()
);
create index if not exists jump_scores_rank_idx on jump_scores (mode, day, score desc);

alter table jump_scores enable row level security;
drop policy if exists "js read"  on jump_scores;
drop policy if exists "js write" on jump_scores;
create policy "js read"  on jump_scores for select using (true);
create policy "js write" on jump_scores for insert with check (day between current_date - 1 and current_date + 1);
-- update·delete 정책은 만들지 않는다 = 아무도 못 고치고 못 지운다(운영자는 대시보드에서)

-- 확인
select 'jump_scores 표 있음(1이면 정상)' as 확인, count(*) from information_schema.tables where table_name = 'jump_scores';
