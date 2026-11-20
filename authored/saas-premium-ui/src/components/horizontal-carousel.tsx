/**
 * HorizontalCarousel : défilement horizontal à scroll-snap dont les cartes débordent du bord de l'écran
 * (marge négative `bleed` + padding équivalent : la première carte reste alignée sur la grille).
 * Flèches précédent / suivant à partir de 640 px (`controls`), barre de défilement masquée, bord estompé.
 * Les enfants doivent avoir une largeur fixe (ex. w-[82vw] max-w-[340px]).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface HorizontalCarouselProps {
  children: ReactNode;
  /** Débordement en px de chaque côté (marge de page). */
  bleed?: number;
  /** Carrousel bord à bord : marge intérieure CSS (ex. alignement sur la grille de la page) au lieu de `bleed`. */
  inset?: string;
  /** Alignement vertical des cartes (défaut : étirées). */
  align?: 'stretch' | 'start';
  gap?: number;
  controls?: boolean;
  tone?: 'light' | 'dark';
  label?: string;
  className?: string;
}

export function HorizontalCarousel({
  children,
  bleed = 20,
  inset,
  align = 'stretch',
  gap = 14,
  controls = true,
  tone = 'light',
  label = 'Carrousel',
  className,
}: HorizontalCarouselProps) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdges({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    measure();
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const first = el.querySelector<HTMLElement>(':scope > *');
    el.scrollBy({ left: dir * ((first?.offsetWidth ?? 300) + gap), behavior: 'smooth' });
  };

  const btn = cn(
    'grid size-10 place-items-center rounded-full border transition-[opacity,background-color] duration-200 disabled:opacity-30',
    tone === 'dark'
      ? 'border-white/10 bg-white/[0.06] text-white hover:bg-white/10'
      : 'border-pl-border bg-pl-card text-pl-fg shadow-pl-xs hover:bg-pl-card-2',
  );

  return (
    <div className={cn('relative', className)} role="region" aria-roledescription="carousel" aria-label={label}>
      <div
        ref={track}
        onScroll={measure}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{
          gap,
          alignItems: align === 'start' ? 'flex-start' : undefined,
          marginInline: inset ? 0 : -bleed,
          paddingInline: inset ?? bleed,
          scrollPaddingInline: inset ?? bleed,
        }}
      >
        {children}
        <span aria-hidden className="shrink-0" style={{ width: 1 }} />
      </div>
      {controls && (
        <div className="mt-5 hidden justify-end gap-2 sm:flex" style={inset ? { paddingInline: inset } : undefined}>
          <button type="button" aria-label="Précédent" className={btn} disabled={edges.start} onClick={() => go(-1)}>
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" aria-label="Suivant" className={btn} disabled={edges.end} onClick={() => go(1)}>
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Élément de carrousel : aimanté au début de la piste. */
export function CarouselItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('shrink-0 snap-start', className)}>{children}</div>;
}

export default HorizontalCarousel;
