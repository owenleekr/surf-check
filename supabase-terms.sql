-- 6차: 학교 공식 용어 사전(코치 검수) — 앱의 모든 표현을 코치가 직접 승인·수정
create table if not exists terms (
  id text primary key,            -- 용어 키 (예: rel.on, verdict.good, gloss.윈드스웰)
  ko text,                        -- 화면에 쓸 표현
  def text,                       -- 설명
  src text,                       -- 출처: 강의노트 / 교장쌤 09.15 / Rio 09.22 / 앱 제안
  status text default 'proposed', -- proposed | approved | fix
  note text,                      -- 코치 메모(고칠 점)
  by_name text, updated_at timestamptz default now()
);
alter table terms enable row level security;
do $$ begin
  create policy "terms read"   on terms for select using (true);
  create policy "terms insert" on terms for insert with check (true);
  create policy "terms update" on terms for update using (true);
exception when duplicate_object then null; end $$;
