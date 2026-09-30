-- ════════════════════════════════════════════════════════════════
-- 테이크오프 훈련 체크 + 리더보드 — Supabase 대시보드 › SQL Editor 에서 실행
--
-- 하루에 한 번 "오늘 했어요"를 누르면 한 줄이 쌓이고, 그걸로 연속일수·이번 주 횟수를 센다.
-- id 를 '<user_id>|<날짜>' 로 잡아서 같은 날 두 번 눌러도 한 줄이다(기본키가 막는다).
--
-- 신뢰 모델은 반응(reacts)·채팅과 같다 — 이 앱은 Supabase Auth 를 쓰지 않아서 서버가
-- '누가 눌렀나'를 증명하지 못한다. 스무 명 남짓 동기들끼리 쓰는 기록이라 감수한다.
-- 그래서 이 표로는 돈·평가·순위 보상 같은 걸 걸지 말 것.
-- ════════════════════════════════════════════════════════════════

create table if not exists drills (
  id          text primary key,             -- '<user_id>|<YYYY-MM-DD>'
  user_id     text not null,
  name        text not null,
  day         date not null,
  created_at  timestamptz default now()
);

create index if not exists drills_day_idx  on drills (day desc);
create index if not exists drills_user_idx on drills (user_id, day desc);

alter table drills enable row level security;

drop policy if exists "drills read"   on drills;
drop policy if exists "drills write"  on drills;
drop policy if exists "drills delete" on drills;
create policy "drills read"   on drills for select using (true);
create policy "drills write"  on drills for insert with check (true);
create policy "drills delete" on drills for delete using (true);   -- 잘못 누른 오늘 것을 뗄 수 있어야 한다
-- update 정책은 없다 — 고칠 일이 없고, 열어두면 남의 기록 날짜를 바꿀 수 있다.
