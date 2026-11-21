/**
 * Section tarifs (fond clair) : afficheur LED à points dans un cadre noir épais (ligne d'offre + compte à rebours
 * en jours), H2 sur une ligne et accroche grise sur 2 lignes, puis 2 cartes à cadre noir — graphite (mensuelle) et
 * bleue (vedette : étiquette inclinée, prix barré, paiement en 3 fois). Chaque carte porte son bouton : c'est le
 * choix d'offre, pas un CTA de section concurrent.
 */
import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { cn } from '@/lib/utils';
import { LedDisplay } from '@/components/atlas/process-like/led-display/led-display';
import { SectionHeading } from '@/components/atlas/process-like/section-heading/section-heading';
import { PricingCard, type PricingCardProps } from '@/components/atlas/process-like/pricing-card/pricing-card';
import { DotGridBackground } from '@/components/atlas/process-like/dot-grid-background/dot-grid-background';

export interface PricingProps {
  title?: string;
  description?: ReactNode;
  /** Ligne de l'afficheur LED au-dessus du compte à rebours ; vide pour l'omettre. */
  ledText?: string;
  /** Étiquette en onglet au-dessus de l'afficheur. */
  ledLabel?: string;
  /** Secondes restantes de l'offre ; 0 pour masquer l'afficheur. */
  countdown?: number;
  plans?: [PricingCardProps, PricingCardProps];
  className?: string;
}

const FEATURES = ['Toutes les fonctionnalités', 'Synchronisation multi-appareils', 'Mises à jour incluses', 'Support prioritaire'];

const DEFAULT_PLANS: [PricingCardProps, PricingCardProps] = [
  {
    name: 'Mensuel',
    tag: '−30 %',
    description: 'Sans engagement, résiliable en un clic',
    price: 19,
    originalPrice: '27€',
    period: '/mois',
    features: FEATURES.map((label, i) => ({ label, included: i < 3 })),
    ctaLabel: 'Commencer',
    discountLabel: '−8€/mois',
  },
  {
    variant: 'accent',
    name: 'À vie',
    tag: '✦ Le plus choisi',
    description: 'Un seul paiement, sans abonnement',
    price: 149,
    originalPrice: '249€',
    period: 'une fois',
    installments: 3,
    badge: 'Offre limitée',
    discountLabel: '−40 %',
    features: FEATURES.map((label) => ({ label })),
    ctaLabel: 'Choisir cette offre',
  },
];

export function Pricing({
  title = 'Des tarifs simples, sans risque',
  description = (
    <>
      Commencez gratuitement, changez d’offre quand vous voulez.
      <br className="max-sm:hidden" /> Sans engagement, résiliable en un clic.
    </>
  ),
  ledText = '149€ A VIE',
  ledLabel = 'Offre limitée',
  countdown = 10 * 86400 + 13 * 3600 + 52 * 60 + 18,
  plans = DEFAULT_PLANS,
  className,
}: PricingProps) {
  return (
    <MotionConfig reducedMotion="user">
      <section
        id="tarifs"
        className={cn('pl-root relative isolate w-full overflow-hidden bg-pl-page px-5 py-[72px] sm:px-8 sm:py-[120px]', className)}
      >
        {/* Trame de points sur les deux côtés (centre dégagé pour l'afficheur et les cartes). */}
        <DotGridBackground
          clearCenter={0.45}
          halo={false}
          spacing={13}
          dotSize={2.1}
          className="-z-10 [mask-image:linear-gradient(90deg,#000,transparent_26%,transparent_74%,#000)]"
        />
        <div className="mx-auto flex max-w-[960px] flex-col items-center">
          {countdown > 0 && (
            <LedDisplay
              label={ledLabel}
              text={ledText || undefined}
              countdown={countdown}
              tone="dim"
              rowTones={ledText ? ['dimAccent', 'dim'] : ['dim']}
              dot={3.6}
              gap={1.4}
              className="mt-6 mb-10 sm:mb-14"
            />
          )}
          <SectionHeading title={title} description={description} />
          <div className="relative isolate mt-12 grid w-full max-w-[900px] gap-4 pt-4 sm:mt-14 md:grid-cols-2 md:grid-rows-[auto_auto]">
            {/* Halos sous les cartes (côte à côte dès md) : gris bleuté sous la graphite, bleu sous la vedette. */}
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-14 left-[4%] -z-10 hidden h-48 w-[42%] rounded-full bg-[radial-gradient(closest-side,rgb(92_98_124/0.75),transparent)] blur-2xl md:block"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute right-[4%] -bottom-14 -z-10 hidden h-48 w-[42%] rounded-full bg-[radial-gradient(closest-side,rgb(47_91_255/0.85),transparent)] blur-2xl md:block"
            />
            {plans.map((p) => (
              <PricingCard key={p.name} {...p} />
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default Pricing;
