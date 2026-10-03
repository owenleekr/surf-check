-- ════════════════════════════════════════════════════════════════
-- 공개 표에 퍼진 생년월일(birth) 지우기 — Supabase › SQL Editor 에서 실행
--
-- 무슨 일이었나
--   가입 때 적은 생년월일은 비밀번호 재설정(reset_pw)의 인증값이다. 그런데 앱이 내 프로필을
--   통째로 복사해 surfers·chat·checkins·rides… 같은 '누구나 읽는 표'에 올리고 있었다.
--   anon 키는 공개이므로, 그 표를 읽을 수 있는 사람은 누구나 남의 생년월일을 알고
--   reset_pw(아이디, 생년월일, 새 비번)로 비밀번호를 바꿀 수 있었다.
--
-- 이 파일이 하는 일
--   공개 표의 profile 에서 'birth' 키만 뺀다. 다른 값은 그대로다.
--   accounts 표(birth 의 원본)는 건드리지 않는다 — 비밀번호 재설정에 필요하고, anon 은 읽지 못한다.
--
-- 앱 쪽은 이미 고쳐졌다(서프쉐어·라인업 모두 공개 행에 birth 를 안 올린다). 다시 퍼지지 않는다.
-- 다시 실행해도 안전하다(이미 없으면 아무것도 안 바뀐다).
-- ════════════════════════════════════════════════════════════════

-- ① profile 열이 있는 표
do $$
declare t text;
begin
  foreach t in array array['surfers','chat','checkins','reviews','rides','stays'] loop
    begin
      execute format($f$update %I set profile = profile - 'birth' where profile ? 'birth'$f$, t);
      raise notice '% — 정리함', t;
    exception when undefined_table or undefined_column then
      raise notice '% — 건너뜀 (표 또는 profile 열이 없음)', t;
    end;
  end loop;
end $$;

-- ② 참여자 목록 안에 profile 이 들어 있는 표 (번개 joins · 차량 riders · 숙소 guests)
do $$
declare spec text[];
begin
  foreach spec slice 1 in array array[array['parties','joins'], array['rides','riders'], array['stays','guests']] loop
    begin
      execute format($f$
        update %1$I set %2$I = coalesce((
            select jsonb_agg(case when e ? 'profile' and jsonb_typeof(e->'profile') = 'object'
                                  then jsonb_set(e, '{profile}', (e->'profile') - 'birth') else e end)
            from jsonb_array_elements(%2$I) e), '[]'::jsonb)
        where %2$I::text like '%%birth%%'$f$, spec[1], spec[2]);
      raise notice '%.% — 정리함', spec[1], spec[2];
    exception when undefined_table or undefined_column then
      raise notice '%.% — 건너뜀', spec[1], spec[2];
    end;
  end loop;
end $$;

-- ③ 확인 — 전부 0 이어야 한다 (읽기만 한다)
select 'surfers' as 표, count(*) as 남은_birth from surfers where profile ? 'birth'
union all select 'chat',     count(*) from chat     where profile ? 'birth'
union all select 'checkins', count(*) from checkins where profile ? 'birth'
union all select 'reviews',  count(*) from reviews  where profile ? 'birth'
union all select 'rides',    count(*) from rides    where profile ? 'birth' or riders::text like '%birth%'
union all select 'stays',    count(*) from stays    where profile ? 'birth' or guests::text like '%birth%'
union all select 'parties',  count(*) from parties  where joins::text like '%birth%';
