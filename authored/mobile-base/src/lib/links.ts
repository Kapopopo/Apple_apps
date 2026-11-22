import * as StoreReview from 'expo-store-review';
import { Linking, Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import { appConfig } from '@/config/app';
import { texts } from '@/config/texts';
import type { PurchasesMode } from '@/features/premium/mode';

/** Chaque action renvoie un message à afficher, ou null. */
export async function openLink(url: string, failure: string = texts.links.failed): Promise<string | null> {
  if (!url) return texts.links.missing;
  try {
    await Linking.openURL(url);
    return null;
  } catch {
    return failure;
  }
}

export async function contactSupport(): Promise<string | null> {
  const email = appConfig.supportEmail;
  if (!email) return texts.links.missing;
  return openLink(`mailto:${email}?subject=${encodeURIComponent(appConfig.name)}`, texts.links.email(email));
}

export async function manageSubscription(mode: PurchasesMode, managementUrl: string | null): Promise<string | null> {
  if (Platform.OS === 'ios' && mode === 'store') {
    try {
      await Purchases.showManageSubscriptions();
      return null;
    } catch {
      // Feuille native indisponible : page du store ci-dessous.
    }
  }
  if (managementUrl) return openLink(managementUrl);
  return openLink(
    Platform.OS === 'android'
      ? `https://play.google.com/store/account/subscriptions?package=${appConfig.bundleId}`
      : 'https://apps.apple.com/account/subscriptions',
  );
}

export async function rateApp(): Promise<string | null> {
  if (Platform.OS === 'android') return openLink(`https://play.google.com/store/apps/details?id=${appConfig.bundleId}`);
  if (appConfig.iosAppId) return openLink(`https://apps.apple.com/app/id${appConfig.iosAppId}?action=write-review`);
  try {
    if (await StoreReview.isAvailableAsync()) {
      await StoreReview.requestReview();
      return null;
    }
  } catch {
    // Même message que si la notation est indisponible.
  }
  return texts.links.noReview;
}
