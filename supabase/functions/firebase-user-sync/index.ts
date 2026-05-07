// firebase-user-sync
//
// Called by the frontend right after the first Firebase login (or whenever the
// app needs to make sure the Supabase row exists). Verifies the Firebase ID
// token, upserts the matching row in public.users, and returns its uuid.
//
// The frontend should call this once per session before issuing other
// requests; for a smoother UX the AuthProvider does it via syncUserToSupabase
// using the regular postgrest client (the call below is the canonical source
// of truth and is what an Edge Function-side flow uses).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { corsHeaders } from '../_shared/cors.ts';
import {
  bearerToken,
  verifyFirebaseIdToken,
} from '../_shared/firebase-jwt.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const token = bearerToken(req);
  if (!token) {
    return new Response('Missing bearer token', { status: 401 });
  }

  let claims;
  try {
    claims = await verifyFirebaseIdToken(token);
  } catch (err) {
    console.error('[firebase-user-sync] invalid token', err);
    return new Response('Invalid token', { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    email?: string;
    avatar_url?: string;
  };

  const { data, error } = await admin
    .from('users')
    .upsert(
      {
        firebase_uid: claims.uid,
        email: body.email ?? claims.email ?? '',
        name: body.name ?? claims.name ?? null,
        avatar_url: body.avatar_url ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'firebase_uid' },
    )
    .select('id')
    .single();

  if (error) {
    console.error('[firebase-user-sync] upsert failed', error);
    return new Response(error.message, { status: 500 });
  }

  return new Response(JSON.stringify({ id: data.id }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
