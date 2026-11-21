/**
 * SegmentedTabs : onglets (icône + libellé) avec indicateur qui glisse (450 ms ease-ios).
 * Variantes :
 *  - `pill` : piste arrondie, onglet actif en pastille bleue (contrôles compacts : mensuel / annuel…) ;
 *  - `ios` : contrôle segmenté clair façon iOS (piste #E9EAF0 à ombres internes, segment actif blanc), lisible sur fond noir ;
 *  - `bar` : barre pleine largeur de cellules égales séparées par des filets, posée sur le bord haut d'un bloc
 *    sombre ; onglet actif sur fond bleu très pâle, texte bleu, trait bleu en dégradé qui glisse en bas.
 * Contrôlé (`value` + `onChange`) ou non (`defaultValue`). `onChange` reçoit la direction (1 / -1)
 * pour animer le contenu en swipe-in (voir `swipeIn` de lib/motion). Tons light / dark (variante pill).
 * Navigation clavier ← →.
 */
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { slide } from '@/components/atlas/process-like/lib/motion';

export interface SegmentedTab {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedTabsProps {
  tabs: SegmentedTab[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string, direction: 1 | -1) => void;
  variant?: 'pill' | 'bar' | 'ios';
  tone?: 'light' | 'dark';
  size?: 'sm' | 'md';
  /** Libellés masqués sous 640 px (icône seule) quand il y a beaucoup d'onglets. */
  compactOnMobile?: boolean;
  fullWidth?: boolean;
  /** Préfixe d'id des panneaux (aria-controls) : `${panelId}-${tab.id}`. */
  panelId?: string;
  /**
   * Variante `bar` : temps d'affichage de l'onglet actif (ms). Le trait bleu se remplit pendant ce temps,
   * puis `onProgressEnd` est appelé (passer à l'onglet suivant). Sans effet sous prefers-reduced-motion.
   */
  progress?: number;
  progressPaused?: boolean;
  onProgressEnd?: () => void;
  className?: string;
}

export function SegmentedTabs({
  tabs,
  value,
  defaultValue,
  onChange,
  variant = 'pill',
  tone = 'light',
  size = 'md',
  compactOnMobile = false,
  fullWidth = true,
  panelId,
  progress,
  progressPaused = false,
  onProgressEnd,
  className,
}: SegmentedTabsProps) {
  const [inner, setInner] = useState(defaultValue ?? tabs[0]?.id);
  const active = value ?? inner;
  const layoutId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (id: string) => {
    if (id === active) return;
    const from = tabs.findIndex((t) => t.id === active);
    const to = tabs.findIndex((t) => t.id === id);
    if (value === undefined) setInner(id);
    onChange?.(id, to > from ? 1 : -1);
  };

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + tabs.length) % tabs.length;
    refs.current[next]?.focus();
    select(tabs[next].id);
  };

  const buttons = tabs.map((tab, i) => {
    const selected = tab.id === active;
    return (
      <button
        key={tab.id}
        ref={(el) => {
          refs.current[i] = el;
        }}
        role="tab"
        type="button"
        aria-selected={selected}
        aria-controls={panelId ? `${panelId}-${tab.id}` : undefined}
        tabIndex={selected ? 0 : -1}
        onClick={() => select(tab.id)}
        onKeyDown={(e) => onKey(e, i)}
        className={cn(
          'relative flex items-center justify-center gap-2 whitespace-nowrap outline-none',
          'transition-colors duration-200 focus-visible:shadow-pl-ring',
          variant === 'bar' &&
            cn(
              'h-[54px] min-w-0 flex-1 gap-1.5 px-1 text-[15px] font-medium sm:h-[72px] sm:gap-2 sm:px-2 sm:text-[17px]',
              selected ? 'text-pl-accent' : 'text-pl-fg-2 hover:text-pl-fg',
            ),
          variant === 'ios' &&
            cn(
              'h-[35px] min-w-0 flex-1 gap-1.5 rounded-[11px] px-1.5 text-[14px]',
              selected ? 'font-semibold text-[#111]' : 'text-[#666] hover:text-[#111]',
            ),
          variant === 'pill' &&
            cn(
              'rounded-pl-pill font-medium',
              size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-2 text-sm sm:px-3.5',
              fullWidth && 'min-w-0 flex-1',
              selected ? 'text-white' : tone === 'dark' ? 'text-white/55 hover:text-white/85' : 'text-pl-fg-2 hover:text-pl-fg',
            ),
        )}
      >
        {selected && variant === 'bar' && (
          <motion.span layoutId={layoutId} transition={slide} className="absolute inset-0">
            <span className="absolute inset-0 bg-[linear-gradient(180deg,#eef1ff,#dfe6ff)]" />
            {progress ? (
              <>
                {/* Piste pâle, puis trait qui se remplit (remonté à chaque onglet : la durée repart de zéro). */}
                <span className="absolute inset-x-0 bottom-0 h-[3px] bg-pl-accent/15" />
                <span
                  data-pl-loop
                  onAnimationEnd={(e) => e.animationName === 'pl-progress' && onProgressEnd?.()}
                  className="absolute inset-x-0 bottom-0 h-[3px] origin-left bg-[linear-gradient(90deg,#8EC5FF,var(--pl-accent),#8EC5FF)] shadow-[0_-4px_14px_rgb(47_91_255/0.45)]"
                  style={{ animation: `pl-progress ${progress}ms linear both`, animationPlayState: progressPaused ? 'paused' : 'running' }}
                />
              </>
            ) : (
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[linear-gradient(90deg,#8EC5FF,var(--pl-accent),#8EC5FF)] shadow-[0_-4px_14px_rgb(47_91_255/0.45)]" />
            )}
          </motion.span>
        )}
        {selected && variant === 'ios' && (
          <motion.span
            layoutId={layoutId}
            transition={slide}
            className="absolute inset-0 rounded-[11px] bg-white shadow-[0_1px_1px_rgb(23_26_38/0.06),0_2px_5px_rgb(23_26_38/0.08)]"
          />
        )}
        {selected && variant === 'pill' && (
          <motion.span
            layoutId={layoutId}
            transition={slide}
            className="absolute inset-0 rounded-pl-pill bg-[linear-gradient(180deg,#4a72ff,var(--pl-accent)_60%,#2448e6)] shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_16px_-6px_rgb(47_91_255/0.6)]"
          />
        )}
        {tab.icon && (
          <span className={cn('relative grid place-items-center', variant === 'bar' ? '[&>svg]:size-[18px]' : '[&>svg]:size-4')}>
            {tab.icon}
          </span>
        )}
        <span className={cn('relative truncate', compactOnMobile && tab.icon && 'max-sm:sr-only')}>{tab.label}</span>
      </button>
    );
  });

  if (variant === 'bar')
    return (
      <div className={cn('w-full border-y border-pl-border bg-pl-page', className)}>
        <div
          role="tablist"
          className="relative mx-auto grid max-w-[1320px] grid-cols-2 border-pl-border max-sm:[&>button]:border-pl-border max-sm:[&>button:nth-child(-n+2)]:border-b max-sm:[&>button:nth-child(odd)]:border-r sm:flex sm:border-x sm:[&>button+button]:border-l sm:[&>button+button]:border-pl-border"
        >
          {buttons}
        </div>
      </div>
    );

  return (
    <div
      role="tablist"
      className={cn(
        'relative flex',
        variant === 'ios'
          ? 'w-full max-w-[620px] rounded-[14px] bg-[#e9eaf0] p-1 shadow-[inset_0_2px_5px_rgb(20_20_50/0.16),inset_0_-1px_0_rgb(255_255_255/0.8)]'
          : cn(
              'gap-1 rounded-pl-pill p-1',
              tone === 'dark' ? 'pl-raised' : 'border border-pl-border bg-pl-card shadow-pl-xs',
              fullWidth ? 'w-full' : 'w-fit',
            ),
        className,
      )}
    >
      {buttons}
    </div>
  );
}

export default SegmentedTabs;
