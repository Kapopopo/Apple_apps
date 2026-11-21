/**
 * Section avis (clair) : badge + H2 deux tons aligné à gauche et CTA à droite (au-dessus sur mobile), puis
 * défilement continu bord à bord de cartes d'avis (pause au survol) (capture ou bulle de messages, étoiles vertes).
 * Avis fictifs génériques : à remplacer par de vrais avis du projet.
 */
import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { cn } from '@/lib/utils';
import { SectionHeading } from '@/components/atlas/process-like/section-heading/section-heading';
import { ReviewCard, type ReviewCardProps } from '@/components/atlas/process-like/review-card/review-card';
import { PrimaryButton } from '@/components/atlas/process-like/primary-button/primary-button';

export interface ReviewsProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  description?: ReactNode;
  reviews?: ReviewCardProps[];
  ctaLabel?: string;
  onCta?: () => void;
  className?: string;
}

/** Avis d'exemple de longueur comparable (2 à 3 lignes) : les cartes sont remplies et toutes de même hauteur. */
const DEFAULT_REVIEWS: ReviewCardProps[] = [
  {
    quote: 'Simple à prendre en main, je gagne un temps fou chaque semaine sur mes publications.',
    author: 'Camille Martin',
    meta: 'Créatrice de contenu',
  },
  {
    variant: 'chat',
    messages: ['Bonjour, une question rapide…', 'Mes vidéos sont planifiées toutes seules ?', 'Oui, aux meilleures heures 👌'],
    quote: 'Réponse en quelques minutes et un outil très fiable, rien à redire.',
    author: 'Lucas Bernard',
    meta: 'Indépendant',
  },
  {
    quote: 'Tout est clair dès le départ, je n’ai rien eu à configurer pour mes trois clients.',
    author: 'Sarah Dubois',
    meta: 'Agence',
  },
  {
    variant: 'chat',
    messages: ['Ça marche aussi sur mobile ?', 'Oui, partout, et c’est synchronisé.', 'Parfait, merci !'],
    quote: 'Exactement ce qu’il me fallait pour publier sans y passer mes soirées.',
    author: 'Inès Petit',
    meta: 'Petite entreprise',
  },
  {
    quote: 'Le meilleur rapport simplicité / résultat que j’ai testé, et j’en ai essayé beaucoup.',
    author: 'Hugo Laurent',
    meta: 'Développeur',
  },
];

export function Reviews({
  badge = 'Avis',
  title = 'Ils l’utilisent chaque jour.',
  subtitle = 'Voici ce qu’ils en disent.',
  description = 'Des retours reçus de membres, tels quels. Ils utilisent l’outil au quotidien.',
  reviews = DEFAULT_REVIEWS,
  ctaLabel = 'Commencer gratuitement',
  onCta,
  className,
}: ReviewsProps) {
  return (
    <MotionConfig reducedMotion="user">
      <section id="avis" className={cn('pl-root w-full overflow-hidden bg-pl-page py-[72px] sm:py-[120px]', className)}>
        <div className="mx-auto max-w-[1036px] px-5 sm:px-0">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading badge={badge} title={title} subtitle={subtitle} description={description} align="left" />
            <PrimaryButton size="lg" arrow={false} onClick={onCta} className="self-start sm:mb-2 sm:self-end">
              {ctaLabel}
            </PrimaryButton>
          </div>
        </div>
        {/* Défilement continu bord à bord (pause au survol, figé sous prefers-reduced-motion : défilement manuel). */}
        <div
          className="group mt-10 overflow-x-auto [scrollbar-width:none] sm:mt-14 motion-safe:overflow-hidden"
          role="region"
          aria-label="Avis"
        >
          <div
            data-pl-loop
            className="flex w-max items-stretch gap-4 px-5 group-hover:[animation-play-state:paused]"
            style={{ animation: 'pl-marquee 80s linear infinite' }}
          >
            {/* items-stretch + carte en h-full : toutes les cartes prennent la hauteur de la plus grande. */}
            {[...reviews, ...reviews].map((r, i) => (
              <div key={i} className="flex" aria-hidden={i >= reviews.length || undefined}>
                <ReviewCard {...r} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </MotionConfig>
  );
}

export default Reviews;
