-- 0002_seed_account.sql
-- Trigger that creates the default "personal" account whenever a user is
-- inserted, so the rest of the app can rely on at least one account existing.

create or replace function public.create_default_account_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.accounts (user_id, type, name)
  values (new.id, 'personal', 'Pessoal')
  on conflict (user_id, type) do nothing;
  return new;
end;
$$;

drop trigger if exists users_after_insert_create_account on public.users;
create trigger users_after_insert_create_account
  after insert on public.users
  for each row execute function public.create_default_account_for_user();
