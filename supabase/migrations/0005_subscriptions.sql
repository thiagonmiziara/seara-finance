-- 0005_subscriptions.sql
-- Stripe billing — assinatura por usuário.
--
-- Modelo:
--   subscriptions: 1 linha por usuário (latest snapshot do Stripe)
--   stripe_events: outbox de webhook events para idempotência
--   users.stripe_customer_id: cache do customer.id da Stripe
--
-- O webhook roda com service-role e mantém esses dados sincronizados.
-- O front consulta `subscriptions` direto via RLS (somente leitura do dono).

-- ─── users.stripe_customer_id ───────────────────────────────────────────────

alter table public.users
  add column if not exists stripe_customer_id text unique;

create index if not exists users_stripe_customer_idx
  on public.users(stripe_customer_id)
  where stripe_customer_id is not null;

-- ─── subscriptions ──────────────────────────────────────────────────────────

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique,
  stripe_price_id text,
  plan text not null default 'free' check (plan in ('free','pro')),
  status text not null default 'inactive'
    check (status in (
      'inactive','trialing','active','past_due','canceled','unpaid','incomplete','incomplete_expired','paused'
    )),
  interval text check (interval in ('month','year')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function set_updated_at();

alter table public.subscriptions enable row level security;

-- Dono lê o próprio; gravação é feita pelo webhook (service role).
create policy subscriptions_select_owner on public.subscriptions
  for select using (user_id = current_app_user_id());

-- ─── stripe_events (idempotência do webhook) ────────────────────────────────

create table if not exists public.stripe_events (
  id text primary key,                 -- event.id da Stripe
  type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;
-- Sem políticas: somente service role acessa.

-- ─── helper: garantir linha free na criação do usuário ─────────────────────
-- Mantém o pareamento 1:1 entre users e subscriptions desde o sign-up,
-- assim o front sempre tem uma linha para ler (status='inactive', plan='free').

create or replace function public.ensure_free_subscription() returns trigger
language plpgsql as $$
begin
  insert into public.subscriptions (user_id, stripe_customer_id, plan, status)
  values (new.id, '', 'free', 'inactive')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists users_ensure_free_subscription on public.users;
create trigger users_ensure_free_subscription
  after insert on public.users
  for each row execute function public.ensure_free_subscription();

-- Backfill para usuários já existentes
insert into public.subscriptions (user_id, stripe_customer_id, plan, status)
select u.id, '', 'free', 'inactive'
from public.users u
left join public.subscriptions s on s.user_id = u.id
where s.id is null;
