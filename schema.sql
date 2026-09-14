-- Bloom database schema
create table if not exists public.coach_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  role text not null check (role in ('coach','client')),
  created_at timestamptz not null default now()
);

create table if not exists public.coach_submissions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.coach_profiles(id) on delete cascade,
  wheel jsonb not null default '{}'::jsonb,
  gratitude text[] not null default '{}',
  self_love jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.coach_profiles enable row level security;
alter table public.coach_submissions enable row level security;

create policy "coach_profiles_self_or_coach" on public.coach_profiles for select to authenticated
using ((select auth.uid()) = id or coalesce((select auth.jwt()->'app_metadata'->>'role'),'') = 'coach');

create policy "coach_submission_client_insert" on public.coach_submissions for insert to authenticated
with check ((select auth.uid()) = client_id);

create policy "coach_submission_select" on public.coach_submissions for select to authenticated
using ((select auth.uid()) = client_id or coalesce((select auth.jwt()->'app_metadata'->>'role'),'') = 'coach');

create policy "coach_submission_update" on public.coach_submissions for update to authenticated
using ((select auth.uid()) = client_id)
with check ((select auth.uid()) = client_id);

grant select on public.coach_profiles to authenticated;
grant select, insert, update on public.coach_submissions to authenticated;
