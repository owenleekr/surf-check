-- ════════════════════════════════════════════════════════════════
-- 쪽지 — Supabase 대시보드 › SQL Editor
--
-- ★ 이 표만은 다른 표들과 규칙이 다릅니다. 이유를 적어 둡니다.
--
-- rides·stays·chat 은 "같은 기수 전원이 본다"가 전제라 정책을 using(true) 로 열어 뒀습니다.
-- 쪽지는 아닙니다. 같은 방식으로 열면 anon 키 한 줄로 **남의 쪽지를 전부 읽을 수 있습니다.**
-- 브라우저에 내려가는 키라 누구나 갖고 있습니다.
--
-- 그래서 이 표에는 정책을 하나도 만들지 않습니다(= anon 직접 접근 전면 차단).
-- 오직 아래 함수들로만 닿고, 함수는 accounts.token 을 확인합니다 —
-- save_data/load_data 와 같은 방식입니다. 토큰은 로그인할 때만 발급됩니다.
-- ════════════════════════════════════════════════════════════════

create table if not exists notes (
  id           text primary key,
  from_id      text not null,
  from_name    text not null,
  from_profile jsonb not null default '{}',   -- 캐릭터 도트를 같이 싣는다
  to_id        text not null,
  to_name      text not null,
  text         text not null,
  read_at      timestamptz,
  created_at   timestamptz default now()
);
create index if not exists notes_to_idx   on notes (to_id, created_at desc);
create index if not exists notes_from_idx on notes (from_id, created_at desc);

alter table notes enable row level security;
-- 정책 없음. 일부러 비워 둡니다. 아래 security definer 함수만 통과합니다.
drop policy if exists "notes read"  on notes;
drop policy if exists "notes write" on notes;


-- ── 보내기 ──────────────────────────────────────────────────
create or replace function note_send(p_id text, p_token text, p_to text, p_text text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare me accounts; you accounts;
begin
  select * into me from accounts where id = p_id and token = p_token;
  if me.id is null then raise exception 'unauthorized'; end if;      -- 토큰이 곧 신분이다
  if p_to = p_id then raise exception 'self'; end if;
  select * into you from accounts where id = p_to;
  if you.id is null then raise exception 'nouser'; end if;
  if coalesce(btrim(p_text),'') = '' then raise exception 'empty'; end if;

  -- 도배 완화: 같은 사람에게 1분에 5통까지
  if (select count(*) from notes
       where from_id = p_id and to_id = p_to and created_at > now() - interval '1 minute') >= 5
    then raise exception 'toofast'; end if;

  insert into notes (id, from_id, from_name, from_profile, to_id, to_name, text)
  values (encode(gen_random_bytes(9),'hex'), p_id, me.name, coalesce(me.profile,'{}'::jsonb),
          p_to, you.name, left(btrim(p_text), 300));
  return true;
end $$;

-- ── 받은·보낸 쪽지 ──────────────────────────────────────────
create or replace function note_box(p_id text, p_token text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
declare me accounts;
begin
  select * into me from accounts where id = p_id and token = p_token;
  if me.id is null then raise exception 'unauthorized'; end if;
  return jsonb_build_object(
    'inbox', coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc)
                       from (select * from notes where to_id = p_id order by created_at desc limit 100) n), '[]'::jsonb),
    'sent',  coalesce((select jsonb_agg(to_jsonb(n) order by n.created_at desc)
                       from (select * from notes where from_id = p_id order by created_at desc limit 50) n), '[]'::jsonb),
    'unread', (select count(*) from notes where to_id = p_id and read_at is null));
end $$;

-- ── 읽음 표시 · 지우기 ──────────────────────────────────────
create or replace function note_read(p_id text, p_token text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from accounts where id = p_id and token = p_token) then raise exception 'unauthorized'; end if;
  update notes set read_at = now() where to_id = p_id and read_at is null;
  return true;
end $$;

create or replace function note_del(p_id text, p_token text, p_note text)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from accounts where id = p_id and token = p_token) then raise exception 'unauthorized'; end if;
  delete from notes where id = p_note and (to_id = p_id or from_id = p_id);   -- 받은 것도 보낸 것도 내 것만
  return true;
end $$;

revoke all on function note_send(text,text,text,text) from public;
grant execute on function note_send(text,text,text,text) to anon, authenticated;
grant execute on function note_box(text,text)           to anon, authenticated;
grant execute on function note_read(text,text)          to anon, authenticated;
grant execute on function note_del(text,text,text)      to anon, authenticated;

-- ── 확인 ─────────────────────────────────────────────────────
-- 아래는 **실패해야** 정상입니다(정책이 없어 anon 이 직접 못 읽음):
--   앱에서  GET /rest/v1/notes  →  빈 배열 또는 권한 오류
select count(*) as 쪽지수 from notes;
