# 0001 — Firebase Auth (e-mail/senha) + Supabase (Postgres) para dados

- **Status:** aceito
- **Data:** 2026-05-04

## Contexto

O projeto-base (`seara-finance`) usa **Firebase** para tudo: Google OAuth para login e Firestore para dados. A solicitação do produto é:

1. Login por **e-mail/senha** (não Google).
2. Dados em **Supabase**.

Precisamos decidir como combinar essas duas peças sem reinventar autenticação.

## Opções consideradas

1. **Supabase Auth + Supabase DB** — auth e dados num único stack. Simplifica permissões via RLS direta com `auth.uid()`. Migração mais radical, perde compatibilidade com qualquer integração futura que esperasse Firebase.
2. **Firebase Auth (e-mail/senha) + Supabase DB** — mantém SDK do Firebase já instalado, troca só o provedor (Google → senha). Supabase aceita JWT externo via "Custom JWT" / 3rd-party JWT, mas exige passar o ID Token do Firebase ao Supabase Client e habilitar verificação JWT no projeto Supabase.
3. **Firebase Auth + Firestore (status quo)** — não atende ao requisito de Supabase.

## Decisão

**Opção 2.** Firebase Authentication com provider **e-mail/senha** + dados no Supabase.

Configuração da ponte:

- Habilitar **e-mail/senha** no console Firebase (Authentication → Sign-in method).
- Desabilitar Google OAuth.
- No Supabase, configurar **3rd-party auth (Firebase)** ou função de validação de JWT, fornecendo a URL de JWKS do Firebase. Isso permite ao Supabase decodificar o ID Token e popular `auth.uid()` com o `sub` (Firebase UID).
- RLS de cada tabela usa `auth.uid()::text = user_id::text` (ou conversão para uuid se mantivermos coluna `firebase_uid uuid` mapeada).
- No frontend, ao fazer signin com Firebase, pegar o ID Token (`firebaseUser.getIdToken()`) e passá-lo ao client Supabase via `supabase.auth.setSession({ access_token, refresh_token })` — ou usar a API `accessToken` do `@supabase/supabase-js` v2.45+ (callback que devolve o token Firebase atual a cada request).

## Consequências

### Positivas

- Reaproveita SDK do Firebase já instalado e os hooks `useAuth` existentes (com pequenas mudanças).
- Supabase nos dá Postgres real, RLS, Edge Functions e Storage num só plano.
- Separação saudável: Firebase só cuida de identidade; Supabase cuida de dados/Edge Functions/notificações.

### Negativas

- Dois provedores na conta = duas faturas (geralmente Free Tier dá conta no início).
- Necessário manter `users` table no Supabase como espelho do user Firebase (criada via Edge Function ou trigger no primeiro acesso).
- Refresh token do Firebase tem ciclo próprio; precisamos garantir que o token entregue ao Supabase é sempre válido (callback `accessToken`).

### A monitorar

- Latência adicional da troca/validação de JWT.
- Custo combinado conforme escala.

## Referências

- Firebase Auth (e-mail/senha): https://firebase.google.com/docs/auth/web/password-auth
- Supabase Third-Party Auth (Firebase): https://supabase.com/docs/guides/auth/third-party/firebase-auth
- supabase-js `accessToken` option: https://supabase.com/docs/reference/javascript/initializing
