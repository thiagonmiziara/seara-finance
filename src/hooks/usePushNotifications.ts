import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/lib/toast';
import {
  getExistingSubscription,
  getPermission,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  type PushPermission,
} from '@/lib/push';

/** Estado + ações de notificações push para o dispositivo atual. */
export function usePushNotifications() {
  const { user } = useAuth();
  const supported = isPushSupported();
  const [permission, setPermission] = useState<PushPermission>(getPermission());
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    if (!supported) return;
    getExistingSubscription()
      .then((sub) => setIsSubscribed(Boolean(sub)))
      .catch(() => {});
  }, [supported]);

  const enable = useCallback(async () => {
    if (!user) return;
    setIsWorking(true);
    try {
      await subscribeToPush(user.id);
      setIsSubscribed(true);
      setPermission('granted');
      showToast({
        message: 'Notificações ativadas neste dispositivo.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Não foi possível ativar as notificações.',
        type: 'error',
      });
    } finally {
      setIsWorking(false);
    }
  }, [user]);

  const disable = useCallback(async () => {
    if (!user) return;
    setIsWorking(true);
    try {
      await unsubscribeFromPush(user.id);
      setIsSubscribed(false);
      showToast({
        message: 'Notificações desativadas neste dispositivo.',
        type: 'success',
      });
    } catch (err) {
      showToast({
        message:
          err instanceof Error
            ? err.message
            : 'Não foi possível desativar as notificações.',
        type: 'error',
      });
    } finally {
      setIsWorking(false);
    }
  }, [user]);

  return { supported, permission, isSubscribed, isWorking, enable, disable };
}
