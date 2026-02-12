begin;

create extension if not exists "uuid-ossp";

create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique,
  full_name text not null,
  age integer,
  experience_level text not null check (experience_level in ('Beginner', 'Intermediate', 'Advanced', 'Professional')),
  why_join text not null,
  portfolio_url text,
  social_links jsonb not null default '{}'::jsonb,
  editing_software text[],
  goals text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_applications_user_id on public.applications(user_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_applications_submitted_at on public.applications(submitted_at desc);

alter table public.applications enable row level security;

drop policy if exists "Users can view own application" on public.applications;
create policy "Users can view own application"
  on public.applications
  for select
  using (auth.uid()::text = user_id::text);

drop policy if exists "Users can create own application" on public.applications;
create policy "Users can create own application"
  on public.applications
  for insert
  with check (auth.uid()::text = user_id::text);

drop policy if exists "Users can update own pending application" on public.applications;
create policy "Users can update own pending application"
  on public.applications
  for update
  using (auth.uid()::text = user_id::text and status = 'pending')
  with check (auth.uid()::text = user_id::text and status = 'pending');

drop policy if exists "Admins can view all applications" on public.applications;
create policy "Admins can view all applications"
  on public.applications
  for select
  using (public.is_admin());

drop policy if exists "Admins can update all applications" on public.applications;
create policy "Admins can update all applications"
  on public.applications
  for update
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.update_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_updated_at on public.applications;
create trigger applications_updated_at
  before update on public.applications
  for each row
  execute function public.update_applications_updated_at();

commit;
