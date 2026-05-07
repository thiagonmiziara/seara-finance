import { supabase } from '@/lib/supabase';

export interface SyncableUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export async function syncUserToSupabase(user: SyncableUser) {
  const { error } = await supabase.from('users').upsert(
    {
      firebase_uid: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'firebase_uid' },
  );

  if (error) {
    console.error('[users] sync error', error.message);
  }
}

export async function getCurrentUserRowId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[users] getCurrentUserRowId', error.message);
    return null;
  }
  return data?.id ?? null;
}
