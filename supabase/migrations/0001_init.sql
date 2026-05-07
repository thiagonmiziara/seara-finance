-- 0001_init.sql
-- Initial schema for Saas Finanças.
-- Auth: Firebase JWT validated by Supabase (Third-Party Auth -> Firebase).
-- auth.uid() returns the firebase uid (sub claim).
-- All tables enable RLS and resolve ownership through users.firebase_uid.

create extension if not exists pgcrypto;

-- ─── helpers ────────────────────────────────────────────────────────────────

create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── users ──────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  firebase_uid text not null unique,
  email text not null,
  name text,
  avatar_url text,
  whatsapp_phone_e164 text,
  whatsapp_opt_in_at timestamptz,
  whatsapp_opt_in_version text,
  terms_accepted_version text,
  terms_accepted_at timestamptz,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function set_updated_at();

alter table public.users enable row level security;

create policy users_select_self on public.users
  for select using (firebase_uid = auth.uid()::text);

create policy users_insert_self on public.users
  for insert with check (firebase_uid = auth.uid()::text);

create policy users_update_self on public.users
  for update using (firebase_uid = auth.uid()::text);

-- helper that needs the users table to already exist
create or replace function current_app_user_id() returns uuid
language sql stable as $$
  select id from public.users where firebase_uid = auth.uid()::text limit 1;
$$;

-- ─── accounts ───────────────────────────────────────────────────────────────
-- accountType (personal/business) lives in localStorage today; we model it
-- as a row so future features (sharing, multi-account) are simple.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('personal', 'business')),
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

create index accounts_user_id_idx on public.accounts(user_id);
create trigger accounts_set_updated_at before update on public.accounts
  for each row execute function set_updated_at();
alter table public.accounts enable row level security;
create policy accounts_owner_all on public.accounts
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── categories ─────────────────────────────────────────────────────────────

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  value text not null,
  label text not null,
  color text not null,
  icon text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, account_id, value)
);

create index categories_user_account_idx on public.categories(user_id, account_id);
alter table public.categories enable row level security;
create policy categories_owner_all on public.categories
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── cards ──────────────────────────────────────────────────────────────────

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  name text not null,
  brand text,
  last_four text,
  closing_day int not null check (closing_day between 1 and 31),
  due_day int not null check (due_day between 1 and 31),
  limit_amount numeric(14,2) not null check (limit_amount > 0),
  limit_user_defined numeric(14,2),
  color text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_user_account_idx on public.cards(user_id, account_id);
create trigger cards_set_updated_at before update on public.cards
  for each row execute function set_updated_at();
alter table public.cards enable row level security;
create policy cards_owner_all on public.cards
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── transactions ───────────────────────────────────────────────────────────

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  category text not null,
  type text not null check (type in ('income', 'expense')),
  status text not null check (status in ('pago','a_pagar','recebido','a_receber')),
  date date not null,
  card_id uuid references public.cards(id) on delete set null,
  installments_current int,
  installments_total int,
  recurring_bill_id uuid,
  recurring_year_month text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transactions_user_account_idx on public.transactions(user_id, account_id);
create index transactions_date_idx on public.transactions(user_id, account_id, date desc);
create index transactions_card_idx on public.transactions(card_id) where card_id is not null;
create index transactions_recurring_dedup on public.transactions(user_id, account_id, recurring_bill_id, recurring_year_month) where recurring_bill_id is not null;

create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function set_updated_at();
alter table public.transactions enable row level security;
create policy transactions_owner_all on public.transactions
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── debts ──────────────────────────────────────────────────────────────────

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  description text not null,
  total_amount numeric(14,2) not null check (total_amount > 0),
  installments int not null check (installments > 0),
  installment_amount numeric(14,2) not null check (installment_amount >= 0),
  paid_installments int not null default 0 check (paid_installments >= 0),
  status text not null check (status in ('a_pagar','pago')),
  due_date date not null,
  card_id uuid references public.cards(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index debts_user_account_idx on public.debts(user_id, account_id);
create trigger debts_set_updated_at before update on public.debts
  for each row execute function set_updated_at();
alter table public.debts enable row level security;
create policy debts_owner_all on public.debts
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── recurring bills ────────────────────────────────────────────────────────

create table if not exists public.recurring_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  category text not null,
  type text not null check (type in ('income','expense')),
  due_day int not null check (due_day between 1 and 31),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recurring_bills_user_account_idx on public.recurring_bills(user_id, account_id);
create trigger recurring_bills_set_updated_at before update on public.recurring_bills
  for each row execute function set_updated_at();
alter table public.recurring_bills enable row level security;
create policy recurring_bills_owner_all on public.recurring_bills
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── category rules ─────────────────────────────────────────────────────────

create table if not exists public.category_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  pattern text not null,
  category text not null,
  created_at timestamptz not null default now()
);

create index category_rules_user_account_idx on public.category_rules(user_id, account_id);
alter table public.category_rules enable row level security;
create policy category_rules_owner_all on public.category_rules
  for all using (user_id = current_app_user_id())
         with check (user_id = current_app_user_id());

-- ─── notifications queue ────────────────────────────────────────────────────
-- Outbox pattern: Edge Function "send-whatsapp" enqueues, "notifications-worker"
-- consumes and calls Evolution API.

create table if not exists public.notifications_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  template_key text not null,
  payload jsonb not null default '{}'::jsonb,
  phone_e164 text not null,
  status text not null default 'pending'
    check (status in ('pending','sending','sent','failed')),
  attempts int not null default 0,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  evolution_message_id text,
  last_error text,
  created_at timestamptz not null default now()
);

create index notifications_queue_due_idx
  on public.notifications_queue(status, scheduled_at)
  where status in ('pending','sending');
create index notifications_queue_user_idx on public.notifications_queue(user_id);

alter table public.notifications_queue enable row level security;
-- Users can only read their own notifications history; writes go through Edge
-- Functions running with the service role.
create policy notifications_queue_select_owner on public.notifications_queue
  for select using (user_id = current_app_user_id());

-- ─── evolution events (webhook idempotency) ─────────────────────────────────

create table if not exists public.evolution_events (
  id text primary key,                 -- evolution message/event id
  type text not null,                  -- messages.upsert | messages.update | connection.update | etc
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.evolution_events enable row level security;
-- only service role inserts/reads; default deny is fine (no policies).
