-- Deal Manager schema: profiles/roles, deals, contacts, RLS, storage policies.
-- Run this once against a fresh Supabase project (SQL editor, or `supabase db push`).

-- =============================================================
-- PROFILES + ROLES
-- =============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- security definer so it can read profiles regardless of the caller's own RLS visibility
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid());

-- auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- shared updated_at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================
-- PROPERTIES (deals) — the flexible per-deal fields (purchase price,
-- rental area, tenant schedule, sale units, etc.) live in `data` jsonb,
-- mirroring the shape the frontend already reads/writes.
-- =============================================================
create table public.properties (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'inreview',
  ampel text,
  deal_captain text,
  rejection_reason text,
  file_name text,
  uploaded_at timestamptz not null default now(),
  data jsonb not null default '{}'::jsonb,
  fee_model jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_user_id_idx on public.properties(user_id);

alter table public.properties enable row level security;

create policy "properties_select" on public.properties
  for select using (user_id = auth.uid() or public.is_admin());
create policy "properties_insert" on public.properties
  for insert with check (user_id = auth.uid());
create policy "properties_update" on public.properties
  for update using (user_id = auth.uid() or public.is_admin());
create policy "properties_delete" on public.properties
  for delete using (user_id = auth.uid() or public.is_admin());

create trigger properties_set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- =============================================================
-- MANUAL PERSONS (contacts / "Personen")
-- =============================================================
create table public.manual_persons (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text,
  company text,
  role text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create index manual_persons_user_id_idx on public.manual_persons(user_id);

alter table public.manual_persons enable row level security;

create policy "manual_persons_select" on public.manual_persons
  for select using (user_id = auth.uid() or public.is_admin());
create policy "manual_persons_insert" on public.manual_persons
  for insert with check (user_id = auth.uid());
create policy "manual_persons_update" on public.manual_persons
  for update using (user_id = auth.uid() or public.is_admin());
create policy "manual_persons_delete" on public.manual_persons
  for delete using (user_id = auth.uid() or public.is_admin());

-- =============================================================
-- STORAGE — private bucket for the original uploaded PDFs.
-- Path convention: {user_id}/{property_id}/{timestamp}_{filename}
-- =============================================================
insert into storage.buckets (id, name, public)
values ('deal-documents', 'deal-documents', false)
on conflict (id) do nothing;

create policy "deal_documents_select" on storage.objects
  for select using (
    bucket_id = 'deal-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

create policy "deal_documents_insert" on storage.objects
  for insert with check (
    bucket_id = 'deal-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "deal_documents_delete" on storage.objects
  for delete using (
    bucket_id = 'deal-documents'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- =============================================================
-- GRANTS — required as of Supabase's Data API grant policy (new projects
-- created after 30 May 2026 must have explicit table grants; RLS alone
-- is no longer sufficient to expose a table via the API).
-- =============================================================
grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.properties to authenticated;
grant select, insert, update, delete on public.manual_persons to authenticated;

-- =============================================================
-- Promote your own account to admin after signing up once, e.g.:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================
