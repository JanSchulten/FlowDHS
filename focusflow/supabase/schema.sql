-- FocusFlow – Supabase schema
-- Run this once in your Supabase project: SQL Editor → paste → Run.
--
-- The whole app state is stored as a single JSONB row per user. Row-Level
-- Security guarantees each user can only read/write their own row.

create table if not exists public.app_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

-- A user may read their own row.
drop policy if exists "app_state read own" on public.app_state;
create policy "app_state read own"
  on public.app_state for select
  using (auth.uid() = user_id);

-- A user may create their own row.
drop policy if exists "app_state insert own" on public.app_state;
create policy "app_state insert own"
  on public.app_state for insert
  with check (auth.uid() = user_id);

-- A user may update their own row.
drop policy if exists "app_state update own" on public.app_state;
create policy "app_state update own"
  on public.app_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
