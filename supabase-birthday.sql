-- ════════════════════════════════════════════════════════════════
-- 🎂 오늘의 생일 — Supabase › SQL Editor 에서 한 번 실행
--
-- 왜 함수인가
--   생년월일(accounts.profile.birth)은 비밀번호 재설정 열쇠라 앱이 직접 읽을 수 없다(2026-10-11 정리).
--   그래서 서버가 "오늘(한국 시간) 생일인 사람"의 아이디·이름만 돌려준다. 날짜·연도는 내보내지 않는다.
--   본인이 서프쉐어 설정에서 「생일 알리기」를 끄면(surfers.profile.bdoff = 1) 빠진다.
--   2월 29일생은 평년엔 2월 28일에 축하받는다.
--
-- 함께 바꾸는 것 — 재설정 잠금을 30분 → 하루로
--   생일(월·일)이 알려지면 재설정에서 맞혀야 할 건 태어난 해뿐이다(수십 가지).
--   30분에 5번이면 몇 시간 만에 다 시도할 수 있어서, 같은 아이디는 하루 5번까지로 줄인다.
--   (라인업 school.html 의 'locked' 문구도 "내일 다시"로 고쳐 두었다.)
--
-- 축하 댓글은 이미 있는 place_talk 표를 쓴다(target = 'bd:<아이디>:<연도>'). 새 표 없음.
-- ════════════════════════════════════════════════════════════════

begin;

create or replace function birthdays_today()
returns table (id text, name text, cohort text)
language sql stable security definer set search_path = public as $$
  with t as (select (now() at time zone 'Asia/Seoul')::date as d)
  select s.id, coalesce(s.name, a.name), coalesce(s.cohort, a.cohort, 'open')
  from accounts a
  join surfers s on s.id = a.id
  cross join t
  where coalesce(a.profile->>'birth', '') ~ '^\d{6}$'
    and coalesce(s.profile->>'bdoff', '') <> '1'
    and (
      substr(a.profile->>'birth', 3, 4) = to_char(t.d, 'MMDD')
      or (substr(a.profile->>'birth', 3, 4) = '0229' and to_char(t.d, 'MMDD') = '0228'
          and extract(day from (date_trunc('year', t.d) + interval '2 month' - interval '1 day')) = 28)
    )
  order by 2
$$;
revoke all on function birthdays_today() from public;
grant execute on function birthdays_today() to anon;

create or replace function reset_pw(p_id text, p_birth text, p_new text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare r accounts; n int;
begin
  perform pg_sleep(0.7);
  delete from reset_tries where at < now() - interval '1 day';
  select count(*) into n from reset_tries where id = p_id and at > now() - interval '1 day';
  if n >= 5 then return 'locked'; end if;
  select * into r from accounts where id = p_id;
  if r.id is null then return 'nouser'; end if;
  if coalesce(r.profile->>'birth','') = '' then return 'nobirth'; end if;
  if length(coalesce(p_new,'')) < 4 then return 'badpw'; end if;
  if r.profile->>'birth' <> regexp_replace(coalesce(p_birth,''), '\D', '', 'g') then
    insert into reset_tries (id) values (p_id);
    return 'wrongbirth';
  end if;
  update accounts set pw = crypt(p_new, gen_salt('bf')), token = encode(gen_random_bytes(16), 'hex') where id = p_id;
  delete from reset_tries where id = p_id;
  return 'ok';
end $$;
grant execute on function reset_pw(text, text, text) to anon;

commit;

-- 확인: 오늘 생일인 사람이 있으면 아이디·이름·기수가, 없으면 빈 결과가 나온다(날짜는 안 나온다).
-- select * from birthdays_today();
