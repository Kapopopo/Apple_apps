/**
 * GlowButton : pill noir dont la bordure en dégradé conique tourne (custom property --pl-angle animée
 * via @property, 4 s linéaire), avec halo bleu diffus. Le CTA « premium » des blocs sombres.
 * Sous prefers-reduced-motion, la bordure reste fixe.
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { press } from '@/components/atlas/process-like/lib/motion';

export interface GlowButtonProps {
  children: ReactNode;
  size?: 'md' | 'lg';
  icon?: ReactNode;
  iconRight?: ReactNode;
  /** Halo bleu sous le bouton (défaut : oui). */
  halo?: boolean;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
}

/** Dégradé conique de la bordure tournante (réutilisé par le CTA du header). */
export const RING =
  'conic-gradient(from var(--pl-angle), transparent 0deg, #8EC5FF 50deg, #2F5BFF 110deg, transparent 170deg, transparent 220deg, rgb(255 255 255 / 0.55) 280deg, transparent 340deg)';

export function GlowButton({ children, size = 'md', icon, iconRight, halo = true, href, onClick, className }: GlowButtonProps) {
  const Tag = href ? motion.a : motion.button;
  return (
    <Tag
      {...(href ? { href } : { type: 'button' as const })}
      onClick={onClick}
      className={cn(
        'group relative isolate inline-flex shrink-0 rounded-pl-pill p-px outline-none select-none focus-visible:shadow-pl-ring',
        className,
      )}
      {...press}
    >
      {halo && (
        <span
          aria-hidden
          className="absolute inset-x-2 -bottom-2 top-3 -z-10 rounded-pl-pill bg-[#2f7bff]/45 opacity-70 blur-xl transition-opacity duration-300 group-hover:opacity-100"
        />
      )}
      <span
        aria-hidden
        className="absolute inset-0 animate-pl-spin-border rounded-pl-pill bg-[#16233f]"
        style={{ backgroundImage: RING }}
      />
      <span
        className={cn(
          'relative inline-flex items-center gap-2 rounded-pl-pill bg-black font-semibold tracking-[-0.02em] text-white uppercase',
          'shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]',
          size === 'lg' ? 'h-[52px] pr-6 pl-7 text-[15px]' : 'h-12 pr-[22px] pl-6 text-[15px]',
        )}
      >
        {icon && <span className="grid place-items-center [&>svg]:size-4">{icon}</span>}
        {children}
        {iconRight && <span className="grid place-items-center [&>svg]:size-4">{iconRight}</span>}
      </span>
    </Tag>
  );
}

export default GlowButton;
