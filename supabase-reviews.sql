-- ════════════════════════════════════════════════════════════════
-- 숙소 평가 — Supabase 대시보드 › SQL Editor
--
-- 숙소는 한 번 자보기 전엔 알 수가 없다. 다녀온 사람이 남겨야
-- 다음 사람이 고를 수 있다. 같은 숙소를 여러 명이 평가할 수 있게
-- stays 안에 넣지 않고 따로 뺀다.
--
-- 한 사람이 한 숙소에 한 번 — 기본키가 그걸 막는다(다시 쓰면 덮어쓴다).
-- ════════════════════════════════════════════════════════════════

create table if not exists stay_reviews (
  id          text primary key,             -- '<stay_id>|<user_id>'
  stay_id     text not null,
  place       text not null,                -- 숙소가 지워져도 평은 남게 이름을 복사해 둔다
  user_id     text not null,
  name        text not null,
  profile     jsonb not null default '{}',  -- 캐릭터 도트
  stars       numeric(2,1) not null,        -- 0.5 ~ 5.0
  good        jsonb not null default '[]',  -- ['해변 가까움','따뜻함'] 같은 태그
  text        text,
  created_at  timestamptz default now()
);

create index if not exists stay_reviews_stay_idx on stay_reviews (stay_id);
create index if not exists stay_reviews_place_idx on stay_reviews (place);

alter table stay_reviews enable row level security;

drop policy if exists "sr read"   on stay_reviews;
drop policy if exists "sr write"  on stay_reviews;
drop policy if exists "sr delete" on stay_reviews;
create policy "sr read"   on stay_reviews for select using (true);
create policy "sr write"  on stay_reviews for insert with check (true);
create policy "sr delete" on stay_reviews for delete using (true);   -- 내가 쓴 평을 지울 수 있게

-- ── 확인 ─────────────────────────────────────────────────────
select place, round(avg(stars),1) as 평균, count(*) as 개수
from stay_reviews group by place order by 개수 desc;
