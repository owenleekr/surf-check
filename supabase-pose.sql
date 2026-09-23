-- 5차: 자세 기록(테이크오프 프레임) — 영상에서 뽑은 사진만 저장, 영상 원본은 폰에 남습니다
create table if not exists poses (
  id text primary key,
  user_id text, name text, date date, week int,
  stage text,                     -- paddle | push | stand | ride
  url text, note text, coach_note text, coach_name text,
  created_at timestamptz default now()
);
alter table poses enable row level security;
do $$ begin
  create policy "poses read"   on poses for select using (true);
  create policy "poses insert" on poses for insert with check (true);
  create policy "poses update" on poses for update using (true);
exception when duplicate_object then null; end $$;

-- 사진 저장소 (공개 버킷)
insert into storage.buckets (id, name, public) values ('poses','poses',true) on conflict (id) do nothing;
do $$ begin
  create policy "poses obj read"   on storage.objects for select using (bucket_id = 'poses');
  create policy "poses obj insert" on storage.objects for insert with check (bucket_id = 'poses');
exception when duplicate_object then null; end $$;
