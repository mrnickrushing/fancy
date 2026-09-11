import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { registerPushToken, unregisterPushToken } from '../api/push';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getToken(): Promise<string | null> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  // iOS only ever shows the prompt once; asking again after a refusal simply
  // fails, so the earlier answer is respected.
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('orders', {
      name: 'Order alerts',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  // Written by `eas init`. Without it there is no project to mint a token
  // against, so registration is skipped rather than throwing.
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
    ?.projectId;
  if (!projectId) return null;

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

// Registration is repeated on every launch, which the server treats as a
// heartbeat. Every failure here is swallowed: a phone that cannot register
// still runs the rest of the app perfectly well.
export function usePushNotifications(isAuthenticated: boolean) {
  const router = useRouter();
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (isAuthenticated) {
      (async () => {
        try {
          const token = await getToken();
          if (!token || cancelled) return;
          tokenRef.current = token;
          await registerPushToken(token);
        } catch (err) {
          console.warn('Could not register for order alerts:', err);
        }
      })();
    } else if (tokenRef.current) {
      const token = tokenRef.current;
      tokenRef.current = null;
      unregisterPushToken(token).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      if (response.notification.request.content.data?.type === 'order') {
        router.push('/(tabs)/orders');
      }
    });
    return () => sub.remove();
  }, [router]);
}
