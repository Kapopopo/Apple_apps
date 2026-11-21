/**
 * PillBadge : pastille au-dessus des titres de section, statut ou étiquette.
 * Variantes : neutral (pastille blanche gravée, double liseré), accent (bleu clair bordé), solid (bleu plein),
 * dark (pastille en relief sur fond noir), glass.
 * Options : icône, point (avec pulsation), italique (bandeau promo), entrée « pop » à ressort.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ease } from '@/components/atlas/process-like/lib/motion';

export type PillBadgeVariant = 'neutral' | 'accent' | 'solid' | 'dark' | 'glass';

export interface PillBadgeProps {
  children: ReactNode;
  variant?: PillBadgeVariant;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  /** Point coloré à gauche ; `pulse` ajoute l'anneau qui pulse. */
  dot?: 'success' | 'accent' | 'warning' | 'danger';
  pulse?: boolean;
  italic?: boolean;
  /** Entrée pop (scale + flou, spring-sm) au montage. */
  pop?: boolean;
  className?: string;
}

const VARIANTS: Record<PillBadgeVariant, string> = {
  neutral: 'pl-chip text-pl-fg',
  accent: 'bg-pl-accent-soft text-pl-accent border border-pl-accent-line',
  solid: 'pl-accent-fill text-white border border-white/10',
  dark: 'pl-chip-dark text-white/85',
  glass: 'pl-glass text-pl-fg',
};

const DOTS = {
  success: 'bg-pl-success-dot',
  accent: 'bg-pl-accent',
  warning: 'bg-pl-warning',
  danger: 'bg-pl-danger',
} as const;

export function PillBadge({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  dot,
  pulse = false,
  italic = false,
  pop = false,
  className,
}: PillBadgeProps) {
  return (
    <motion.span
      initial={pop ? { opacity: 0, scale: 0.6, filter: 'blur(4px)' } : false}
      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: ease.springSm }}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-pl-pill font-semibold tracking-[-0.01em] whitespace-nowrap',
        size === 'sm' ? 'h-6 px-2.5 text-[11px]' : 'h-9 px-5 text-[15px]',
        italic && 'italic',
        VARIANTS[variant],
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && <span className={cn('absolute inset-0 animate-pl-ping rounded-full', DOTS[dot])} />}
          <span className={cn('relative size-1.5 rounded-full', DOTS[dot])} />
        </span>
      )}
      {icon && <span className="-ml-0.5 grid size-3.5 place-items-center [&>svg]:size-3.5">{icon}</span>}
      {children}
    </motion.span>
  );
}

export default PillBadge;
