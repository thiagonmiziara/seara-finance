import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export interface UserProfile {
  whatsappPhoneE164?: string | null;
  whatsappOptInAt?: string | null;
  whatsappOptInVersion?: string | null;
  termsAcceptedVersion?: string | null;
  termsAcceptedAt?: string | null;
  onboardingCompletedAt?: string | null;
}

interface ProfileRow {
  whatsapp_phone_e164: string | null;
  whatsapp_opt_in_at: string | null;
  whatsapp_opt_in_version: string | null;
  terms_accepted_version: string | null;
  terms_accepted_at: string | null;
  onboarding_completed_at: string | null;
}

function rowToProfile(row: ProfileRow | null): UserProfile {
  if (!row) return {};
  return {
    whatsappPhoneE164: row.whatsapp_phone_e164,
    whatsappOptInAt: row.whatsapp_opt_in_at,
    whatsappOptInVersion: row.whatsapp_opt_in_version,
    termsAcceptedVersion: row.terms_accepted_version,
    termsAcceptedAt: row.terms_accepted_at,
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('users')
        .select(
          'whatsapp_phone_e164, whatsapp_opt_in_at, whatsapp_opt_in_version, terms_accepted_version, terms_accepted_at, onboarding_completed_at',
        )
        .eq('firebase_uid', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error('[useUserProfile] load failed', error.message);
        setProfile({});
      } else {
        setProfile(rowToProfile(data as ProfileRow | null));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateProfile = useCallback(
    async (
      patch: Partial<{
        whatsappPhoneE164: string | null;
        whatsappOptInAt: string | null;
        whatsappOptInVersion: string | null;
        termsAcceptedVersion: string | null;
        termsAcceptedAt: string | null;
        onboardingCompletedAt: string | null;
      }>,
    ) => {
      if (!user) return;
      const dbPatch: Record<string, unknown> = {};
      if (patch.whatsappPhoneE164 !== undefined)
        dbPatch.whatsapp_phone_e164 = patch.whatsappPhoneE164;
      if (patch.whatsappOptInAt !== undefined)
        dbPatch.whatsapp_opt_in_at = patch.whatsappOptInAt;
      if (patch.whatsappOptInVersion !== undefined)
        dbPatch.whatsapp_opt_in_version = patch.whatsappOptInVersion;
      if (patch.termsAcceptedVersion !== undefined)
        dbPatch.terms_accepted_version = patch.termsAcceptedVersion;
      if (patch.termsAcceptedAt !== undefined)
        dbPatch.terms_accepted_at = patch.termsAcceptedAt;
      if (patch.onboardingCompletedAt !== undefined)
        dbPatch.onboarding_completed_at = patch.onboardingCompletedAt;

      const { error } = await supabase
        .from('users')
        .update(dbPatch)
        .eq('firebase_uid', user.id);
      if (error) {
        console.error('[useUserProfile] update failed', error.message);
        return;
      }
      setProfile((prev) => ({
        ...(prev ?? {}),
        ...patch,
      }));
    },
    [user],
  );

  return { profile, updateProfile, loading };
}
