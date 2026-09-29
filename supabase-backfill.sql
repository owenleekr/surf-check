-- ════════════════════════════════════════════════════════════════
-- 이미 가입한 사람을 마을에 세운다 — Supabase 대시보드 › SQL Editor
--
-- SurfShare 가입은 accounts 에만 들어갑니다(rpc signup). 마을은 surfers 를 읽습니다.
-- 그래서 쉐어로만 가입한 분들은 계정은 멀쩡한데 마을에 아예 안 떴습니다.
-- 앱은 이제 들어올 때 자리를 만들지만, 이미 가입한 분들은 이 한 번이 필요합니다.
--
-- 기존 surfers 행이 있으면 이름·기수만 맞추고 profile(캐릭터)은 건드리지 않습니다.
-- ════════════════════════════════════════════════════════════════

-- ── 지금 상태 ────────────────────────────────────────────────
select (select count(*) from accounts) as 가입자,
       (select count(*) from surfers)  as 마을에_선_사람;

select a.id, a.name, a.cohort,
       (s.id is not null) as 마을에_있나
from accounts a left join surfers s on s.id = a.id
order by a.created_at;


-- ── 채워 넣기 ────────────────────────────────────────────────
insert into surfers (id, name, cohort, profile)
select a.id, a.name, coalesce(a.cohort, 'open'), coalesce(a.profile, '{}'::jsonb)
from accounts a
on conflict (id) do update
  set name   = excluded.name,
      cohort = excluded.cohort;     -- profile 은 그대로 둡니다(본인이 꾸민 것)


-- ── 확인 ─────────────────────────────────────────────────────
select id, name, cohort from surfers order by name;
