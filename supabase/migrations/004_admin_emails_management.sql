begin;

create table if not exists public.admin_emails (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  created_at timestamptz not null default now(),
  created_by uuid
);

create unique index if not exists admin_emails_email_lower_key
  on public.admin_emails (lower(email));

insert into public.admin_emails (email)
values ('wolfspace099@gmail.com')
on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() ->> 'email', '')) in ('wolfspace099@gmail.com')
    or exists (
      select 1
      from public.admin_emails ae
      where lower(ae.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

grant execute on function public.is_admin() to anon, authenticated, service_role;

alter table public.admin_emails enable row level security;

drop policy if exists "Admins can view admin emails" on public.admin_emails;
create policy "Admins can view admin emails"
  on public.admin_emails
  for select
  using (public.is_admin());

drop policy if exists "Admins can insert admin emails" on public.admin_emails;
create policy "Admins can insert admin emails"
  on public.admin_emails
  for insert
  with check (public.is_admin());

drop policy if exists "Admins can delete admin emails" on public.admin_emails;
create policy "Admins can delete admin emails"
  on public.admin_emails
  for delete
  using (public.is_admin());

-- Keep applications admin policies aligned with email-based admin auth.
drop policy if exists "Admins can view all applications" on public.applications;
create policy "Admins can view all applications"
  on public.applications
  for select
  using (public.is_admin());

drop policy if exists "Admins can update all applications" on public.applications;
create policy "Admins can update all applications"
  on public.applications
  for update
  using (public.is_admin());

commit;
