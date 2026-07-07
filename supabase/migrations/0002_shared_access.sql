-- Switch from per-user RLS isolation to a single shared workspace: every
-- authenticated account can see and edit every deal, contact, and document,
-- regardless of who created it. `user_id` is kept as creator/attribution
-- metadata only (still used by the frontend to avoid reassigning ownership
-- on save) — it is no longer used to restrict access.

-- =============================================================
-- PROPERTIES (deals)
-- =============================================================
drop policy if exists "properties_select" on public.properties;
drop policy if exists "properties_insert" on public.properties;
drop policy if exists "properties_update" on public.properties;
drop policy if exists "properties_delete" on public.properties;

create policy "properties_shared_access" on public.properties
  for all to authenticated using (true) with check (true);

-- =============================================================
-- MANUAL PERSONS (contacts)
-- =============================================================
drop policy if exists "manual_persons_select" on public.manual_persons;
drop policy if exists "manual_persons_insert" on public.manual_persons;
drop policy if exists "manual_persons_update" on public.manual_persons;
drop policy if exists "manual_persons_delete" on public.manual_persons;

create policy "manual_persons_shared_access" on public.manual_persons
  for all to authenticated using (true) with check (true);

-- =============================================================
-- STORAGE — deal-documents bucket
-- =============================================================
drop policy if exists "deal_documents_select" on storage.objects;
drop policy if exists "deal_documents_insert" on storage.objects;
drop policy if exists "deal_documents_delete" on storage.objects;

create policy "deal_documents_select_shared" on storage.objects
  for select to authenticated using (bucket_id = 'deal-documents');
create policy "deal_documents_insert_shared" on storage.objects
  for insert to authenticated with check (bucket_id = 'deal-documents');
create policy "deal_documents_delete_shared" on storage.objects
  for delete to authenticated using (bucket_id = 'deal-documents');
