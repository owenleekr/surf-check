-- ════════════════════════════════════════════════════════════════
-- 숙소에 "실제로 낸 돈"을 남긴다 — Supabase › SQL Editor
--
-- 예약 사이트 요금을 앱에 박아 두면 조용히 썩는다. 날짜·객실·플랫폼마다 다르고
-- 성수기엔 두 배가 된다. 그래서 값을 적지 않고, 다녀온 사람이 낸 돈을 남기게 한다.
-- 틀릴 수는 있어도 낡지는 않는다. 성수기·비수기 차이는 저절로 폭으로 나타난다.
-- ════════════════════════════════════════════════════════════════

alter table stay_reviews add column if not exists paid int;   -- 1인 1박 기준, 원

-- ── 확인 ─────────────────────────────────────────────────────
select place, count(*) as 평가, round(avg(stars),1) as 별점,
       min(paid) as 최저, round(avg(paid)) as 평균, max(paid) as 최고
from stay_reviews group by place order by 평가 desc;
