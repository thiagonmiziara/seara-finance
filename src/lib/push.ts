/**
 * Web Push — lado do cliente.
 *
 * Fluxo: pedir permissão → assinar no PushManager com a chave VAPID pública →
 * salvar a subscription em `users/{uid}/pushSubscriptions/{hash(endpoint)}`.
 * O backend (whatsapp-bot) lê essas subscriptions e dispara os pushes.
 */
import { doc, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

export type PushPermission = NotificationPermission | 'unsupported';

/** Web Push só funciona com SW + PushManager + Notification disponíveis. */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPermission(): PushPermission {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

/** VAPID pública vem em base64url; o PushManager exige um BufferSource. */
function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return buffer;
}

/** ID de doc estável e determinístico por endpoint (endpoint tem '/', não serve como ID). */
async function subscriptionDocId(endpoint: string): Promise<string> {
  const bytes = new TextEncoder().encode(endpoint);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function saveSubscription(
  uid: string,
  sub: PushSubscription,
): Promise<void> {
  const json = sub.toJSON();
  const id = await subscriptionDocId(sub.endpoint);
  await setDoc(
    doc(db, 'users', uid, 'pushSubscriptions', id),
    {
      endpoint: json.endpoint,
      keys: json.keys ?? null,
      userAgent: navigator.userAgent,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

/**
 * Pede permissão, assina o push e persiste a subscription no Firestore.
 * Lança erro com mensagem amigável quando não é possível.
 */
export async function subscribeToPush(uid: string): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Este navegador/dispositivo não suporta notificações push.');
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Configuração ausente (VITE_VAPID_PUBLIC_KEY).');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificações negada.');
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(VAPID_PUBLIC_KEY),
    });
  }
  await saveSubscription(uid, sub);
  return sub;
}

/** Cancela a assinatura no navegador e remove o registro do Firestore. */
export async function unsubscribeFromPush(uid: string): Promise<void> {
  const sub = await getExistingSubscription();
  if (!sub) return;
  const id = await subscriptionDocId(sub.endpoint);
  await sub.unsubscribe().catch(() => {});
  await deleteDoc(doc(db, 'users', uid, 'pushSubscriptions', id)).catch(
    () => {},
  );
}
