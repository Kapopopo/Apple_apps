/**
 * LockedOverlay : contenu « verrouillé » — dégradé vers le noir sur le bas du contenu, pill cadenas,
 * gros titre blanc et CTA à bordure lumineuse. Le contenu reste visible en haut (aperçu), inerte.
 * Props : children (contenu flouté/masqué), label, title, description, ctaLabel, onCta, height, blur.
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp, inView, stagger } from '@/lib/motion';
import { PillBadge } from '@/components/pill-badge';
import { GlowButton } from '@/components/glow-button';

export interface LockedOverlayProps {
  children: ReactNode;
  label?: string;
  title: ReactNode;
  description?: ReactNode;
  ctaLabel: string;
  onCta?: MouseEventHandler<HTMLElement>;
  /** Hauteur totale (px). */
  height?: number;
  /** Flou appliqué au contenu sous le dégradé. */
  blur?: boolean;
  className?: string;
}

export function LockedOverlay({
  children,
  label = 'Contenu réservé',
  title,
  description,
  ctaLabel,
  onCta,
  height = 520,
  blur = true,
  className,
}: LockedOverlayProps) {
  return (
    <div className={cn('pl-dark relative w-full overflow-hidden', className)} style={{ height }}>
      <div aria-hidden inert className={cn('absolute inset-0', blur && '[mask-image:linear-gradient(#000_30%,transparent_85%)]')}>
        {children}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgb(8_9_11/0.55)_35%,#08090B_72%)]" />
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 px-5 pb-10 text-center"
      >
        <motion.div variants={fadeUp}>
          <PillBadge variant="dark" icon={<Lock />}>
            {label}
          </PillBadge>
        </motion.div>
        <motion.h3 variants={fadeUp} className="pl-display max-w-lg text-[32px] text-white sm:text-5xl">
          {title}
        </motion.h3>
        {description && (
          <motion.p variants={fadeUp} className="max-w-md text-[15px] text-white/55">
            {description}
          </motion.p>
        )}
        <motion.div variants={fadeUp} className="pt-2">
          <GlowButton size="lg" onClick={onCta} iconRight={<ArrowUpRight />}>
            {ctaLabel}
          </GlowButton>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default LockedOverlay;
