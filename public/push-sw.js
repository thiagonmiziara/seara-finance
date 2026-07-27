/**
 * Seara Finance — handlers de Web Push.
 *
 * Este arquivo é injetado no service worker gerado pelo Workbox via
 * `workbox.importScripts` (ver vite.config.ts). Mantê-lo em JS puro dentro de
 * /public evita que o `tsc` do build precise tipar contexto de service worker.
 *
 * Payload esperado (JSON enviado pelo backend):
 *   { title, body, url?, tag?, requireInteraction? }
 */

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_e) {
    payload = { body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'Seara Finance';
  const options = {
    body: payload.body || '',
    icon: '/notification-icon.png',
    badge: '/notification-badge.png',
    // Vibração ao chegar (o "barulho" em si é decidido pelo SO/canal).
    vibrate: [200, 100, 200],
    // `tag` agrupa/atualiza a notificação da mesma conta; renotify re-alerta.
    tag: payload.tag || undefined,
    renotify: Boolean(payload.tag),
    // Mantém a notificação até o usuário interagir (bom p/ lembrete de conta).
    requireInteraction: payload.requireInteraction !== false,
    data: { url: payload.url || '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já houver uma aba aberta, foca nela.
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) {
              client.navigate(targetUrl).catch(() => {});
            }
            return client.focus();
          }
        }
        // Senão, abre uma nova.
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
      }),
  );
});
