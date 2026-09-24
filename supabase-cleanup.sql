-- ════════════════════════════════════════════════════════════════
-- 마을 청소 — Supabase 대시보드 › SQL Editor 에서 실행
--
-- 브라우저(anon 키)로는 지울 수 없다. surfers·chat 에 delete 정책이 없어서
-- DELETE 요청이 204를 돌려주면서도 아무 행도 안 지운다(RLS가 조용히 걸러낸다).
-- 2026-09-24 실측: DELETE /rest/v1/surfers?id=eq.zz_new → 204, 행은 그대로.
--
-- 남길 사람: infinagree(이성현) · suna(정선아)
-- ════════════════════════════════════════════════════════════════

-- ── 1. 마을 채팅 전체 비우기 ──────────────────────────────────
-- 지금 15개: 테스트봇 7 · 이성현 7 · 정선아 1
delete from chat;

-- ── 2. 테스트 계정 지우기 ────────────────────────────────────
-- QA 스크립트가 만든 계정들. 앱이 로그인 상태를 자동으로 서버에 올리기 때문에
-- (syncUp), 헤드리스 테스트로 로그인만 해도 행이 생긴다.
--   zz / zz_new  = "김나리"  (2026-09-24 QA)
--   zz_hv        = "박바다"  (많이 쌓인 사용자 테스트)
--   zz_q / zz_qa / zz_a / zz_demo / zz_guide / zz_pw / zz_qc / zz_o1 / zz_q5
delete from surfers where id like 'zz%';

-- 딸린 기록도 같이
delete from checkins    where user_id like 'zz%';
delete from parties     where user_id like 'zz%';
delete from ratings     where user_id like 'zz%';
delete from poses       where user_id like 'zz%';
delete from cards       where user_id like 'zz%' or to_name like 'zz%';
delete from attendance  where user_id like 'zz%';

-- ── 3. (선택) 오웬의 예전 중복 계정 ──────────────────────────
-- id 'owen' (cohort 'old', XP 265). 앱에서는 HIDE_IDS로 이미 숨기고 있다.
-- 완전히 지우려면 아래 주석을 풀 것. 지우면 되돌릴 수 없다.
-- delete from surfers where id = 'owen';

-- ── 4. 앞으로는 브라우저에서도 정리할 수 있게 ────────────────
-- 이걸 걸어두면 다음부터 SQL Editor를 안 거쳐도 된다.
-- 공개 리포의 anon 키로 누구나 지울 수 있게 되는 것이므로,
-- 6기 단톡방 사람들만 쓰는 지금 상태에서만 괜찮다는 점을 알고 켤 것.
-- create policy "surfers delete" on surfers for delete using (true);
-- create policy "chat delete"    on chat    for delete using (true);

-- ── 확인 ─────────────────────────────────────────────────────
select id, name, cohort, xp, updated_at from surfers order by updated_at desc;
select count(*) as 남은_채팅 from chat;
