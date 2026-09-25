-- ════════════════════════════════════════════════════════════════
-- 6기 인증 암호 — Supabase 대시보드 › SQL Editor 에서 실행
--
-- 암호를 앱 코드에 넣으면 안 된다. 이 리포는 공개이고, 공개 아니어도
-- 브라우저로 내려가는 JS는 누구나 읽는다. 그래서 서버에서만 비교한다.
--
-- 구조:
--   cohort_codes 테이블 — 암호를 bcrypt 해시로 보관. select 정책 없음 = anon 키로 못 읽음
--   verify_cohort() RPC — SECURITY DEFINER 라 함수 안에서만 테이블에 닿는다.
--                         맞으면 true, 틀리면 false만 돌려준다(해시를 밖으로 내보내지 않음)
-- ════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto with schema extensions;

create table if not exists cohort_codes (
  cohort      text primary key,
  code_hash   text not null,
  label       text,
  updated_at  timestamptz default now()
);

alter table cohort_codes enable row level security;
-- 정책을 하나도 만들지 않는다 = anon 키로는 select·insert·update 전부 막힘.
-- 아래 함수만 security definer 로 통과한다.

-- ── 암호 넣기 ────────────────────────────────────────────────
-- ★ '여기에_학교_암호' 를 실제 암호로 바꿔서 실행하세요.
--   실행 후 이 창을 지우면 암호는 해시로만 남습니다.
insert into cohort_codes (cohort, code_hash, label)
values ('6기', extensions.crypt('여기에_학교_암호', extensions.gen_salt('bf')), '양양서핑학교 6기')
on conflict (cohort) do update
  set code_hash = excluded.code_hash, label = excluded.label, updated_at = now();

-- ── 검증 함수 ────────────────────────────────────────────────
create or replace function verify_cohort(p_cohort text, p_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare h text;
begin
  select code_hash into h from cohort_codes where cohort = p_cohort;
  if h is null then return false; end if;                 -- 없는 기수 = 통과 불가
  return h = extensions.crypt(p_code, h);
end;
$$;

revoke all on function verify_cohort(text, text) from public;
grant execute on function verify_cohort(text, text) to anon, authenticated;

-- ── 확인 ─────────────────────────────────────────────────────
-- select verify_cohort('6기', '여기에_학교_암호');   → true
-- select verify_cohort('6기', '아무거나');           → false
-- select * from cohort_codes;                        → SQL Editor에서는 보임(서비스 롤), 앱에서는 안 보임

-- ── 암호를 바꾸고 싶을 때 ────────────────────────────────────
-- update cohort_codes set code_hash = extensions.crypt('새_암호', extensions.gen_salt('bf')),
--        updated_at = now() where cohort = '6기';

-- ── 이미 가입한 20명을 6기로 인정해 두기 ─────────────────────
-- 기존 계정은 전부 명단에서 고르고 가입한 사람들이므로 인증된 것으로 본다.
update surfers set cohort = '6기' where cohort = '6기' or cohort is null;
