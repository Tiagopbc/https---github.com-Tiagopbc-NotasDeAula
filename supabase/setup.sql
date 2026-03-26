-- Execute este script no SQL Editor do Supabase para alinhar o schema
-- esperado por esta aplicacao.

create table if not exists public.notes (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  user_id uuid not null references auth.users(id) on delete cascade
);

alter table public.notes
  add column if not exists content text,
  add column if not exists created_at timestamptz not null default timezone('utc'::text, now()),
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists notes_user_id_created_at_idx
  on public.notes (user_id, created_at desc, id desc);

alter table public.notes enable row level security;

drop policy if exists "Users can read own notes" on public.notes;
create policy "Users can read own notes"
on public.notes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own notes" on public.notes;
create policy "Users can insert own notes"
on public.notes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own notes" on public.notes;
create policy "Users can update own notes"
on public.notes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own notes" on public.notes;
create policy "Users can delete own notes"
on public.notes
for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
