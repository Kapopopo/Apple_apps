/**
 * StatusDot : point de statut avec anneau qui pulse (ring-pulse), libellé optionnel.
 * Tons : success (vert, défaut), accent, warning, danger. `pulse={false}` pour un point fixe.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface StatusDotProps {
  tone?: 'success' | 'accent' | 'warning' | 'danger';
  pulse?: boolean;
  size?: 'sm' | 'md';
  label?: ReactNode;
  className?: string;
}

const TONES = {
  success: { dot: 'bg-pl-success-dot', ring: 'bg-pl-success-dot/40' },
  accent: { dot: 'bg-pl-accent', ring: 'bg-pl-accent/40' },
  warning: { dot: 'bg-[#F59E0B]', ring: 'bg-[#F59E0B]/40' },
  danger: { dot: 'bg-[#EF4444]', ring: 'bg-[#EF4444]/40' },
};

export function StatusDot({ tone = 'success', pulse = true, size = 'md', label, className }: StatusDotProps) {
  const t = TONES[tone];
  const dim = size === 'sm' ? 'size-1.5' : 'size-2';
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('relative inline-flex', dim)}>
        {pulse && <span aria-hidden className={cn('absolute inset-0 animate-pl-ripple rounded-full', t.ring)} />}
        <span className={cn('relative inline-flex rounded-full shadow-[0_0_8px_currentColor]', dim, t.dot)} />
      </span>
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}

export default StatusDot;
