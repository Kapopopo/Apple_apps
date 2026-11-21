/**
 * RollingNumber : chaque chiffre est une colonne 0–9 qui défile jusqu'à sa valeur (rouleau de compteur),
 * à l'apparition dans le viewport puis à chaque changement de `value`. Séparateurs et symboles restent fixes.
 * Props : value, format (Intl.NumberFormatOptions), locale, prefix, suffix, duration, stagger, className.
 * Sous prefers-reduced-motion (MotionConfig reducedMotion="user") : valeur posée sans défilement.
 */
import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';
import { ease } from '@/components/atlas/process-like/lib/motion';

export interface RollingNumberProps {
  value: number;
  format?: Intl.NumberFormatOptions;
  locale?: string;
  prefix?: string;
  suffix?: string;
  /** Durée du défilement d'une colonne (s). */
  duration?: number;
  /** Décalage entre colonnes (s). */
  stagger?: number;
  className?: string;
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function Column({
  digit,
  delay,
  duration,
  active,
  reduced,
}: {
  digit: number;
  delay: number;
  duration: number;
  active: boolean;
  reduced: boolean | null;
}) {
  return (
    <span className="relative inline-block h-[1em] overflow-hidden leading-none tabular-nums" style={{ width: '0.62em' }}>
      <motion.span
        className="absolute inset-x-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: `${-(active ? digit : 0) * 10}%` }}
        transition={reduced ? { duration: 0 } : { duration, delay, ease: ease.outExpo }}
      >
        {DIGITS.map((d) => (
          <span key={d} className="block h-[1em] text-center leading-none">
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function RollingNumber({
  value,
  format,
  locale = 'fr-FR',
  prefix,
  suffix,
  duration = 1.1,
  stagger = 0.07,
  className,
}: RollingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const text = new Intl.NumberFormat(locale, format).format(value);
  let col = 0;
  return (
    <span ref={ref} className={cn('inline-flex items-baseline', className)} aria-label={`${prefix ?? ''}${text}${suffix ?? ''}`}>
      <span aria-hidden className="inline-flex items-baseline">
        {prefix && <span className="whitespace-pre">{prefix}</span>}
        {text.split('').map((ch, i) =>
          /\d/.test(ch) ? (
            <Column key={i} digit={Number(ch)} delay={col++ * stagger} duration={duration} active={inView || !!reduced} reduced={reduced} />
          ) : (
            <span key={i} className="inline-block leading-none whitespace-pre">
              {ch}
            </span>
          ),
        )}
        {suffix && <span className="whitespace-pre">{suffix}</span>}
      </span>
    </span>
  );
}

export default RollingNumber;
