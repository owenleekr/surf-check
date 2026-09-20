-- ─────────────────────────────────────────────────────────────
-- 2차: 계정을 서버에 두기 (아이디·비번으로 어느 폰에서든 로그인)
-- Supabase → SQL Editor → 전체 붙여넣고 Run. 이미 실행한 건 다시 실행해도 안전.
-- 비밀번호는 bcrypt로 저장되고, 테이블은 직접 읽을 수 없다(정책 없음). 아래 함수로만 접근.
-- ─────────────────────────────────────────────────────────────
create extension if not exists pgcrypto;

create table if not exists accounts (
  id text primary key,
  name text, pw text, token text, cohort text default '6기',
  profile jsonb default '{}'::jsonb, data jsonb default '{}'::jsonb,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
alter table accounts enable row level security;   -- 정책 없음 = anon 직접 조회 불가

create or replace function signup(p_id text, p_name text, p_pw text, p_profile jsonb)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare t text;
begin
  if p_id !~ '^[a-z0-9_]{2,16}$' then raise exception 'badid'; end if;
  if length(p_pw) < 4 then raise exception 'badpw'; end if;
  if exists (select 1 from accounts where id = p_id) then raise exception 'exists'; end if;
  t := encode(gen_random_bytes(16), 'hex');
  insert into accounts (id, name, pw, token, profile) values (p_id, p_name, crypt(p_pw, gen_salt('bf')), t, coalesce(p_profile, '{}'::jsonb));
  return t;
end $$;

create or replace function login(p_id text, p_pw text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r accounts; t text;
begin
  select * into r from accounts where id = p_id;
  if r.id is null then raise exception 'nouser'; end if;
  if r.pw <> crypt(p_pw, r.pw) then raise exception 'wrongpw'; end if;
  t := encode(gen_random_bytes(16), 'hex');
  update accounts set token = t where id = p_id;
  return jsonb_build_object('token', t, 'name', r.name, 'profile', r.profile, 'data', r.data, 'updated_at', r.updated_at);
end $$;

create or replace function save_data(p_id text, p_token text, p_data jsonb, p_profile jsonb, p_name text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  update accounts set data = coalesce(p_data, data), profile = coalesce(p_profile, profile), name = coalesce(p_name, name), updated_at = now()
   where id = p_id and token = p_token;
  if not found then raise exception 'unauthorized'; end if;
  return true;
end $$;

create or replace function load_data(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r accounts;
begin
  select * into r from accounts where id = p_id and token = p_token;
  if r.id is null then raise exception 'unauthorized'; end if;
  return jsonb_build_object('name', r.name, 'profile', r.profile, 'data', r.data, 'updated_at', r.updated_at);
end $$;

create or replace function change_pw(p_id text, p_token text, p_old text, p_new text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare r accounts;
begin
  select * into r from accounts where id = p_id and token = p_token;
  if r.id is null or r.pw <> crypt(p_old, r.pw) then raise exception 'unauthorized'; end if;
  if length(p_new) < 4 then raise exception 'badpw'; end if;
  update accounts set pw = crypt(p_new, gen_salt('bf')) where id = p_id;
  return true;
end $$;

grant execute on function signup(text,text,text,jsonb), login(text,text), save_data(text,text,jsonb,jsonb,text), load_data(text,text), change_pw(text,text,text,text) to anon;

-- 코치 출석부 (아직 안 만들었다면)
create table if not exists attendance (
  id text primary key, name text, date date, present boolean, week int, by_id text,
  updated_at timestamptz default now()
);
alter table attendance enable row level security;
do $$ begin
  create policy "att read"   on attendance for select using (true);
  create policy "att insert" on attendance for insert with check (true);
  create policy "att update" on attendance for update using (true);
exception when duplicate_object then null; end $$;

-- ─── 전체 리셋 (테스트 데이터 지우기). 필요할 때만 주석 풀고 실행 ───
-- delete from surfers; delete from cards; delete from attendance; delete from accounts;

-- 비밀번호 재설정: 가입 때 적은 생년월일 6자리(profile.birth)와 맞으면 새 비번으로. 무차별 대입 완화용 0.7초 지연
create or replace function reset_pw(p_id text, p_birth text, p_new text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare r accounts;
begin
  perform pg_sleep(0.7);
  select * into r from accounts where id = p_id;
  if r.id is null then raise exception 'nouser'; end if;
  if coalesce(r.profile->>'birth','') = '' then raise exception 'nobirth'; end if;
  if r.profile->>'birth' <> regexp_replace(p_birth, '\D', '', 'g') then raise exception 'wrongbirth'; end if;
  if length(p_new) < 4 then raise exception 'badpw'; end if;
  update accounts set pw = crypt(p_new, gen_salt('bf')), token = encode(gen_random_bytes(16), 'hex') where id = p_id;
  return true;
end $$;
grant execute on function reset_pw(text,text,text) to anon;
