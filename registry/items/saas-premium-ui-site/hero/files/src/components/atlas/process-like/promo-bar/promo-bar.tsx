/**
 * PromoBar : bandeau promo de 36 px, blanc, centré : badge pill bleu en italique + texte/prix + mini bouton noir.
 * `fixed` : collé en haut de la fenêtre (défaut : statique, pour s'intégrer dans un layout). Fermable (`onDismiss`).
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PillBadge } from '@/components/atlas/process-like/pill-badge/pill-badge';

export interface PromoBarProps {
  badge?: string;
  children: ReactNode;
  ctaLabel?: string;
  onCta?: MouseEventHandler<HTMLElement>;
  ctaHref?: string;
  fixed?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function PromoBar({
  badge = 'Offre',
  children,
  ctaLabel = 'En profiter',
  onCta,
  ctaHref,
  fixed = false,
  onDismiss,
  className,
}: PromoBarProps) {
  const ctaClass =
    'inline-flex h-6 shrink-0 items-center rounded-pl-pill bg-pl-ink px-2.5 text-[12px] font-medium text-white transition-transform duration-150 active:scale-[0.97]';
  return (
    <div
      role="region"
      aria-label="Annonce"
      className={cn(
        'z-50 flex h-9 w-full items-center justify-center gap-2.5 border-b border-pl-border bg-white px-10 text-[13px] text-pl-ink',
        fixed ? 'fixed inset-x-0 top-0' : 'relative',
        className,
      )}
    >
      <PillBadge variant="solid" size="sm" italic className="max-[360px]:hidden">
        {badge}
      </PillBadge>
      <span className="truncate font-medium">{children}</span>
      {ctaHref ? (
        <a href={ctaHref} onClick={onCta} className={ctaClass}>
          {ctaLabel}
        </a>
      ) : (
        <button type="button" onClick={onCta} className={ctaClass}>
          {ctaLabel}
        </button>
      )}
      {onDismiss && (
        <button
          type="button"
          aria-label="Fermer l’annonce"
          onClick={onDismiss}
          className="absolute right-3 grid size-6 place-items-center rounded-full text-pl-muted-2 hover:text-pl-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export default PromoBar;
