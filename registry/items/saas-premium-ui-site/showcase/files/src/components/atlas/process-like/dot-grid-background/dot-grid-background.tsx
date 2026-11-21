/**
 * DotGridBackground : trame de points en halftone dont la densité décroît vers le centre (le contenu reste lisible),
 * avec halos bleus flous qui dérivent lentement (12–15 s, décalés : near, far, shade).
 * Tons : light (points gris sur fond clair), dark (points blancs sur noir). `halo={false}` pour la trame seule.
 * À placer en `absolute inset-0` derrière un contenu, ou comme conteneur avec `children`.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface DotGridBackgroundProps {
  tone?: 'light' | 'dark';
  /** Pas de la grille en px. */
  spacing?: number;
  /** Rayon des plus gros points en px. */
  dotSize?: number;
  /** Zone vide au centre (0–1, part du rayon). */
  clearCenter?: number;
  halo?: boolean;
  children?: ReactNode;
  className?: string;
}

export function DotGridBackground({
  tone = 'light',
  spacing = 14,
  dotSize = 1.6,
  clearCenter = 0.38,
  halo = true,
  children,
  className,
}: DotGridBackgroundProps) {
  const color = tone === 'dark' ? 'rgb(255 255 255 / 0.22)' : 'rgb(10 10 10 / 0.16)';
  const fine = tone === 'dark' ? 'rgb(255 255 255 / 0.12)' : 'rgb(10 10 10 / 0.09)';
  const inner = Math.round(clearCenter * 100);
  // Deux trames superposées : gros points sur les bords, points fins jusqu'au milieu → effet halftone.
  const big: CSSProperties = {
    backgroundImage: `radial-gradient(circle, ${color} ${dotSize}px, transparent ${dotSize + 0.6}px)`,
    backgroundSize: `${spacing}px ${spacing}px`,
    maskImage: `radial-gradient(ellipse 70% 75% at 50% 50%, transparent ${inner + 18}%, #000 92%)`,
    WebkitMaskImage: `radial-gradient(ellipse 70% 75% at 50% 50%, transparent ${inner + 18}%, #000 92%)`,
  };
  const small: CSSProperties = {
    backgroundImage: `radial-gradient(circle, ${fine} ${dotSize * 0.55}px, transparent ${dotSize * 0.55 + 0.6}px)`,
    backgroundSize: `${spacing}px ${spacing}px`,
    backgroundPosition: `${spacing / 2}px ${spacing / 2}px`,
    maskImage: `radial-gradient(ellipse 70% 75% at 50% 50%, transparent ${inner}%, #000 70%, transparent 100%)`,
    WebkitMaskImage: `radial-gradient(ellipse 70% 75% at 50% 50%, transparent ${inner}%, #000 70%, transparent 100%)`,
  };

  const layers = (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {halo && (
        <>
          <div
            data-pl-loop
            className="absolute -top-[20%] -left-[10%] h-[70%] w-[60%] animate-pl-halo rounded-full bg-pl-accent/35 blur-[90px]"
          />
          <div
            data-pl-loop
            className="absolute -right-[15%] -bottom-[25%] h-[75%] w-[65%] animate-pl-halo rounded-full bg-pl-accent-sky/40 blur-[110px] [animation-delay:-5s] [animation-duration:15s]"
          />
          <div
            data-pl-loop
            className={cn(
              'absolute top-[30%] left-[35%] h-[40%] w-[30%] animate-pl-halo rounded-full blur-[80px] [animation-delay:-9s] [animation-duration:12s]',
              tone === 'dark' ? 'bg-[#3C47F3]/30' : 'bg-white/60',
            )}
          />
        </>
      )}
      <div className="absolute inset-0" style={big} />
      <div className="absolute inset-0" style={small} />
    </div>
  );

  if (!children) return <div className={cn('absolute inset-0', className)}>{layers}</div>;
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      {layers}
      <div className="relative">{children}</div>
    </div>
  );
}

export default DotGridBackground;
