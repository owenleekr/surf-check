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

-- 되돌리기용 delete 정책 (2026-09-24 추가)
-- 처음엔 select/insert/update만 열어뒀는데, 그러면 코치가 한 번 저장한 표현을
-- 원래대로(lex.js 기본값) 돌릴 방법이 없다. 행을 지워야 기본값으로 떨어지기 때문.
do $$ begin
  create policy "terms delete" on terms for delete using (true);
exception when duplicate_object then null; end $$;

-- 연결 점검용으로 만든 행 정리 (있으면 지우고, 없으면 아무 일도 안 함)
delete from terms where id = 'zz_probe';
