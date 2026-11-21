/**
 * AccentButton : pill bleu en dégradé vertical, liseré clair et halo bleu. Réservé au CTA à retenir.
 * Variante `deep` : bleu plus profond (bouton d'installation de la barre terminal).
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { press } from '@/components/atlas/process-like/lib/motion';

export interface AccentButtonProps {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'default' | 'deep';
  icon?: ReactNode;
  iconRight?: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-13 px-6 text-base gap-2',
};

export function AccentButton({
  children,
  size = 'md',
  tone = 'default',
  icon,
  iconRight,
  href,
  onClick,
  type = 'button',
  fullWidth,
  className,
}: AccentButtonProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none',
    'pl-accent-fill outline-none transition-[filter] duration-200 hover:brightness-110 focus-visible:shadow-pl-ring',
    tone === 'deep' && 'bg-[linear-gradient(180deg,#2a44ff,#1428e8)]',
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
  const content = (
    <>
      {icon && <span className="grid place-items-center [&>svg]:size-4">{icon}</span>}
      <span className="drop-shadow-[0_1px_0_rgb(0_0_0/0.15)]">{children}</span>
      {iconRight && <span className="grid place-items-center [&>svg]:size-4">{iconRight}</span>}
    </>
  );
  return href ? (
    <motion.a href={href} onClick={onClick} className={classes} {...press}>
      {content}
    </motion.a>
  ) : (
    <motion.button type={type} onClick={onClick} className={classes} {...press}>
      {content}
    </motion.button>
  );
}

export default AccentButton;
