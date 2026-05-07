-- 0004_auto_user_id_from_account.sql
-- Tabelas filhas da conta (transactions, cards, debts, categories, recurring_bills,
-- category_rules) têm user_id NOT NULL além do account_id, mas o front e o bot
-- só passam o account_id. Adicionar trigger que preenche user_id automaticamente
-- a partir de public.accounts.user_id no INSERT.

create or replace function set_user_id_from_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null and new.account_id is not null then
    select user_id into new.user_id from public.accounts where id = new.account_id;
  end if;
  return new;
end;
$$;

-- transactions
drop trigger if exists transactions_set_user_id on public.transactions;
create trigger transactions_set_user_id
  before insert on public.transactions
  for each row execute function set_user_id_from_account();

-- cards
drop trigger if exists cards_set_user_id on public.cards;
create trigger cards_set_user_id
  before insert on public.cards
  for each row execute function set_user_id_from_account();

-- debts
drop trigger if exists debts_set_user_id on public.debts;
create trigger debts_set_user_id
  before insert on public.debts
  for each row execute function set_user_id_from_account();

-- categories
drop trigger if exists categories_set_user_id on public.categories;
create trigger categories_set_user_id
  before insert on public.categories
  for each row execute function set_user_id_from_account();

-- recurring_bills
drop trigger if exists recurring_bills_set_user_id on public.recurring_bills;
create trigger recurring_bills_set_user_id
  before insert on public.recurring_bills
  for each row execute function set_user_id_from_account();

-- category_rules
drop trigger if exists category_rules_set_user_id on public.category_rules;
create trigger category_rules_set_user_id
  before insert on public.category_rules
  for each row execute function set_user_id_from_account();
