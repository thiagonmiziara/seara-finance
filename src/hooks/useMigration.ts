// useMigration was a legacy helper that moved data from the old Firestore
// layout (`users/{uid}/transactions`) to the namespaced layout
// (`users/{uid}/accounts/personal/transactions`). The Firestore data layer is
// gone — Supabase is now the source of truth — so the hook is intentionally
// a no-op kept here so AppShell can continue to import it without churn.

export function useMigration() {
  return { isMigrating: false };
}
