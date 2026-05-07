-- 0003_firebase_uid_policies.sql
-- Firebase UIDs are NOT UUIDs (28-char base64-like strings), so auth.uid() —
-- which casts the JWT's sub claim to UUID — fails with 22P02. Switch every
-- comparison to read the raw sub claim via auth.jwt() ->> 'sub'.

create or replace function current_app_user_id() returns uuid
language sql stable as $$
  select id from public.users where firebase_uid = auth.jwt() ->> 'sub' limit 1;
$$;

-- ─── users ──────────────────────────────────────────────────────────────────

drop policy if exists users_select_self on public.users;
drop policy if exists users_insert_self on public.users;
drop policy if exists users_update_self on public.users;

create policy users_select_self on public.users
  for select using (firebase_uid = auth.jwt() ->> 'sub');

create policy users_insert_self on public.users
  for insert with check (firebase_uid = auth.jwt() ->> 'sub');

create policy users_update_self on public.users
  for update using (firebase_uid = auth.jwt() ->> 'sub');
