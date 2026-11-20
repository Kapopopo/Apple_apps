/**
 * PerspectiveGrid : sol en grille bleue vu en perspective (rotateX) qui défile vers l'avant en boucle
 * (translate 44 px, 2,4 s), fondu vers l'horizon et lueur au point de fuite. Se place sous des mockups.
 * Props : color, cell (px), angle (deg), speed (s par cellule, 0 = fixe), horizon (part de hauteur), children.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PerspectiveGridProps {
  color?: string;
  cell?: number;
  angle?: number;
  speed?: number;
  /** Hauteur du sol (0–1 de la zone). */
  horizon?: number;
  children?: ReactNode;
  className?: string;
}

export function PerspectiveGrid({
  color = 'rgb(47 91 255 / 0.55)',
  cell = 44,
  angle = 64,
  speed = 2.4,
  horizon = 0.6,
  children,
  className,
}: PerspectiveGridProps) {
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10"
        style={{ height: `${horizon * 100}%`, perspective: 420 }}
      >
        <div
          data-pl-loop
          className={cn('absolute inset-x-[-50%] top-0 h-[200%] origin-top', speed > 0 && 'animate-pl-grid-scroll')}
          style={{
            transform: `rotateX(${angle}deg)`,
            backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
            backgroundSize: `${cell}px ${cell}px`,
            animationDuration: speed > 0 ? `${speed}s` : undefined,
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 35%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 35%)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-24 -translate-y-1/2 bg-[radial-gradient(50%_50%_at_50%_50%,rgb(47_91_255/0.45),transparent)] blur-xl" />
      </div>
      {children}
    </div>
  );
}

export default PerspectiveGrid;
