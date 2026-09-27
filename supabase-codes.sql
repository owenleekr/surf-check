-- ════════════════════════════════════════════════════════════════
-- 문 두 개, 비번 두 개 — Supabase 대시보드 › SQL Editor 에 통째로 붙여넣고 Run
--
--   share  →  SurfShare (surf.owenai.xyz 대문). 6기 단톡방에 뿌릴 비번.
--   app    →  학교 (라인업 앱, /school). 소수에게만 줄 초대 코드.
--
-- ★ 반드시 서로 다른 값으로 바꾸세요. 아래 두 줄의 따옴표 안만 고치면 됩니다.
--   share 비번은 단톡방에 도는 순간 사실상 공개된 것으로 치세요.
--   그래도 app 은 안 열립니다 — 그게 문을 둘로 나눈 이유입니다.
--
-- 비번은 bcrypt 해시로만 남습니다. 실행 뒤 이 편집기 창을 비워 두세요.
-- ════════════════════════════════════════════════════════════════

insert into cohort_codes (cohort, code_hash, label) values
  ('share', extensions.crypt('여기에_서프쉐어_비번', extensions.gen_salt('bf')), 'SurfShare 입장'),
  ('app',   extensions.crypt('여기에_학교_초대코드', extensions.gen_salt('bf')), '학교(라인업) 초대')
on conflict (cohort) do update
  set code_hash = excluded.code_hash, label = excluded.label, updated_at = now();

-- ── 확인 — 왼쪽 두 칸 true, 오른쪽 한 칸 false 여야 맞습니다 ──
select verify_cohort('share', '여기에_서프쉐어_비번')  as 쉐어_열림,
       verify_cohort('app',   '여기에_학교_초대코드')  as 학교_열림,
       verify_cohort('app',   '여기에_서프쉐어_비번')  as 쉐어비번으로_학교_열림;
