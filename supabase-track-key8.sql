-- 운영자 열쇠 8자 이상 + 1시간 10번 틀리면 잠금 (2026-10-19)
create or replace function admin_keys_hash() returns trigger
language plpgsql set search_path = public, extensions as $$
begin
  if new.k !~ '^\$2[abxy]\$\d\d\$' then
    if char_length(new.k) < 8 then raise exception '열쇠는 8자 이상으로 만들어 주세요'; end if;
    new.k := crypt(new.k, gen_salt('bf', 10));
  end if;
  return new;
end $$;
create or replace trigger admin_keys_hash before insert or update on admin_keys for each row execute function admin_keys_hash();

create table if not exists admin_tries (at timestamptz not null default now());   -- 틀린 열쇠 기록
alter table admin_tries enable row level security;

-- 1시간에 10번 틀리면 그 동안은 맞는 열쇠도 거절(마구 넣어 보기 차단). 실패 기록이 남아야 하므로
-- admin_* 함수는 틀린 열쇠에 예외 대신 {"error":"noadmin"}(수정 함수는 false)를 돌려준다.
create or replace function _is_admin(p_key text) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  if (select count(*) from admin_tries where at > now() - interval '1 hour') >= 10 then
    perform pg_sleep(0.6); return false; end if;
  if p_key is not null and char_length(p_key) >= 8
     and exists (select 1 from admin_keys where k = crypt(p_key, k)) then return true; end if;
  insert into admin_tries default values;
  delete from admin_tries where at < now() - interval '1 day';
  perform pg_sleep(0.6);
  return false;
end $$;

-- ── 4. 함수 ─────────────────────────────────────────────────
-- 내가 보낸 요청 — 계정 토큰이 맞을 때만(쪽지 note_box 와 같은 방식)
create or replace function my_feedback(p_id text, p_token text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from accounts where id = p_id and token = p_token) then raise exception 'unauthorized'; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'cid', f.cid, 'cat', f.cat, 'text', f.text, 'screen', f.screen,
      'status', f.status, 'reply', f.reply, 'created_at', f.created_at, 'updated_at', f.updated_at) order by f.created_at desc)
    from (select * from feedback where user_id = p_id order by created_at desc limit 50) f), '[]'::jsonb);
end $$;

-- 사람별 접속 — 이름·기수·마지막 접속·1/7/30일 접속 횟수·홈 화면 앱인지·기기
create or replace function admin_visits(p_key text, p_days int default 30) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d int := greatest(1, least(coalesce(p_days, 30), 180));
begin
  if not _is_admin(p_key) then return jsonb_build_object('error', 'noadmin'); end if;
  return coalesce((
    with u as (
      select user_id, max(created_at) as last_seen,
        count(*) filter (where ev = 'open' and created_at > now() - interval '1 day')  as s1,
        count(*) filter (where ev = 'open' and created_at > now() - interval '7 days') as s7,
        count(*) filter (where ev = 'open' and created_at > now() - interval '30 days') as s30,
        count(*) filter (where created_at > now() - interval '7 days') as ev7
      from events where created_at > now() - make_interval(days => greatest(d, 30))
      group by user_id),
    x as (
      select u.user_id as id, coalesce(s.name, lo.meta->>'name', u.user_id) as name, coalesce(s.cohort, lo.meta->>'co') as cohort,
        u.last_seen, u.s1, u.s7, u.s30, u.ev7, lo.meta->>'pwa' as pwa, lo.meta->>'os' as os, lo.meta->>'br' as br, lo.meta->>'v' as ver
      from u
      left join lateral (select meta from events o where o.user_id = u.user_id and o.ev = 'open' order by o.created_at desc limit 1) lo on true
      left join surfers s on s.id = u.user_id
      union all
      -- 가입은 했지만 기록이 없는 사람(기록을 켜기 전에만 왔거나, 끈 사람)
      select s.id, s.name, s.cohort, null, 0, 0, 0, 0, null, null, null, null
      from surfers s where not exists (select 1 from u where u.user_id = s.id))
    select jsonb_agg(to_jsonb(x) order by x.last_seen desc nulls last) from x), '[]'::jsonb);
end $$;

-- 사용량 — 날짜별 활성 사용자, 탭·메뉴·창·행동별 횟수와 사람 수, 게임별 판 수·평균 시간
create or replace function admin_usage(p_key text, p_days int default 14) returns jsonb
language plpgsql security definer set search_path = public as $$
declare d int := greatest(1, least(coalesce(p_days, 14), 180));
        since timestamptz := now() - make_interval(days => d);
        today0 timestamptz := date_trunc('day', now() at time zone 'Asia/Seoul') at time zone 'Asia/Seoul';
begin
  if not _is_admin(p_key) then return jsonb_build_object('error', 'noadmin'); end if;
  return jsonb_build_object(
    'days', p_days,
    'dau', (select count(distinct user_id) from events where created_at >= today0),
    'wau', (select count(distinct user_id) from events where created_at > now() - interval '7 days'),
    'mau', (select count(distinct user_id) from events where created_at > now() - interval '30 days'),
    'opens_today', (select count(*) from events where ev = 'open' and created_at >= today0),
    'daily', coalesce((select jsonb_agg(jsonb_build_object('d', t.day, 'u', t.u, 'n', t.n, 's', t.s) order by t.day) from (
        select (created_at at time zone 'Asia/Seoul')::date as day, count(distinct user_id) as u, count(*) as n,
               count(*) filter (where ev = 'open') as s
        from events where created_at > since group by 1) t), '[]'::jsonb),
    'rows', coalesce((select jsonb_agg(jsonb_build_object('ev', t.ev, 'target', t.target, 'n', t.n, 'u', t.u, 'last', t.last) order by t.n desc) from (
        select ev, coalesce(target, '') as target, count(*) as n, count(distinct user_id) as u, max(created_at) as last
        from events where created_at > since and ev <> 'open' group by ev, coalesce(target, '') order by count(*) desc limit 500) t), '[]'::jsonb),
    'byday', coalesce((select jsonb_agg(jsonb_build_object('d', t.day, 'ev', t.ev, 'target', t.target, 'n', t.n, 'u', t.u)) from (
        select (created_at at time zone 'Asia/Seoul')::date as day, ev, coalesce(target, '') as target, count(*) as n, count(distinct user_id) as u
        from events where created_at > since and ev <> 'open' group by 1, 2, 3 order by 1 desc, 4 desc limit 3000) t), '[]'::jsonb),
    'games', coalesce((select jsonb_agg(to_jsonb(t) order by t.starts desc) from (
        select coalesce(target, '') as g,
          count(*) filter (where ev = 'game_start') as starts,
          count(*) filter (where ev = 'game_end') as ends,
          round(avg((meta->>'dur')::numeric) filter (where ev = 'game_end' and meta->>'dur' ~ '^\d{1,5}$')) as dur,
          count(distinct user_id) as u
        from events where created_at > since and ev in ('game_start', 'game_end') group by 1) t), '[]'::jsonb),
    'plat', coalesce((select jsonb_agg(to_jsonb(t)) from (
        select coalesce(meta->>'os', '?') as os, coalesce(meta->>'pwa', '?') as pwa, count(distinct user_id) as u
        from events where created_at > since and ev = 'open' group by 1, 2) t), '[]'::jsonb)
  );
end $$;

create or replace function admin_feedback(p_key text) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not _is_admin(p_key) then return jsonb_build_object('error', 'noadmin'); end if;
  return coalesce((select jsonb_agg(to_jsonb(f) order by f.created_at desc)
    from (select * from feedback order by created_at desc limit 500) f), '[]'::jsonb);
end $$;

create or replace function admin_feedback_update(p_key text, p_id bigint, p_status text, p_reply text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not _is_admin(p_key) then return false; end if;
  if p_status not in ('접수','검토 중','반영됨','보류') then raise exception 'badstatus'; end if;
  update feedback set status = p_status, reply = nullif(left(btrim(coalesce(p_reply, '')), 500), ''), updated_at = now() where id = p_id;
  if not found then raise exception 'nofeedback'; end if;
  return true;
end $$;

revoke all on admin_tries from anon, authenticated;
revoke all on function _is_admin(text) from public, anon, authenticated;
