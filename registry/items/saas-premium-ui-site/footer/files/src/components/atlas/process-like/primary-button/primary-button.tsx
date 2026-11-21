/**
 * PrimaryButton : pill noir plein, ombre douce, flèche ↗ optionnelle ; press scale(.97) puis retour spring-md.
 * Variantes : solid (noir), white (blanc, pour fonds sombres ou carte bleue), outline (bordure fine).
 * Rendu en <a> si `href` est fourni. Slot `addon` : pastille intégrée à droite (ex. « -20 % »).
 */
import type { MouseEventHandler, ReactNode } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { press } from '@/components/atlas/process-like/lib/motion';

export interface PrimaryButtonProps {
  children: ReactNode;
  variant?: 'solid' | 'white' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  /** Flèche ↗ à droite (défaut : oui). */
  arrow?: boolean;
  icon?: ReactNode;
  addon?: ReactNode;
  href?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  type?: 'button' | 'submit';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const SIZES = {
  sm: 'h-8 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-[52px] px-6 text-[17px] font-semibold gap-2',
};

const VARIANTS = {
  solid:
    'bg-[linear-gradient(180deg,#2a2a2f,#0b0b0f)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_24px_-10px_rgb(0_0_0/0.55)] hover:brightness-125',
  white: 'bg-white text-pl-ink shadow-[0_1px_0_rgb(255_255_255),0_10px_24px_-12px_rgb(0_0_0/0.4)] hover:bg-white/90',
  outline: 'bg-pl-card text-pl-fg border border-pl-border hover:bg-pl-card-2',
};

export function PrimaryButton({
  children,
  variant = 'solid',
  size = 'md',
  arrow = true,
  icon,
  addon,
  href,
  onClick,
  type = 'button',
  disabled,
  fullWidth,
  className,
}: PrimaryButtonProps) {
  const classes = cn(
    'group inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-[-0.01em] whitespace-nowrap select-none',
    'transition-colors duration-200 outline-none focus-visible:shadow-pl-ring disabled:pointer-events-none disabled:opacity-50',
    SIZES[size],
    VARIANTS[variant],
    fullWidth && 'w-full',
    className,
  );
  const content = (
    <>
      {icon && <span className="grid place-items-center [&>svg]:size-4">{icon}</span>}
      <span>{children}</span>
      {addon}
      {arrow && (
        <ArrowUpRight
          aria-hidden
          className="size-4 transition-transform duration-300 ease-pl-spring-sm group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      )}
    </>
  );
  if (href)
    return (
      <motion.a href={href} onClick={onClick} className={classes} {...press}>
        {content}
      </motion.a>
    );
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} className={classes} {...press}>
      {content}
    </motion.button>
  );
}

export default PrimaryButton;
