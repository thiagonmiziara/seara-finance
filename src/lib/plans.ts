// Planos e gating de features.
//
// Esta é a fonte da verdade no front sobre o que cada plano libera.
// Lê do Postgres `subscriptions` via useSubscription. As decisões de UI
// (mostrar paywall, esconder botão, etc.) usam helpers daqui.

export type PlanId = 'free' | 'pro';
export type BillingInterval = 'month' | 'year';
export type CheckoutPlan = 'pro_month' | 'pro_year';

export type SubscriptionStatus =
  | 'inactive'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused';

export interface Subscription {
  plan: PlanId;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export const FREE_SUBSCRIPTION: Subscription = {
  plan: 'free',
  status: 'inactive',
  interval: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  trialEnd: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
};

export interface PlanCopy {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPriceBRL: number;
  yearlyPriceBRL: number; // total no ano (12x já com desconto)
  features: string[];
  highlights?: string[];
}

export const PLANS: Record<PlanId, PlanCopy> = {
  free: {
    id: 'free',
    name: 'Free',
    tagline: 'Para começar a organizar suas finanças.',
    monthlyPriceBRL: 0,
    yearlyPriceBRL: 0,
    features: [
      'Até 50 transações por mês',
      '1 cartão de crédito',
      'Categorias e contas fixas básicas',
      'Sem integração WhatsApp',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'Tudo que você precisa, sem limite.',
    monthlyPriceBRL: 19.9,
    yearlyPriceBRL: 199, // ~17/mês
    features: [
      'Transações ilimitadas',
      'Cartões ilimitados',
      'WhatsApp no zap (lançamento por mensagem)',
      'Sugestão automática de categoria (IA)',
      'Exportações e gráficos avançados',
      'Suporte prioritário',
    ],
    highlights: ['Mais popular'],
  },
};

// ─── feature flags por plano ────────────────────────────────────────────────

export type Feature =
  | 'whatsapp_inbound'
  | 'unlimited_transactions'
  | 'unlimited_cards'
  | 'auto_category_ai'
  | 'advanced_exports';

const FEATURES_BY_PLAN: Record<Feature, PlanId[]> = {
  whatsapp_inbound: ['pro'],
  unlimited_transactions: ['pro'],
  unlimited_cards: ['pro'],
  auto_category_ai: ['pro'],
  advanced_exports: ['pro'],
};

const FREE_LIMITS = {
  transactions_per_month: 50,
  cards: 1,
};

export function isPaidStatus(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing' || status === 'past_due';
}

export function effectivePlan(sub: Subscription | null | undefined): PlanId {
  if (!sub) return 'free';
  return isPaidStatus(sub.status) ? sub.plan : 'free';
}

export function hasFeature(
  sub: Subscription | null | undefined,
  feature: Feature,
): boolean {
  const plan = effectivePlan(sub);
  return FEATURES_BY_PLAN[feature].includes(plan);
}

export function freeLimit(key: keyof typeof FREE_LIMITS): number {
  return FREE_LIMITS[key];
}
