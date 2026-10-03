-- ════════════════════════════════════════════════════════════════
-- 비밀번호 재설정에 시도 횟수 잠금 — Supabase › SQL Editor 에서 실행
-- (supabase-scrub-birth.sql 을 먼저 실행하세요)
--
-- 왜
--   reset_pw 는 6자리 생년월일만 맞으면 비밀번호를 바꿔 준다. 경우의 수는 수만 개뿐이고,
--   anon 키는 공개라 누구나 이 함수를 반복 호출할 수 있다. 0.7초 지연만으로는 병렬 호출을 못 막는다.
--
-- 무엇을 바꾸나
--   · 같은 아이디로 틀린 시도가 30분 안에 5번 쌓이면 잠근다('locked').
--   · 틀린 시도 기록이 남으려면 함수가 예외로 끝나면 안 된다(예외는 그 기록까지 되돌린다).
--     그래서 실패를 예외 대신 글자로 돌려준다: ok / nouser / nobirth / badpw / wrongbirth / locked
--     (반환형이 바뀌므로 기존 함수를 지우고 다시 만든다.)
--   · 앱(라인업 school.html)의 재설정 화면은 이미 이 응답을 이해하도록 고쳐 두었다.
--
-- 감수하는 것: 남이 일부러 틀린 시도를 쌓아 내 재설정을 30분간 막을 수 있다.
--   비번을 못 바꾸게 하는 것이지 계정을 뺏는 게 아니므로 이쪽이 낫다.
-- ════════════════════════════════════════════════════════════════

begin;

create table if not exists reset_tries (
  id  text not null,
  at  timestamptz not null default now()
);
create index if not exists reset_tries_idx on reset_tries (id, at desc);
alter table reset_tries enable row level security;      -- 정책을 만들지 않는다 = anon 은 읽지도 쓰지도 못한다

drop function if exists reset_pw(text, text, text);
create function reset_pw(p_id text, p_birth text, p_new text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare r accounts; n int;
begin
  perform pg_sleep(0.7);
  delete from reset_tries where at < now() - interval '1 day';
  select count(*) into n from reset_tries where id = p_id and at > now() - interval '30 minutes';
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

-- 확인: 틀린 생년월일로 6번 불러 보면 6번째에 'locked' 가 나와야 한다 (존재하는 아이디로).
-- select reset_pw('아이디', '000000', 'test1234');
