-- ════════════════════════════════════════════════════════════════
-- 찌꺼기 정리 + 번개 삭제 권한 — Supabase 대시보드 › SQL Editor
--
-- ⚠️ 지우는 줄이 있습니다. 하나씩 읽고 돌리세요.
--    (지난번에 제가 delete from chat 을 섞어 드려서 진짜 대화가 날아갔습니다.
--     여기서는 지우는 대상을 아이디로 정확히 찍었습니다.)
-- ════════════════════════════════════════════════════════════════

-- ── 1. 지금 뭐가 있는지 먼저 봅니다 ──────────────────────────
select 'surfers' t, id, name from surfers  where id in ('t','owen')
union all
select 'parties', id, name from parties  where user_id like '\_probe\_%'
union all
select 'accounts', id, name from accounts where id in ('t','owen');


-- ── 2. 제가 만든 테스트 줄 ───────────────────────────────────
-- parties 의 _probe_ 는 오류 원인을 찾느라 제가 넣은 것입니다. 지우셔도 됩니다.
delete from parties where user_id like '\_probe\_%';

-- 'owen' 은 이성현 중복 계정(진짜는 infinagree), 't' 는 QA 계정입니다.
delete from surfers  where id in ('t','owen');
delete from checkins where user_id in ('t','owen');
delete from accounts where id in ('t','owen');


-- ── 3. 번개 '글 지우기'가 실제로 지워지게 ────────────────────
-- parties 에는 select·insert·update 정책만 있어서 삭제가 조용히 막힙니다
-- (204 가 돌아오는데 0행이 지워집니다 — 그래서 화면은 성공처럼 보입니다).
drop policy if exists "parties delete" on parties;
create policy "parties delete" on parties for delete using (true);


-- ── 4. 정선아 님 다시 세우기 (계정이 남아 있다면) ────────────
insert into surfers (id, name, cohort, profile)
select id, name, coalesce(cohort,'open'), coalesce(profile,'{}'::jsonb)
from accounts where name = '정선아'
on conflict (id) do nothing;


-- ── 확인 ─────────────────────────────────────────────────────
select (select count(*) from parties) as 번개,
       (select count(*) from surfers) as 마을;
select id, name, cohort from surfers order by name;
