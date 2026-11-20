create extension if not exists "pgcrypto";
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student','teacher','admin')),
  class_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references public.profiles(id)
);
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  subject_id uuid references public.subjects(id),
  due_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text default '',
  submitted_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
create policy "Profiles are readable by authenticated users" on public.profiles for select to authenticated using (true);
create policy "Users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Subjects readable by authenticated users" on public.subjects for select to authenticated using (true);
create policy "Assignments readable by authenticated users" on public.assignments for select to authenticated using (true);
create policy "Students read own submissions" on public.submissions for select to authenticated using (auth.uid() = student_id);
create policy "Students submit own work" on public.submissions for insert to authenticated with check (auth.uid() = student_id);