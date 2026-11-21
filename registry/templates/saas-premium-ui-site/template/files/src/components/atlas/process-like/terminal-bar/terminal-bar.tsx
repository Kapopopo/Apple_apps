/**
 * TerminalBar : barre noire aux coins arrondis (12 px) avec « $ » gris, commande mono qui se tape puis s'efface (rotation entre plusieurs
 * commandes), curseur clignotant, bouton bleu à droite. Clic sur la commande : copie dans le presse-papiers
 * avec coche dessinée. Sous prefers-reduced-motion : première commande affichée telle quelle.
 */
import { useEffect, useState, type MouseEventHandler } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AccentButton } from '@/components/atlas/process-like/accent-button/accent-button';

export interface TerminalBarProps {
  commands: string[];
  prompt?: string;
  ctaLabel?: string;
  onCta?: MouseEventHandler<HTMLElement>;
  ctaHref?: string;
  /** Vitesse de frappe (ms par caractère). */
  typingSpeed?: number;
  /** Pause avant d'effacer (ms). */
  hold?: number;
  copyable?: boolean;
  className?: string;
}

export function TerminalBar({
  commands,
  prompt = '$',
  ctaLabel = 'Installer',
  onCta,
  ctaHref,
  typingSpeed = 45,
  hold = 2200,
  copyable = true,
  className,
}: TerminalBarProps) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(reduced ? (commands[0]?.length ?? 0) : 0);
  const [deleting, setDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = commands[index] ?? '';

  useEffect(() => {
    if (reduced) return;
    let delay = deleting ? 18 : typingSpeed;
    if (!deleting && length === current.length) delay = hold;
    const timer = setTimeout(() => {
      if (!deleting && length === current.length) setDeleting(commands.length > 1);
      else if (deleting && length === 0) {
        setDeleting(false);
        setIndex((i) => (i + 1) % commands.length);
      } else setLength((l) => l + (deleting ? -1 : 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [length, deleting, current, commands.length, typingSpeed, hold, reduced]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(current);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* presse-papiers indisponible (iframe sandboxée) */
    }
  };

  return (
    <div
      className={cn(
        'flex h-[58px] w-full max-w-[420px] items-center gap-2 rounded-[12px] bg-pl-ink p-[6px] pl-5',
        'shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_18px_40px_-14px_rgb(0_0_0/0.35),0_2px_6px_rgb(0_0_0/0.12)]',
        className,
      )}
    >
      <button
        type="button"
        onClick={copyable ? copy : undefined}
        aria-label={copyable ? `Copier : ${current}` : undefined}
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left font-pl-mono text-[13px] outline-none sm:text-sm"
      >
        <span className="text-white/35 select-none">{prompt}</span>
        <span className="truncate text-white/90">{current.slice(0, length)}</span>
        <span aria-hidden className="-ml-1.5 h-4 w-[7px] shrink-0 animate-pl-caret rounded-[1px] bg-pl-accent-sky/80" />
        {copyable && (
          <span className="ml-auto hidden shrink-0 text-white/40 sm:block">
            {copied ? (
              <motion.svg viewBox="0 0 24 24" className="size-4 text-pl-success-dot" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35 }}
                />
              </motion.svg>
            ) : (
              <Copy className="size-4" />
            )}
          </span>
        )}
      </button>
      <AccentButton tone="deep" size="md" onClick={onCta} href={ctaHref} className="h-[44px] rounded-[9px] px-4 font-bold sm:px-4">
        {ctaLabel}
      </AccentButton>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Commande copiée' : ''}
      </span>
    </div>
  );
}

/** Icône de coche, exportée pour les autres retours de copie. */
export const CopiedIcon = Check;

export default TerminalBar;
