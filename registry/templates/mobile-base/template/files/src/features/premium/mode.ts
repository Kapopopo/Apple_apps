import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/**
 * store : RevenueCat ; mock : achats simulés (développement uniquement) ; unconfigured : rien ne se débloque.
 * Un build de release ne passe jamais en mock : sans clé, il offrirait l'app premium à tout le monde.
 */
export type PurchasesMode = 'store' | 'mock' | 'unconfigured';

// Expo n'injecte ces variables que si elles sont écrites en toutes lettres.
export const apiKey =
  Platform.select({
    ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  }) ?? '';

function detectMode(): PurchasesMode {
  // Expo Go et le web n'ont pas le module natif des achats.
  const native = Platform.OS !== 'web' && !isRunningInExpoGo();
  if (native && apiKey) {
    // Une clé Test Store fait planter le SDK en release.
    if (__DEV__ || !apiKey.startsWith('test_')) return 'store';
  }
  return __DEV__ ? 'mock' : 'unconfigured';
}

export const purchasesMode = detectMode();
