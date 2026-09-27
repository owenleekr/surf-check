-- ════════════════════════════════════════════════════════════════
-- 카카오를 '로그인 수단 하나 더'로 덧붙인다 — Supabase › SQL Editor
--
-- ★ 먼저 Authentication › Providers › Kakao 를 켜 두셔야 합니다.
--   (KAKAO.md 의 ①~⑥. 이 SQL은 그 다음입니다)
--
-- 데이터는 한 줄도 옮기지 않습니다. 왜 안 옮기는지가 이 파일의 요점입니다 —
--   rides.user_id · stays.user_id · stay_reviews.user_id · poses.user_id ·
--   surfers.id · cards.from_id · checkins · parties · ratings …
--   전부 'wavekim' 같은 글자 아이디를 가리킵니다.
--   카카오를 붙인다고 이 키를 uuid 로 갈아치우면 위 표를 전부 동시에 고쳐야 하고,
--   하나라도 어긋나면 남의 차에 내가 타 있게 됩니다.
--   그래서 키는 그대로 두고, accounts 행에 카카오 신분만 매답니다.
--   → 먼저 SurfShare에서 올린 차·숙소·평가가 그대로 따라옵니다. 이전 작업 없음.
-- ════════════════════════════════════════════════════════════════

alter table accounts add column if not exists kakao_uid uuid unique;
create index if not exists accounts_kakao_idx on accounts (kakao_uid);


-- ── 0. 먼저 구멍 하나 막는다 ─────────────────────────────────
-- 카카오 전용 계정은 pw 가 null 입니다. 지금 login() 은 이렇게 돼 있습니다:
--     if r.pw <> crypt(p_pw, r.pw) then raise ...
-- pw 가 null 이면 crypt(…, null) 도 null, null <> null 은 true 가 아니라 null 이라
-- if 가 안 걸리고 **아무 비밀번호나 통과**합니다. 카카오를 붙이기 전에 막습니다.
create or replace function login(p_id text, p_pw text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r accounts; t text;
begin
  select * into r from accounts where id = p_id;
  if r.id is null then raise exception 'nouser'; end if;
  if r.pw is null then raise exception 'kakao_only'; end if;      -- 카카오로만 만든 계정
  if r.pw <> crypt(p_pw, r.pw) then raise exception 'wrongpw'; end if;
  t := encode(gen_random_bytes(16), 'hex');
  update accounts set token = t where id = p_id;
  return jsonb_build_object('token', t, 'name', r.name, 'profile', r.profile,
                            'data', r.data, 'cohort', r.cohort, 'updated_at', r.updated_at);
end $$;


-- ── 1. 카카오로 들어왔다 — 나 누구지? ───────────────────────
-- auth.uid() 는 **카카오 로그인으로 받은 토큰**으로 불러야 값이 나옵니다.
-- anon 키로 부르면 null 이고, 아래 함수는 그때 거절합니다(열어두지 않는다).
create or replace function kakao_whoami()
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare r accounts; t text; u uuid := auth.uid();
begin
  if u is null then raise exception 'nokakao'; end if;
  select * into r from accounts where kakao_uid = u;
  if r.id is null then return jsonb_build_object('linked', false); end if;
  t := encode(gen_random_bytes(16), 'hex');
  update accounts set token = t where id = r.id;
  return jsonb_build_object('linked', true, 'id', r.id, 'token', t, 'name', r.name,
                            'profile', r.profile, 'data', r.data, 'cohort', r.cohort,
                            'haspw', r.pw is not null);
end $$;


-- ── 2. 쓰던 계정에 카카오를 물린다 ──────────────────────────
-- 두 가지를 **동시에** 증명해야 통과합니다:
--   ① 그 계정의 token 을 갖고 있다 (= 방금 그 아이디로 로그인했다)
--   ② 지금 그 카카오로 로그인돼 있다 (= auth.uid())
-- 하나만으로는 남의 계정에 내 카카오를 붙일 수 없습니다.
create or replace function link_kakao(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := auth.uid(); r accounts;
begin
  if u is null then raise exception 'nokakao'; end if;
  select * into r from accounts where id = p_id and token = p_token;
  if r.id is null then raise exception 'unauthorized'; end if;
  if r.kakao_uid is not null and r.kakao_uid <> u then raise exception 'already_linked'; end if;
  if exists (select 1 from accounts where kakao_uid = u and id <> p_id) then
    raise exception 'kakao_taken';                 -- 이 카카오는 다른 아이디가 이미 쓰는 중
  end if;
  update accounts set kakao_uid = u, updated_at = now() where id = p_id;
  return jsonb_build_object('ok', true, 'id', r.id, 'name', r.name);
end $$;


-- ── 3. 카카오로 처음 온 사람 ────────────────────────────────
-- 비밀번호 없는 계정을 만듭니다. 아이디는 글자 아이디 그대로 —
-- 그래야 위의 모든 표가 지금처럼 이 사람을 가리킵니다.
create or replace function kakao_signup(p_id text, p_name text, p_profile jsonb)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare u uuid := auth.uid(); t text;
begin
  if u is null then raise exception 'nokakao'; end if;
  if p_id !~ '^[a-z0-9_]{2,16}$' then raise exception 'badid'; end if;
  if exists (select 1 from accounts where kakao_uid = u) then raise exception 'kakao_taken'; end if;
  if exists (select 1 from accounts where id = p_id) then raise exception 'exists'; end if;
  t := encode(gen_random_bytes(16), 'hex');
  insert into accounts (id, name, pw, token, kakao_uid, cohort, profile)
  values (p_id, p_name, null, t, u, 'open', coalesce(p_profile, '{}'::jsonb));
  return jsonb_build_object('id', p_id, 'token', t, 'name', p_name);
end $$;


-- ── 4. 연결 끊기 ────────────────────────────────────────────
-- 비밀번호가 없는 계정에서 카카오를 떼면 다시 들어올 길이 사라집니다. 막습니다.
create or replace function unlink_kakao(p_id text, p_token text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare r accounts;
begin
  select * into r from accounts where id = p_id and token = p_token;
  if r.id is null then raise exception 'unauthorized'; end if;
  if r.pw is null then raise exception 'needpw';   -- 먼저 비밀번호를 정하세요
  end if;
  update accounts set kakao_uid = null, updated_at = now() where id = p_id;
  return true;
end $$;


-- ── 5. 카카오만 쓰던 사람이 비밀번호를 새로 정할 때 ─────────
create or replace function set_pw(p_id text, p_token text, p_new text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare r accounts;
begin
  select * into r from accounts where id = p_id and token = p_token;
  if r.id is null then raise exception 'unauthorized'; end if;
  if r.pw is not null then raise exception 'haspw'; end if;   -- 바꾸는 건 change_pw
  if length(p_new) < 4 then raise exception 'badpw'; end if;
  update accounts set pw = crypt(p_new, gen_salt('bf')), updated_at = now() where id = p_id;
  return true;
end $$;


-- ── 권한 ────────────────────────────────────────────────────
-- auth.uid() 를 쓰는 셋은 카카오 토큰으로만 부르므로 authenticated 에만 엽니다.
grant execute on function kakao_whoami()                    to authenticated;
grant execute on function link_kakao(text,text)             to authenticated;
grant execute on function kakao_signup(text,text,jsonb)     to authenticated;
grant execute on function unlink_kakao(text,text)           to anon, authenticated;
grant execute on function set_pw(text,text,text)            to anon, authenticated;


-- ── 확인 ────────────────────────────────────────────────────
select column_name, data_type from information_schema.columns
 where table_name = 'accounts' and column_name = 'kakao_uid';
select count(*) as 계정수, count(kakao_uid) as 카카오물린수 from accounts;
