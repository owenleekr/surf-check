-- ════════════════════════════════════════════════════════════════
-- 반응(리액션) — Supabase 대시보드 › SQL Editor 에서 실행
--
-- 지금 남에게 무언가를 돌려주려면 칭찬 카드(모달 여러 번) 아니면 채팅 타이핑뿐이다.
-- 바다 앞에서 젖은 손으로 할 일이 아니다. 한 탭으로 끝나는 길을 만든다.
--
-- target 규칙:  'chat:<메시지id>' · 'mood:<유저id>' · 'pose:<자세기록id>'
--               한 사람이 같은 대상에 같은 이모지를 두 번 달 수 없다(기본키로 막음).
-- ════════════════════════════════════════════════════════════════

create table if not exists reacts (
  id          text primary key,             -- '<user_id>|<target>|<emo>' — 중복 방지가 곧 키다
  user_id     text not null,
  name        text not null,
  target      text not null,
  emo         text not null,
  to_user     text,                         -- 누가 받았나 (알림용). 없으면 알림만 못 간다
  created_at  timestamptz default now()
);

create index if not exists reacts_target_idx on reacts (target);
create index if not exists reacts_to_idx     on reacts (to_user, created_at desc);

alter table reacts enable row level security;

-- 앱은 anon 키로 접근한다. 다른 테이블과 같은 수준으로 연다.
drop policy if exists "reacts read"   on reacts;
drop policy if exists "reacts write"  on reacts;
drop policy if exists "reacts delete" on reacts;
create policy "reacts read"   on reacts for select using (true);
create policy "reacts write"  on reacts for insert with check (true);
create policy "reacts delete" on reacts for delete using (true);   -- 잘못 누른 걸 뗄 수 있어야 한다

-- ── 확인 ─────────────────────────────────────────────────────
-- select target, emo, count(*) from reacts group by 1,2 order by 3 desc;
