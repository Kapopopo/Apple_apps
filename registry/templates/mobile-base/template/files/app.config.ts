/// <reference types="node" />
import 'tsx/cjs';
import fs from 'node:fs';
import path from 'node:path';
import type { ExpoConfig } from 'expo/config';
import { appConfig as app } from './src/config/app';
import theme from './src/config/theme.json';

const icon = fs.existsSync(path.join(__dirname, 'assets/icon.png')) ? './assets/icon.png' : undefined;

/** Ce qui ferait refuser l'app, ou publier des achats inutilisables. Contrôlé pour un build EAS « production ». */
function productionProblems(): string[] {
  const ios = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
  const android = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
  const platform = process.env.EAS_BUILD_PLATFORM;
  const problems: string[] = [];
  if (platform !== 'android' && !ios.startsWith('appl_')) problems.push('EXPO_PUBLIC_REVENUECAT_IOS_KEY : clé appl_… attendue');
  if (platform !== 'ios' && !android.startsWith('goog_')) problems.push('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY : clé goog_… attendue');
  if (app.bundleId.startsWith('com.example.')) problems.push('bundleId : encore un exemple');
  if (!app.termsUrl) problems.push('termsUrl : lien CGU obligatoire (3.1.2)');
  if (!app.privacyUrl) problems.push('privacyUrl : politique de confidentialité obligatoire (5.1.1)');
  if (!app.supportEmail) problems.push('supportEmail : contact du support obligatoire (1.5)');
  if (!icon) problems.push('assets/icon.png : icône propre à cette app absente');
  return problems;
}

export default (): ExpoConfig => {
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const problems = productionProblems();
    if (problems.length) throw new Error(`Build de production refusé :\n- ${problems.join('\n- ')}`);
  }
  return {
    name: app.name,
    slug: app.slug,
    scheme: app.scheme,
    version: app.version,
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    backgroundColor: theme.colors.light.background,
    ...(icon ? { icon } : {}),
    ios: {
      bundleIdentifier: app.bundleId,
      supportsTablet: false,
      // À revoir si l'app embarque un chiffrement autre que HTTPS.
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: { package: app.bundleId },
    web: { bundler: 'metro', output: 'single' },
    plugins: [
      'expo-router',
      'expo-status-bar',
      ['expo-splash-screen', { backgroundColor: theme.colors.light.background, dark: { backgroundColor: theme.colors.dark.background } }],
    ],
  };
};
