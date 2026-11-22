import { Platform } from 'react-native';
import Purchases, { INTRO_ELIGIBILITY_STATUS, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { appConfig } from '@/config/app';
import { texts } from '@/config/texts';
import type { PlanId } from '@/config/types';

export interface Plan {
  id: PlanId;
  /** Montant réellement débité à chaque période, formaté par le store. */
  price: string;
  /** Offre de lancement à laquelle la personne a droit, d'après le store. */
  offer: string | null;
  pkg: PurchasesPackage | null;
}

const PERIODS: Record<PlanId, string[]> = { weekly: ['P1W', 'P7D'], annual: ['P1Y', 'P12M'] };

export function mockPlans(): Plan[] {
  const { days, plan } = appConfig.trial;
  const offer = (id: PlanId) => (days > 0 && plan === id ? texts.paywall.trial(texts.duration(days, 'DAY')) : null);
  return [
    { id: 'annual', price: '39,99 €', offer: offer('annual'), pkg: null },
    { id: 'weekly', price: '4,99 €', offer: offer('weekly'), pkg: null },
  ];
}

async function introOffer(pkg: PurchasesPackage): Promise<string | null> {
  const { product } = pkg;
  if (Platform.OS === 'android') {
    // Play ne renvoie que les offres auxquelles le compte a droit.
    const phase = product.defaultOption?.freePhase ?? product.defaultOption?.introPhase;
    if (!phase) return null;
    const duration = texts.duration(phase.billingPeriod.value * (phase.billingCycleCount ?? 1), phase.billingPeriod.unit);
    return phase.price.amountMicros === 0 ? texts.paywall.trial(duration) : texts.paywall.intro(phase.price.formatted, duration);
  }
  const intro = product.introPrice;
  if (!intro) return null;
  try {
    const result = await Purchases.checkTrialOrIntroductoryPriceEligibility([product.identifier]);
    if (result[product.identifier]?.status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE) return null;
  } catch {
    // Éligibilité inconnue : ne pas promettre un essai qui pourrait être facturé.
    return null;
  }
  const duration = texts.duration(intro.periodNumberOfUnits * intro.cycles, intro.periodUnit);
  return intro.price === 0 ? texts.paywall.trial(duration) : texts.paywall.intro(intro.priceString, duration);
}

export async function storePlans(): Promise<{ offering: PurchasesOffering | null; plans: Plan[] }> {
  const { offering: wanted } = appConfig.revenueCat;
  const { all, current } = await Purchases.getOfferings();
  const offering = (wanted ? all[wanted] : current) ?? null;
  if (!offering) return { offering: null, plans: [] };
  const plans: Plan[] = [];
  for (const id of ['annual', 'weekly'] as const) {
    // La période vient du produit, pas de l'emplacement dans l'offering : c'est elle qui est affichée.
    const pkg = offering.availablePackages.find((p) => PERIODS[id].includes(p.product.subscriptionPeriod ?? ''));
    if (pkg) plans.push({ id, price: pkg.product.priceString, offer: await introOffer(pkg), pkg });
  }
  return { offering, plans };
}
