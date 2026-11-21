/**
 * StepCard : grande carte en verre clair (blanc 55 %, rayon 28) cerclée d'un liseré bleu et d'un halo bleu diffus ; visuel en haut (slot `visual`,
 * placeholder sombre en perspective par défaut), pill « Étape N · Nom », titre 24 px et texte.
 * Hover : lift de 2 px. Entrée card-in au scroll.
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { cardIn, inView, lift } from '@/components/atlas/process-like/lib/motion';
import { PillBadge } from '@/components/atlas/process-like/pill-badge/pill-badge';

export interface StepCardProps {
  step: number;
  /** Nom court de l'étape, affiché dans la pill (« Étape 1 · Préparer »). */
  stepName?: string;
  title: string;
  description?: ReactNode;
  visual?: ReactNode;
  /** Hauteur du visuel (px). */
  visualHeight?: number;
  className?: string;
}

/** Visuel par défaut : scène sombre avec sol en grille et cartes grises flottantes (placeholder). */
export function StepPlaceholder({ variant = 0 }: { variant?: number }) {
  return (
    <div className="pl-placeholder-dark relative h-full w-full overflow-hidden">
      <div
        className="absolute inset-x-[-20%] bottom-[-10%] h-[70%] origin-bottom"
        style={{
          transform: 'perspective(500px) rotateX(62deg)',
          backgroundImage:
            'linear-gradient(rgb(47 91 255 / 0.35) 1px, transparent 1px), linear-gradient(90deg, rgb(47 91 255 / 0.35) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          maskImage: 'linear-gradient(to top, #000 20%, transparent)',
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            data-pl-loop
            className={cn(
              'animate-pl-float rounded-pl-sm border border-white/10 bg-white/[0.07] backdrop-blur-sm',
              i === 1 ? 'h-32 w-24' : 'h-24 w-20 opacity-70',
            )}
            style={{ animationDelay: `${-(i + variant) * 1.4}s` }}
          />
        ))}
      </div>
      <div className="absolute -bottom-10 left-1/2 h-24 w-2/3 -translate-x-1/2 rounded-full bg-pl-accent/40 blur-3xl" />
    </div>
  );
}

export function StepCard({ step, stepName, title, description, visual, visualHeight = 240, className }: StepCardProps) {
  return (
    <motion.article
      variants={cardIn}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      {...lift}
      className={cn(
        'group w-full overflow-hidden rounded-pl-lg bg-white/55 p-2 backdrop-blur-sm',
        'shadow-pl-glow-soft transition-shadow duration-300 hover:shadow-[0_0_0_1px_rgb(120_130_255/0.24),0_0_44px_rgb(79_123_255/0.42),0_28px_64px_rgb(20_24_40/0.18)]',
        className,
      )}
    >
      <div className="overflow-hidden rounded-[22px]" style={{ height: visualHeight }}>
        {visual ?? <StepPlaceholder variant={step} />}
      </div>
      <div className="space-y-3 px-4 pt-5 pb-6 sm:px-5">
        <PillBadge variant="neutral">
          Étape {step}
          {stepName ? ` · ${stepName}` : ''}
        </PillBadge>
        <h3 className="text-[22px] leading-tight font-semibold tracking-[-0.03em] text-pl-fg sm:text-2xl">{title}</h3>
        {description && <p className="text-[15px] leading-relaxed text-pl-fg-2">{description}</p>}
      </div>
    </motion.article>
  );
}

export default StepCard;
