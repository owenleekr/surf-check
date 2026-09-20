-- 4차: 마을 채팅
create table if not exists chat (
  id text primary key, user_id text, name text, text text, profile jsonb,
  created_at timestamptz default now()
);
alter table chat enable row level security;
do $$ begin
  create policy "chat read"   on chat for select using (true);
  create policy "chat insert" on chat for insert with check (true);
exception when duplicate_object then null; end $$;
