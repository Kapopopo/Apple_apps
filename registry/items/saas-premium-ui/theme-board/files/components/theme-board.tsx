/**
 * ThemeBoard : planche de référence du thème Saas premium UI (couleurs, typographie, rayons, ombres, verre, courbes).
 * Outil de vérification : à garder hors des pages de production.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { cssEase, ease } from '@/lib/motion';

const SWATCHES: [string, string][] = [
  ['bg', 'bg-pl-bg'],
  ['bg-soft', 'bg-pl-bg-soft'],
  ['surface', 'bg-pl-surface'],
  ['ink', 'bg-pl-ink'],
  ['ink-dark', 'bg-pl-ink-dark'],
  ['muted', 'bg-pl-muted'],
  ['muted-2', 'bg-pl-muted-2'],
  ['line', 'bg-pl-line'],
  ['accent', 'bg-pl-accent'],
  ['accent-deep', 'bg-pl-accent-deep'],
  ['accent-soft', 'bg-pl-accent-soft'],
  ['accent-line', 'bg-pl-accent-line'],
  ['success', 'bg-pl-success'],
  ['warning', 'bg-pl-warning'],
  ['danger', 'bg-pl-danger'],
];

const RADII: [string, string][] = [
  ['xs', 'rounded-pl-xs'],
  ['sm', 'rounded-pl-sm'],
  ['md', 'rounded-pl-md'],
  ['lg', 'rounded-pl-lg'],
  ['xl', 'rounded-pl-xl'],
  ['pill', 'rounded-pl-pill'],
];

const CURVES = Object.entries(ease) as [keyof typeof ease, (typeof ease)[keyof typeof ease]][];

export interface ThemeBoardProps {
  className?: string;
}

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-3 font-pl-mono text-[11px] tracking-[0.08em] text-pl-fg-3 uppercase">{children}</p>;
}

export function ThemeBoard({ className }: ThemeBoardProps) {
  return (
    <div className={cn('pl-root w-full space-y-10 rounded-pl-xl bg-pl-page p-5 sm:p-8', className)}>
      <section>
        <Label>Couleurs · monochrome + 1 bleu</Label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {SWATCHES.map(([name, cls]) => (
            <div key={name} className="overflow-hidden rounded-pl-sm border border-pl-border bg-pl-card">
              <div className={cn('h-12', cls)} />
              <p className="px-2 py-1.5 font-pl-mono text-[11px] text-pl-fg-2">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <Label>Typographie · Geist / Geist Mono</Label>
        <h1 className="pl-display text-[40px] text-pl-fg sm:text-[72px]">
          Titre <span className="pl-text-gradient">serré</span> en majuscules
        </h1>
        <h2 className="pl-h2 text-[28px] sm:text-[40px]">
          Un titre de section clair
          <br />
          <span className="text-pl-fg-3">et sa seconde ligne grise</span>
        </h2>
        <p className="max-w-prose text-base text-pl-fg-2">
          Texte courant en 16 px, interlettrage légèrement resserré, gris secondaire. Les chiffres et commandes passent en mono.
        </p>
        <p className="font-pl-mono text-sm text-pl-fg">$ commande --exemple 01:23:45</p>
      </section>

      <section>
        <Label>Rayons</Label>
        <div className="flex flex-wrap gap-3">
          {RADII.map(([name, cls]) => (
            <div key={name} className={cn('grid h-16 w-20 place-items-center border border-pl-border bg-pl-card shadow-pl-xs', cls)}>
              <span className="font-pl-mono text-[11px] text-pl-fg-2">{name}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <Label>Ombres et surfaces</Label>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-pl-lg bg-pl-card p-5 shadow-pl-card">
            <p className="text-sm font-medium">shadow-card</p>
          </div>
          <div className="rounded-pl-lg bg-pl-card p-5 shadow-pl-glow-soft">
            <p className="text-sm font-medium">glow-soft</p>
          </div>
          <div className="pl-dark rounded-pl-lg bg-pl-ink-dark p-3">
            <div className="pl-raised rounded-pl-sm p-4 text-sm text-white">dark-item</div>
          </div>
          <div className="relative overflow-hidden rounded-pl-lg p-5 sm:col-span-3">
            <div className="absolute inset-0 bg-[radial-gradient(60%_80%_at_20%_30%,#8EC5FF,transparent),radial-gradient(50%_70%_at_80%_70%,#2F5BFF,transparent)]" />
            <div className="pl-glass relative rounded-pl-md px-4 py-3 text-sm font-medium">Verre dépoli · blur 18 px saturate 1.7</div>
          </div>
        </div>
      </section>

      <section>
        <Label>Courbes</Label>
        <div className="space-y-2">
          {CURVES.map(([name, curve]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-pl-mono text-[11px] text-pl-fg-2">{name}</span>
              <div className="relative h-6 flex-1 rounded-pl-pill bg-pl-card-2">
                <span
                  data-pl-loop
                  className="absolute top-1 left-1 size-4 rounded-full bg-pl-accent"
                  style={{ animation: `pl-board-run 2.4s ${cssEase(curve)} infinite alternate` }}
                />
              </div>
            </div>
          ))}
        </div>
        <style>{'@keyframes pl-board-run{to{left:calc(82% - 1rem)}}'}</style>
      </section>
    </div>
  );
}

export default ThemeBoard;
