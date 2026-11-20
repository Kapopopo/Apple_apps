/**
 * PixelWaveBackground : vagues de pixels concentriques qui s'agrandissent depuis un point (scale 0 → 1) en
 * s'estompant ; 4 couches décalées de 9, 11, 14 et 17 s pour un mouvement jamais répétitif.
 * Chaque couche = trame de carrés (SVG en motif) masquée par un anneau radial.
 * Sous prefers-reduced-motion : animations coupées, seule la première couche reste (figée).
 * Props : tone (accent, white), pixel (pas en px), origin (centre des vagues, position CSS), opacity, children.
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PixelWaveBackgroundProps {
  tone?: 'accent' | 'white';
  pixel?: number;
  origin?: string;
  opacity?: number;
  children?: ReactNode;
  className?: string;
}

const LAYERS = [9, 11, 14, 17];

const squares = (pixel: number, fill: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${pixel}' height='${pixel}'><rect width='${pixel - 1.5}' height='${pixel - 1.5}' rx='0.6' fill='${fill}'/></svg>`,
  )}")`;

export function PixelWaveBackground({
  tone = 'accent',
  pixel = 6,
  origin = '50% 100%',
  opacity = 0.75,
  children,
  className,
}: PixelWaveBackgroundProps) {
  const fill = tone === 'accent' ? '#2F5BFF' : '#FFFFFF';
  const ring = `radial-gradient(circle at ${origin}, transparent 26%, #000 31%, #000 33%, transparent 38%)`;
  const layer = (duration: number, i: number): CSSProperties => ({
    transformOrigin: origin,
    backgroundImage: squares(pixel, fill),
    backgroundSize: `${pixel}px ${pixel}px`,
    opacity: 1 - i * 0.15,
    maskImage: ring,
    WebkitMaskImage: ring,
    animation: `pl-pixel-wave ${duration}s var(--pl-ease-out-soft) infinite`,
    animationDelay: `${-i * 2.6}s`,
  });
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={{ opacity }}>
        {LAYERS.map((d, i) => (
          <div key={d} data-pl-loop={i ? 'hide' : ''} className="absolute -inset-[60%]" style={layer(d, i)} />
        ))}
      </div>
      {children}
    </div>
  );
}

export default PixelWaveBackground;
