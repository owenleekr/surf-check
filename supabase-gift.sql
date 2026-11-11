-- ════════════════════════════════════════════════════════════════
-- 🎁 빼빼로데이 기프티콘 나눠 주기 (2026-11-11) — Supabase › SQL Editor
--
-- 기프티콘 그림(바코드)은 돈이다. 저장소·정적 파일에 두면 누구나 내려받는다.
-- 그래서 비공개 표(gift_pool)에만 두고, 서버 함수가 한 이름에 한 장만 무작위로 배정한다.
--   gift_claim(이름, 토큰) — 처음이면 남은 것 중 하나를 배정(빼빼로 15·베라 9, 정확히 그 수만큼만)
--   gift_open(이름, 토큰)  — 배정받은 그 기기(토큰)만 기프티콘 그림을 연다
-- 토큰은 뽑은 폰에서 만든 무작위 값이라, 남이 이름만 알아서는 그림을 못 연다.
-- 그림 올리기용 gift_seed_add 는 한 번 쓰고 gift_seed 를 비우면 막힌다.
-- ════════════════════════════════════════════════════════════════
create extension if not exists pgcrypto;

create table if not exists gift_pool (
  id serial primary key,
  kind text not null check (kind in ('pepero','br')),
  img text not null,
  assigned_to text unique,
  token_hash text,
  assigned_at timestamptz
);
alter table gift_pool enable row level security;      -- 정책 없음 = anon 직접 접근 불가
revoke all on gift_pool from anon, authenticated;

create table if not exists gift_seed (h text not null);
alter table gift_seed enable row level security;
revoke all on gift_seed from anon, authenticated;

create or replace function gift_seed_add(p_secret text, p_kind text, p_img text) returns int
language plpgsql security definer set search_path = public, extensions as $$
declare n int;
begin
  if not exists (select 1 from gift_seed where h = crypt(p_secret, h)) then raise exception 'noseed'; end if;
  if p_kind not in ('pepero','br') or p_img !~ '^data:image/(jpeg|png|webp);base64,' or length(p_img) > 900000 then raise exception 'bad'; end if;
  insert into gift_pool (kind, img) values (p_kind, p_img) returning id into n;
  return n;
end $$;

create or replace function _gift_name_ok(p_name text) returns boolean language sql immutable as $$
  select p_name = any (array['김도훈','김태은','심재영','이나영','이미진','정선아','조혜미','허예령','홍미영','최원재','장은옥',
    '박초롱','이한솔','정유정','전영훈','전인수','엄주승','장베드로','이승대','김나리','이해룡','이상문','장진혁','김법성'])
$$;

create or replace function gift_claim(p_name text, p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare r gift_pool; pick int;
begin
  if not _gift_name_ok(p_name) then raise exception 'noname'; end if;
  if char_length(coalesce(p_token, '')) < 16 then raise exception 'notoken'; end if;
  select * into r from gift_pool where assigned_to = p_name;
  if r.id is not null then
    return jsonb_build_object('kind', r.kind, 'mine', r.token_hash = crypt(p_token, r.token_hash));
  end if;
  if now() >= timestamptz '2026-11-12 00:00:00+09' then return jsonb_build_object('kind', null, 'closed', true); end if;   -- 11/12 자정에 새 지급 마감(받은 이름은 계속 열 수 있음)
  select id into pick from gift_pool where assigned_to is null order by random() limit 1 for update skip locked;
  if pick is null then return jsonb_build_object('kind', null, 'soldout', true); end if;
  update gift_pool set assigned_to = p_name, token_hash = crypt(p_token, gen_salt('bf', 6)), assigned_at = now()
    where id = pick returning * into r;
  return jsonb_build_object('kind', r.kind, 'mine', true);
end $$;

create or replace function gift_open(p_name text, p_token text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare r gift_pool;
begin
  perform pg_sleep(0.3);
  select * into r from gift_pool where assigned_to = p_name;
  if r.id is null or r.token_hash is null or r.token_hash <> crypt(coalesce(p_token, ''), r.token_hash) then raise exception 'nogift'; end if;
  return r.img;
end $$;

-- 운영자(/stats 열쇠)만: 누가 무엇을 받았는지(그림은 빼고)
create or replace function admin_gifts(p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not _is_admin(p_key) then return jsonb_build_object('error', 'noadmin'); end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'name', assigned_to, 'at', assigned_at) order by id) from gift_pool), '[]'::jsonb);
end $$;

revoke all on function gift_seed_add(text, text, text), gift_claim(text, text), gift_open(text, text), admin_gifts(text), _gift_name_ok(text) from public;
grant execute on function gift_seed_add(text, text, text), gift_claim(text, text), gift_open(text, text), admin_gifts(text) to anon, authenticated;

-- 그림을 다 올린 뒤:  delete from gift_seed;   (올리기 함수가 다시는 안 열린다)
-- 남은 수 보기:      select kind, count(*) filter (where assigned_to is null) as 남음, count(*) as 전체 from gift_pool group by kind;
-- 배정 하나 풀기:    update gift_pool set assigned_to = null, token_hash = null, assigned_at = null where assigned_to = '이름';
