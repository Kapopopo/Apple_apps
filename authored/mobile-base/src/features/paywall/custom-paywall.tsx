import { useState } from 'react';
import { appConfig } from '@/config/app';
import type { PlanId } from '@/config/types';
import { usePremium } from '@/features/premium';
import { paywallLayouts } from './layouts';

/** Paywall de secours, et paywall par défaut tant qu'aucun n'est configuré chez RevenueCat. */
export function CustomPaywall() {
  const { plans } = usePremium();
  const [choice, setChoice] = useState<PlanId>('annual');
  // Offering à une seule offre : c'est elle qui est sélectionnée.
  const selected = plans.find((p) => p.id === choice)?.id ?? plans[0]?.id ?? choice;
  const Layout = paywallLayouts[appConfig.layouts.paywall];
  return <Layout selected={selected} onSelect={setChoice} />;
}
