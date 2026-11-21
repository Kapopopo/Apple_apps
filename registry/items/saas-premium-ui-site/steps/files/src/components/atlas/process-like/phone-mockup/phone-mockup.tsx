/**
 * PhoneMockup : cadre de smartphone générique (coins très arrondis, îlot noir en haut, reflets de bord),
 * écran en placeholder par défaut ou contenu libre (`children` : image, vidéo, interface).
 * Props : width (px, la hauteur suit un ratio 19,5:9), frame (graphite, silver), float (lévitation en boucle),
 * tilt (degrés, rotation 3D légère), glow (halo bleu dessous).
 */
import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PhoneMockupProps {
  children?: ReactNode;
  width?: number;
  frame?: 'graphite' | 'silver';
  float?: boolean;
  tilt?: number;
  glow?: boolean;
  /** Variation du placeholder (0–3) quand aucun contenu n'est fourni. */
  placeholder?: number;
  /** Écran placeholder clair ou sombre (app en mode sombre). */
  screen?: 'light' | 'dark';
  className?: string;
  style?: CSSProperties;
}

/** Écran d'app sombre générique : barre de statut, en-tête, carte en dégradé, lignes de liste, barre d'onglets. */
export function DarkScreenPlaceholder({ variant = 0 }: { variant?: number }) {
  const accents = ['#2f5bff', '#22c55e', '#d97757', '#a7a1f5'];
  const accent = accents[variant % accents.length];
  return (
    <div className="flex h-full flex-col gap-2.5 bg-[#0b0b0f] p-3 pt-9 text-white">
      <div className="flex items-center justify-between">
        <div className="h-2.5 w-1/3 rounded-full bg-white/70" />
        <div className="size-5 rounded-full bg-white/10" />
      </div>
      <div
        className="relative aspect-[5/4] w-full overflow-hidden rounded-[14px]"
        style={{ background: `linear-gradient(150deg, ${accent}, #14161d 70%)` }}
      >
        <div className="absolute bottom-3 left-3 h-2 w-1/2 rounded-full bg-white/70" />
        <div className="absolute bottom-6 left-3 h-3 w-1/3 rounded-full bg-white" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2 rounded-[10px] bg-white/[0.06] p-2">
          <div className="size-6 rounded-[7px]" style={{ background: i === variant % 3 ? accent : 'rgb(255 255 255 / 0.12)' }} />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-3/4 rounded-full bg-white/50" />
            <div className="h-1.5 w-1/2 rounded-full bg-white/20" />
          </div>
        </div>
      ))}
      <div className="mt-auto flex justify-around rounded-full bg-white/[0.06] py-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="size-3 rounded-full" style={{ background: i === 0 ? accent : 'rgb(255 255 255 / 0.25)' }} />
        ))}
      </div>
    </div>
  );
}

/** Écran placeholder clair : barre de statut, bloc média gris, lignes de texte. */
export function ScreenPlaceholder({ variant = 0 }: { variant?: number }) {
  const hues = ['#E6E8EE', '#DCE3F5', '#E9E6EE', '#E2EAE6'];
  return (
    <div className="flex h-full flex-col gap-2.5 bg-pl-surface p-3 pt-10">
      <div
        className="aspect-[4/5] w-full rounded-[14px]"
        style={{ background: `linear-gradient(160deg, ${hues[variant % 4]}, #F3F3F4)` }}
      />
      <div className="h-2.5 w-3/4 rounded-full bg-pl-bg-soft-2" />
      <div className="h-2.5 w-1/2 rounded-full bg-pl-bg-soft" />
      <div className="mt-auto flex gap-2">
        <div className="h-8 flex-1 rounded-full bg-pl-ink" />
        <div className="size-8 rounded-full bg-pl-bg-soft-2" />
      </div>
    </div>
  );
}

export function PhoneMockup({
  children,
  width = 240,
  frame = 'graphite',
  float = false,
  tilt = 0,
  glow = false,
  placeholder = 0,
  screen = 'light',
  className,
  style,
}: PhoneMockupProps) {
  const height = Math.round(width * 2.07);
  const radius = Math.round(width * 0.17);
  const pad = Math.max(6, Math.round(width * 0.035));
  /* Les écrans placeholder sont dessinés pour un téléphone de 200 px. En dessous, on les réduit d'un bloc
     (proportions conservées) au lieu de laisser leurs tailles fixes écraser la mise en page. */
  const screenW = width - 2 * pad;
  const screenH = height - 2 * pad;
  const scale = Math.min(1, screenW / 186);
  const k = Math.min(1, width / 200);
  return (
    <div
      data-pl-loop={float ? '' : undefined}
      className={cn('relative shrink-0', float && 'animate-pl-float', className)}
      style={{ width, height, perspective: 1200, ...style }}
    >
      {glow && (
        <div aria-hidden className="absolute -bottom-8 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-full bg-pl-accent/50 blur-2xl" />
      )}
      <div
        className="relative h-full w-full"
        style={{
          borderRadius: radius,
          padding: pad,
          transform: tilt ? `rotateY(${tilt}deg) rotateX(${Math.abs(tilt) / 3}deg)` : undefined,
          background:
            frame === 'silver'
              ? 'linear-gradient(145deg,#f4f4f6,#c9cad0 45%,#eeeef1)'
              : 'linear-gradient(145deg,#3a3a40,#141417 45%,#2a2a2f)',
          boxShadow:
            'inset 0 0 0 1px rgb(255 255 255 / 0.12), inset 0 0 0 2px rgb(0 0 0 / 0.5), 0 30px 60px -20px rgb(0 0 0 / 0.45), 0 12px 24px -12px rgb(0 0 0 / 0.3)',
        }}
      >
        <div className="relative h-full w-full overflow-hidden bg-black" style={{ borderRadius: radius - Math.round(width * 0.035) }}>
          {children ?? (
            <div
              className="h-full"
              style={
                scale < 1
                  ? { width: screenW / scale, height: screenH / scale, transform: `scale(${scale})`, transformOrigin: '0 0' }
                  : undefined
              }
            >
              {screen === 'dark' ? <DarkScreenPlaceholder variant={placeholder} /> : <ScreenPlaceholder variant={placeholder} />}
            </div>
          )}
          <div
            aria-hidden
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black"
            style={{ top: Math.round(10 * k), width: width * 0.32, height: Math.max(16 * k, width * 0.085) }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgb(255_255_255/0.12),transparent_30%)]"
          />
        </div>
      </div>
    </div>
  );
}

export default PhoneMockup;
