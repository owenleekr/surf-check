# 오늘 파도 어때

양양서핑학교 6기 파도 체크 · 미션 · 레벨. 단일 `index.html`, 빌드 없음.

- 파도·바람·수온·조위: Open-Meteo (키 없음, 브라우저 직접 호출)
- 캠: WSB FARM 웨이브캠 링크
- 계정·진도: 브라우저 localStorage (기기별). 레벨 탭 "데이터 옮기기"로 이전

## 6기 랭킹 공유 (선택)

기본은 각자 폰에만 저장된다. 기수 전원이 한 랭킹을 보려면 Supabase 무료 프로젝트를 하나 만들고:

1. SQL Editor에 아래를 실행
```sql
create table surfers (
  id text primary key, cohort text, name text, profile jsonb,
  xp int, level int, attend int, rides int, missions int, updated_at timestamptz
);
alter table surfers enable row level security;
create policy "read all" on surfers for select using (true);
create policy "upsert" on surfers for insert with check (true);
create policy "update" on surfers for update using (true);
```
2. `index.html`의 `const SUPA = { url:'', key:'' }`에 프로젝트 URL과 anon key를 넣고 push.

앱은 진도가 바뀔 때마다 자기 행을 upsert하고, 6기 탭에서 XP 순으로 읽는다. 친구 그룹용이라 행 보호는 느슨하다(누구나 갱신 가능).
