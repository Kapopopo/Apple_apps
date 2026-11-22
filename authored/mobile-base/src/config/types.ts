import type { IllustrationName } from './illustrations';

export type PlanId = 'weekly' | 'annual';

export interface OnboardingSlide {
  title: string;
  text: string;
  illustration: IllustrationName;
}

export interface OnboardingQuestion {
  /** Clé de la réponse enregistrée : `useAnswers()[id]`. */
  id: string;
  title: string;
  options: string[];
  multiple: boolean;
}

export interface AppConfig {
  name: string;
  slug: string;
  scheme: string;
  version: string;
  bundleId: string;
  /** Identifiant numérique App Store Connect, pour « Noter l'app ». */
  iosAppId: string;
  supportEmail: string;
  termsUrl: string;
  privacyUrl: string;
  revenueCat: {
    entitlement: string;
    /** Vide = offering courante. */
    offering: string;
    /** true seulement si un paywall est configuré dans le dashboard RevenueCat pour cette offering. */
    useDashboardPaywall: boolean;
  };
  /** Essai simulé en mode mock. L'essai réel se règle dans App Store Connect / Play Console. */
  trial: { days: number; plan: PlanId };
  layouts: { onboarding: 'fullscreen' | 'cards' | 'list'; paywall: 'image' | 'cards' | 'benefits' };
  /** 3 à 5 écrans, puis les questions, puis le paywall. */
  onboarding: { slides: OnboardingSlide[]; questions: OnboardingQuestion[] };
  paywall: { title: string; subtitle: string; illustration: IllustrationName; benefits: string[] };
}
