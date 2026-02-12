begin;

-- Core admin helper used by RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'wolfspace099@gmail.com'
  );
$$;

-- Ensure RLS is enabled on admin-managed tables.
alter table if exists courses enable row level security;
alter table if exists lessons enable row level security;
alter table if exists course_chapters enable row level security;

-- Courses: allow admin CRUD.
drop policy if exists "Admins have full access to courses" on courses;
create policy "Admins have full access to courses"
  on courses
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Lessons: allow admin CRUD (needed for lesson management in admin UI).
drop policy if exists "Admins have full access to lessons" on lessons;
create policy "Admins have full access to lessons"
  on lessons
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Course chapters: allow admin CRUD.
drop policy if exists "Admins have full access to chapters" on course_chapters;
create policy "Admins have full access to chapters"
  on course_chapters
  for all
  using (public.is_admin())
  with check (public.is_admin());

commit;
