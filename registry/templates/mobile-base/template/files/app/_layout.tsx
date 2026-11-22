import '../global.css';
import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, type Href } from 'expo-router';
import { ThemeProvider } from 'expo-router/react-navigation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { fontAssets } from '@/config/fonts';
import { PremiumProvider, usePremium } from '@/features/premium';
import { StorageProvider, useStorage } from '@/lib/storage';
import { useNavigationTheme } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StorageProvider>
        <PremiumProvider>
          <Navigation />
        </PremiumProvider>
      </StorageProvider>
    </SafeAreaProvider>
  );
}

/** Onboarding → paywall bloquant → app. Chaque écran n'existe que si sa garde passe. */
function Navigation() {
  const [fontsLoaded, fontsError] = useFonts(fontAssets);
  const { ready: storageReady, onboarded } = useStorage();
  const { loading, isPremium } = usePremium();
  const theme = useNavigationTheme();
  const ready = storageReady && !loading && (fontsLoaded || !!fontsError);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  // Destination explicite : par défaut Expo Router renvoie vers la première route du dossier app/, et un écran
  // ajouté à la racine prendrait alors la place de l'onboarding et du paywall.
  const landing: Href = !onboarded ? '/onboarding' : isPremium ? '/' : '/paywall';
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!onboarded} redirectTo={landing}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded && !isPremium} redirectTo={landing}>
          <Stack.Screen name="paywall" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded && isPremium} redirectTo={landing}>
          <Stack.Screen name="(main)" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded} redirectTo={landing}>
          <Stack.Screen name="settings" />
        </Stack.Protected>
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
