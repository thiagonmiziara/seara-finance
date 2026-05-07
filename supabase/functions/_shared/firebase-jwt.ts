// Validates a Firebase ID token in a Deno Edge Function and returns the user
// claims (firebase uid, email). The shared Supabase client created with the
// Service Role key cannot resolve auth.uid() in the same way the postgrest
// flow does, so when an Edge Function needs to know "who is calling" it relies
// on this helper.
//
// The function uses Firebase's public JWKS (no Admin SDK dependency).

import { jwtVerify, createRemoteJWKSet } from 'https://esm.sh/jose@5.9.6';

const FIREBASE_PROJECT_ID = Deno.env.get('FIREBASE_PROJECT_ID');
if (!FIREBASE_PROJECT_ID) {
  console.warn(
    '[firebase-jwt] FIREBASE_PROJECT_ID is not set; verifyFirebaseIdToken will fail.',
  );
}

const JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
  ),
);

export interface FirebaseClaims {
  uid: string;
  email?: string;
  name?: string;
}

export async function verifyFirebaseIdToken(
  token: string,
): Promise<FirebaseClaims> {
  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
    audience: FIREBASE_PROJECT_ID!,
  });
  return {
    uid: payload.sub as string,
    email: (payload.email as string | undefined) ?? undefined,
    name: (payload.name as string | undefined) ?? undefined,
  };
}

export function bearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? req.headers.get('Authorization');
  if (!auth) return null;
  const [scheme, token] = auth.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
