import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@/lib/firebase';

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ??
  'http://localhost:54321';
const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ??
  'public-anon-key-placeholder';

if (
  !import.meta.env.VITE_SUPABASE_URL ||
  !import.meta.env.VITE_SUPABASE_ANON_KEY
) {
  if (import.meta.env.MODE === 'production') {
    console.error(
      'Supabase: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidos',
    );
  }
}

export const supabase: SupabaseClient = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    accessToken: async () => {
      const current = auth.currentUser;
      if (!current) return null;
      try {
        return await current.getIdToken();
      } catch {
        return null;
      }
    },
  },
);
