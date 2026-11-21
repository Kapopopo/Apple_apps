/**
 * SectionHeading : en-tête de section du thème — badge pill au-dessus, H2 en deux tons (ligne 1 encre,
 * ligne 2 gris) sur fond clair, ou H2 blanc en majuscules serrées avec icône inline (taille cap-height, petit glow)
 * dans un bloc sombre. Entrée fade-up en cascade au scroll.
 * Props : badge, title, subtitle (2e ligne grise), icon (inline, ton dark), iconAt (index du mot avant lequel
 * placer l'icône), description, tone (light, dark), align (center, left), as (h1, h2).
 */
import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { fadeUp, inView, popBlur, stagger } from '@/components/atlas/process-like/lib/motion';
import { PillBadge } from '@/components/atlas/process-like/pill-badge/pill-badge';

export interface SectionHeadingProps {
  badge?: ReactNode;
  badgeIcon?: ReactNode;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  iconAt?: number;
  description?: ReactNode;
  tone?: 'light' | 'dark';
  /** Ton de la pastille (défaut : celui du titre) ; dark pour un titre deux tons posé sur fond noir. */
  badgeTone?: 'light' | 'dark';
  align?: 'center' | 'left';
  as?: 'h1' | 'h2';
  className?: string;
}

/** Icône inline dans un titre : pastille à la hauteur des capitales, légère lueur bleue. */
export function InlineIcon({ children }: { children: ReactNode }) {
  return (
    <motion.span
      variants={popBlur}
      className="mx-[0.12em] inline-grid size-[0.78em] translate-y-[0.04em] place-items-center rounded-[0.22em] bg-[linear-gradient(180deg,#4a72ff,#1e2bf0)] align-baseline text-white shadow-[0_0_24px_rgb(47_91_255/0.6),inset_0_1px_0_rgb(255_255_255/0.3)] [&>svg]:size-[0.5em]"
    >
      {children}
    </motion.span>
  );
}

export function SectionHeading({
  badge,
  badgeIcon,
  title,
  subtitle,
  icon,
  iconAt,
  description,
  tone = 'light',
  badgeTone,
  align = 'center',
  as: Tag = 'h2',
  className,
}: SectionHeadingProps) {
  const dark = tone === 'dark';
  const words = title.split(' ');
  const at = iconAt ?? Math.ceil(words.length / 2);
  return (
    <motion.div
      variants={stagger(0.06)}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className={cn('flex flex-col gap-5', align === 'center' ? 'items-center text-center' : 'items-start text-left', className)}
    >
      {badge && (
        <motion.div variants={fadeUp}>
          <PillBadge variant={(badgeTone ?? tone) === 'dark' ? 'dark' : 'neutral'} icon={badgeIcon}>
            {badge}
          </PillBadge>
        </motion.div>
      )}
      <motion.div variants={fadeUp}>
        <Tag
          className={cn(
            dark
              ? 'pl-h2-dark text-[26px] text-[#F6F7FB] sm:text-[38px] lg:text-[46px]'
              : 'pl-h2 text-[30px] text-pl-fg sm:text-[44px] lg:text-[56px]',
            align === 'center' && 'mx-auto max-w-3xl',
          )}
        >
          {dark && icon ? (
            <>
              {words.slice(0, at).join(' ')} <InlineIcon>{icon}</InlineIcon> {words.slice(at).join(' ')}
            </>
          ) : (
            title
          )}
          {subtitle && (
            <>
              <br />
              <span className="text-pl-fg-sub">{subtitle}</span>
            </>
          )}
        </Tag>
      </motion.div>
      {description && (
        <motion.p variants={fadeUp} className={cn('pl-lead max-w-xl', dark ? 'text-white/60' : 'text-pl-fg-2')}>
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}

export default SectionHeading;
