/**
 * ReviewCard : carte d'avis blanche. Média en haut : `image` (capture en placeholder gris) ou `chat`
 * (bulle de message sombre), puis 5 étoiles vertes, citation, nom et meta (initiales en avatar).
 * Props : variant, rating (0–5), quote, author, meta, messages (variante chat), image (ReactNode).
 */
import type { ReactNode } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ReviewCardProps {
  variant?: 'image' | 'chat' | 'text';
  rating?: number;
  quote: string;
  author: string;
  meta?: string;
  /** Variante chat : messages de la bulle (le dernier est mis en avant). */
  messages?: string[];
  /** Variante image : visuel à la place du placeholder. */
  image?: ReactNode;
  className?: string;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export function Stars({ rating = 5 }: { rating?: number }) {
  return (
    <span className="flex gap-0.5" role="img" aria-label={`${rating} sur 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={cn('grid size-5 place-items-center rounded-[4px]', i < rating ? 'bg-[#12B76A]' : 'bg-pl-bg-soft-2')}>
          <Star className="size-3 fill-white text-white" />
        </span>
      ))}
    </span>
  );
}

/**
 * Capture d'exemple pour la variante image : tableau de bord de résultats (titre, chiffre clé + évolution,
 * histogramme sur 7 jours, deux tuiles de stats). Valeurs dérivées de `seed` pour varier d'une carte à l'autre.
 */
function StatsShot({ seed }: { seed: number }) {
  const sets = [
    { title: 'Vues cette semaine', value: '48,2 k', delta: '+212 %', a: ['Abonnés', '+1 240'], b: ['Posts', '14'] },
    { title: 'Téléchargements', value: '3 870', delta: '+64 %', a: ['Note', '4,8 ★'], b: ['Conversion', '7,2 %'] },
    { title: 'Revenus du mois', value: '2 940 €', delta: '+38 %', a: ['Essais', '312'], b: ['Clients', '+86'] },
  ];
  const s = sets[seed % sets.length];
  const bars = Array.from({ length: 7 }, (_, i) => 28 + ((i * 17 + seed * 11) % 36) + i * 6);
  return (
    <div className="absolute inset-0 flex flex-col gap-2.5 p-4 text-white">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-white/55">{s.title}</span>
        <span className="flex gap-1">
          <span className="size-1.5 rounded-full bg-white/25" />
          <span className="size-1.5 rounded-full bg-white/25" />
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[24px] leading-none font-bold tracking-[-0.03em] tabular-nums">{s.value}</span>
        <span className="rounded-full bg-[#12B76A]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#4ade80]">{s.delta}</span>
      </div>
      <div className="flex flex-1 items-end gap-1.5">
        {bars.map((h, i) => (
          <span
            key={i}
            className={cn('flex-1 rounded-t-[4px]', i === bars.length - 1 ? 'bg-pl-accent' : 'bg-white/15')}
            style={{ height: `${Math.min(h, 100)}%` }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[s.a, s.b].map(([k, v]) => (
          <span key={k} className="rounded-[10px] bg-white/[0.07] px-2.5 py-1.5">
            <span className="block text-[9px] text-white/45">{k}</span>
            <span className="block text-[13px] font-semibold tabular-nums">{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReviewCard({ variant = 'image', rating = 5, quote, author, meta, messages, image, className }: ReviewCardProps) {
  return (
    <article
      className={cn(
        'flex h-full w-[84vw] max-w-[400px] shrink-0 flex-col gap-5 rounded-pl-lg bg-pl-card p-4 shadow-[0_0_0_1px_rgb(0_0_0/0.03),0_12px_40px_-20px_rgb(0_0_0/0.2)] sm:p-6',
        className,
      )}
    >
      {variant === 'image' && (
        <div className="pl-placeholder-dark relative aspect-[16/10] overflow-hidden rounded-[16px]">
          {image ?? <StatsShot seed={author.length} />}
        </div>
      )}
      {variant === 'chat' && (
        <div className="flex aspect-[16/10] flex-col justify-end gap-2 rounded-[16px] bg-pl-ink-dark p-4">
          {(messages ?? ['Bonjour, une question rapide…', 'Tout fonctionne parfaitement, merci !']).map((m, i, all) => (
            <p
              key={i}
              className={cn(
                'max-w-[85%] rounded-[18px] px-3.5 py-2 text-[13px] leading-snug',
                i === all.length - 1
                  ? 'self-end rounded-br-md bg-pl-accent text-white'
                  : 'self-start rounded-bl-md bg-white/10 text-white/80',
              )}
            >
              {m}
            </p>
          ))}
        </div>
      )}
      <div className="flex flex-1 flex-col gap-3 px-2 pb-2">
        <Stars rating={rating} />
        {/* Toujours 3 lignes réservées (et pas plus) : toutes les cartes ont la même hauteur, quel que soit l'avis. */}
        <blockquote className="line-clamp-3 min-h-[calc(3*1.45em)] flex-1 text-[17px] leading-[1.45] font-medium tracking-[-0.01em] text-pl-fg sm:text-[19px]">
          « {quote} »
        </blockquote>
        <footer className="flex items-center gap-3 pt-1">
          <span className="grid size-9 place-items-center rounded-full bg-pl-card-2 text-xs font-semibold text-pl-fg-2">
            {initials(author)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-pl-fg">{author}</span>
            {meta && <span className="block truncate text-xs text-pl-fg-3">{meta}</span>}
          </span>
        </footer>
      </div>
    </article>
  );
}

export default ReviewCard;
