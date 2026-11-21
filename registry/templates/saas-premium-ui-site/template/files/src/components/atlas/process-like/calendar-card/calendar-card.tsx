/**
 * CalendarCard : carte calendrier blanche (en-tête marque + mois + pastille compte, grille L→D à cases arrondies),
 * certaines cases portent une vignette planifiée (placeholder ou contenu via `renderSlot`), une case peut être
 * mise en avant (bordure bleue, heure). Sert de visuel de planification (onglet automatisation, étape 3).
 * Props : title, month, account, weeks, slots (index de case → libellé d'heure), highlight (index), renderSlot, compact.
 */
import type { ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CalendarCardProps {
  title?: string;
  month?: string;
  account?: string;
  weeks?: number;
  /** Cases planifiées : index (0 = lundi de la 1re semaine) → heure affichée. */
  slots?: Record<number, string>;
  highlight?: number;
  startDay?: number;
  renderSlot?: (index: number) => ReactNode;
  compact?: boolean;
  /** Les cases s'étirent pour remplir toute la hauteur de la carte (carte en `h-full` dans une grille, par ex.). */
  fill?: boolean;
  /** Le contenu d'une case planifiée couvre toute la case (date en blanc par-dessus) au lieu de la zone sous la date. */
  coverSlots?: boolean;
  /** Nombre de jours du mois précédent : avec un `startDay` ≤ 0, les premières cases affichent ses derniers jours (grisés). */
  prevMonthDays?: number;
  className?: string;
}

const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const SWATCH = ['#e9d9c9', '#d4dcef', '#e3d6ea', '#d7e6dc', '#f0e2c4', '#dcdde3'];

function SlotPlaceholder({ index }: { index: number }) {
  return (
    <span
      className="absolute inset-1 overflow-hidden rounded-[6px]"
      style={{ background: `linear-gradient(160deg, ${SWATCH[index % SWATCH.length]}, #9aa0ae)` }}
    >
      <span className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-white/80" />
    </span>
  );
}

export function CalendarCard({
  title = 'Planning',
  month = 'Novembre',
  account = '@monapp',
  weeks = 3,
  slots = { 3: '21:00', 9: '18:00', 11: '12:30', 16: '19:00' },
  highlight = 3,
  startDay = 9,
  renderSlot,
  compact = false,
  fill = false,
  coverSlots = false,
  prevMonthDays = 31,
  className,
}: CalendarCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-[18px] bg-white p-3 text-pl-ink shadow-[0_0_0_1px_rgb(0_0_0/0.04),0_20px_50px_-20px_rgb(20_24_40/0.35)] sm:p-4',
        fill && 'flex flex-col',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-5 place-items-center rounded-[6px] bg-pl-ink text-white">
          <CalendarDays className="size-3" aria-hidden />
        </span>
        <span className="text-[13px] font-semibold">{title}</span>
        <span className="text-[12px] text-pl-fg-3">{month}</span>
        {!compact && (
          <span className="ml-auto flex items-center gap-1.5 rounded-pl-pill bg-pl-accent-soft px-2 py-0.5 text-[11px] font-medium text-pl-accent">
            <span className="size-3 rounded-full bg-pl-accent" />
            {account}
          </span>
        )}
      </div>
      <div
        className={cn('grid grid-cols-7 gap-1 text-center text-[10px] text-pl-fg-3 sm:gap-1.5', fill && 'flex-1')}
        style={fill ? { gridTemplateRows: `auto repeat(${weeks}, minmax(0, 1fr))` } : undefined}
      >
        {DAYS.map((d, i) => (
          <span key={i} className="pb-1 font-medium">
            {d}
          </span>
        ))}
        {Array.from({ length: weeks * 7 }, (_, i) => {
          const slot = slots[i];
          const hot = i === highlight;
          const n = startDay + i;
          const outside = n < 1;
          return (
            <span
              key={i}
              className={cn(
                'relative rounded-[8px] border text-left',
                // Sous lg la carte n'est pas étirée : hauteur mini pour garder des cases à peu près 9:16.
                fill ? 'min-h-[88px] lg:min-h-0' : 'aspect-[3/4]',
                hot ? 'border-pl-accent shadow-[0_0_0_3px_rgb(47_91_255/0.15)]' : 'border-pl-border bg-pl-bg/60',
                outside && 'opacity-45',
              )}
            >
              <span
                className={cn(
                  'absolute top-1 left-1.5 z-10 text-[9px]',
                  coverSlots && slot
                    ? 'font-semibold text-white [text-shadow:0_1px_2px_rgb(0_0_0/0.7)]'
                    : hot
                      ? 'font-semibold text-pl-accent'
                      : 'text-pl-fg-3',
                )}
              >
                {outside ? prevMonthDays + n : n}
              </span>
              {slot !== undefined && (
                <>
                  <span className={cn('absolute', coverSlots ? 'inset-0 overflow-hidden rounded-[7px]' : 'inset-x-0 top-4 bottom-0')}>
                    {renderSlot ? renderSlot(i) : <SlotPlaceholder index={i} />}
                  </span>
                  {hot && (
                    <span
                      className={cn(
                        'absolute inset-x-0.5 bottom-0.5 overflow-hidden rounded-[4px] bg-pl-accent py-0.5 text-center font-pl-mono leading-none font-semibold tracking-[-0.06em] whitespace-nowrap text-white',
                        compact ? 'text-[7px]' : 'text-[8px]',
                      )}
                    >
                      {slot}
                    </span>
                  )}
                </>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarCard;
