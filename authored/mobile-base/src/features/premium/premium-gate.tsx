import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator } from 'react-native';
import { texts } from '@/config/texts';
import { usePremium } from './provider';

/** Affiche ses enfants aux abonnés, renvoie les autres vers le paywall. */
export function PremiumGate({ children }: { children: ReactNode }) {
  const { isPremium, loading } = usePremium();
  if (loading) return <ActivityIndicator accessibilityLabel={texts.gateLoading} className="flex-1 text-primary" />;
  return isPremium ? <>{children}</> : <Redirect href="/paywall" />;
}
