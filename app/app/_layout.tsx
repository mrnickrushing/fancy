import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useFonts } from 'expo-font';
import {
  BodoniModa_400Regular,
  BodoniModa_600SemiBold,
  BodoniModa_700Bold,
} from '@expo-google-fonts/bodoni-moda';
import {
  EBGaramond_400Regular,
  EBGaramond_500Medium,
  EBGaramond_600SemiBold,
} from '@expo-google-fonts/eb-garamond';
import { Italianno_400Regular } from '@expo-google-fonts/italianno';

import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { usePushNotifications } from '../src/hooks/usePushNotifications';
import { setUnauthorizedHandler } from '../src/api/client';
import { useAuthStore } from '../src/store/auth';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

// A redirect rather than two separate trees, so every route stays addressable
// — a notification tap can name /(tabs)/orders whether or not the phone has
// finished restoring its credentials yet.
function AuthGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const segments = useSegments();
  const router = useRouter();

  usePushNotifications(isAuthenticated);

  useEffect(() => {
    const onLoginScreen = segments[0] === 'login';
    if (!isAuthenticated && !onLoginScreen) {
      router.replace('/login');
    } else if (isAuthenticated && onLoginScreen) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, router]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="new-order" options={{ presentation: 'card' }} />
      <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="customer/[customerKey]" options={{ presentation: 'card' }} />
      <Stack.Screen name="updates" options={{ presentation: 'card' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_600SemiBold,
    BodoniModa_700Bold,
    EBGaramond_400Regular,
    EBGaramond_500Medium,
    EBGaramond_600SemiBold,
    Italianno_400Regular,
  });

  const restore = useAuthStore((s) => s.restore);
  const isRestoring = useAuthStore((s) => s.isRestoring);
  const expireSession = useAuthStore((s) => s.expireSession);

  useEffect(() => {
    restore();
  }, [restore]);

  // A 401 from anywhere means the password changed under us.
  useEffect(() => {
    setUnauthorizedHandler(() => expireSession());
    return () => setUnauthorizedHandler(null);
  }, [expireSession]);

  // isEnabled is false until `eas init` and a build with an update channel, so
  // this is a no-op in development and in a bare local run.
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (!check.isAvailable) return;
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // An update that cannot be fetched is not worth interrupting a
        // market morning over.
      }
    })();
  }, []);

  const ready = fontsLoaded && !isRestoring;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Holding the splash avoids the login screen flashing past a phone that is
  // already signed in.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <StatusBar style="dark" />
          <AuthGate />
        </ErrorBoundary>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
