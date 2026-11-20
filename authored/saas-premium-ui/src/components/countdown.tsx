/**
 * Countdown : compte à rebours en cases mono arrondies à bordure fine (jours, heures, minutes, secondes).
 * `target` : date de fin, ou `seconds` : durée depuis le montage. Tons light / dark. Chaque chiffre qui change
 * glisse verticalement (désactivé sous prefers-reduced-motion par MotionConfig / useReducedMotion).
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/motion';

export type CountdownUnit = 'd' | 'h' | 'm' | 's';

export interface CountdownProps {
  target?: Date | string | number;
  seconds?: number;
  units?: CountdownUnit[];
  labels?: Partial<Record<CountdownUnit, string>>;
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
  onComplete?: () => void;
  className?: string;
}

const DEFAULT_LABELS: Record<CountdownUnit, string> = { d: 'jours', h: 'heures', m: 'min', s: 'sec' };
const UNIT_SECONDS: Record<CountdownUnit, number> = { d: 86400, h: 3600, m: 60, s: 1 };

function split(total: number, units: CountdownUnit[]) {
  let rest = Math.max(0, Math.floor(total));
  return units.map((u) => {
    const v = Math.floor(rest / UNIT_SECONDS[u]);
    rest -= v * UNIT_SECONDS[u];
    return [u, v] as const;
  });
}

function Digit({ value, reduced }: { value: string; reduced: boolean | null }) {
  return (
    <span className="relative inline-block h-[1em] w-[0.62em] overflow-hidden">
      <AnimatePresence initial={false}>
        <motion.span
          key={value}
          initial={reduced ? false : { y: '-100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={reduced ? undefined : { y: '100%', opacity: 0 }}
          transition={{ duration: 0.4, ease: ease.outExpo }}
          className="absolute inset-0 text-center leading-none"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function Countdown({
  target,
  seconds,
  units = ['d', 'h', 'm', 's'],
  labels,
  tone = 'light',
  size = 'md',
  onComplete,
  className,
}: CountdownProps) {
  const reduced = useReducedMotion();
  const [end] = useState(() => (target !== undefined ? new Date(target).getTime() : Date.now() + (seconds ?? 3600) * 1000));
  const [left, setLeft] = useState(() => (end - Date.now()) / 1000);

  useEffect(() => {
    const id = setInterval(() => {
      const next = (end - Date.now()) / 1000;
      setLeft(next);
      if (next <= 0) {
        clearInterval(id);
        onComplete?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, [end, onComplete]);

  const parts = split(left, units);
  const names = { ...DEFAULT_LABELS, ...labels };

  return (
    <div className={cn('flex items-start gap-2', className)} role="timer" aria-label={parts.map(([u, v]) => `${v} ${names[u]}`).join(', ')}>
      {parts.map(([u, v], i) => (
        <div key={u} className="flex items-start gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={cn(
                'flex items-center justify-center rounded-pl-sm border font-pl-mono font-medium tabular-nums',
                size === 'sm' ? 'h-10 w-11 text-lg' : 'h-14 w-15 text-[26px]',
                tone === 'dark'
                  ? 'border-white/10 bg-white/[0.04] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]'
                  : 'border-pl-border bg-pl-card text-pl-fg shadow-pl-xs',
              )}
              aria-hidden
            >
              {String(v)
                .padStart(2, '0')
                .split('')
                .map((d, k) => (
                  <Digit key={k} value={d} reduced={reduced} />
                ))}
            </div>
            <span
              className={cn('font-pl-mono text-[10px] tracking-[0.08em] uppercase', tone === 'dark' ? 'text-white/40' : 'text-pl-fg-3')}
            >
              {names[u]}
            </span>
          </div>
          {i < parts.length - 1 && (
            <span
              aria-hidden
              className={cn(
                'font-pl-mono',
                size === 'sm' ? 'pt-2 text-lg' : 'pt-3 text-2xl',
                tone === 'dark' ? 'text-white/25' : 'text-pl-fg-3',
              )}
            >
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default Countdown;
