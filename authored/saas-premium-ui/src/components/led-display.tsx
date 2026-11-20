/**
 * LedDisplay : afficheur à matrice de points (police 5×7), bleu lumineux sur fond noir.
 * Affiche une ou plusieurs lignes de texte (chiffres, lettres sans accent, : - . %, saut de ligne entre lignes) et/ou
 * un compte à rebours (`countdown` en secondes) ; cadre noir épais à liseré.
 * Props : text, countdown, dot (taille d'un point en px), gap, tone (accent, white, success), framed (cadre noir arrondi).
 */
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

/** Police 5×7 : 5 colonnes par caractère, bit 0 = ligne du haut. */
const FONT: Record<string, number[]> = {
  '0': [0x3e, 0x51, 0x49, 0x45, 0x3e],
  '1': [0x00, 0x42, 0x7f, 0x40, 0x00],
  '2': [0x42, 0x61, 0x51, 0x49, 0x46],
  '3': [0x21, 0x41, 0x45, 0x4b, 0x31],
  '4': [0x18, 0x14, 0x12, 0x7f, 0x10],
  '5': [0x27, 0x45, 0x45, 0x45, 0x39],
  '6': [0x3c, 0x4a, 0x49, 0x49, 0x30],
  '7': [0x01, 0x71, 0x09, 0x05, 0x03],
  '8': [0x36, 0x49, 0x49, 0x49, 0x36],
  '9': [0x06, 0x49, 0x49, 0x29, 0x1e],
  ':': [0x00, 0x36, 0x36, 0x00, 0x00],
  '-': [0x08, 0x08, 0x08, 0x08, 0x08],
  '.': [0x00, 0x60, 0x60, 0x00, 0x00],
  '%': [0x23, 0x13, 0x08, 0x64, 0x62],
  '€': [0x3e, 0x55, 0x55, 0x41, 0x22],
  ' ': [0, 0, 0, 0, 0],
  A: [0x7e, 0x11, 0x11, 0x11, 0x7e],
  B: [0x7f, 0x49, 0x49, 0x49, 0x36],
  C: [0x3e, 0x41, 0x41, 0x41, 0x22],
  D: [0x7f, 0x41, 0x41, 0x22, 0x1c],
  E: [0x7f, 0x49, 0x49, 0x49, 0x41],
  F: [0x7f, 0x09, 0x09, 0x09, 0x01],
  G: [0x3e, 0x41, 0x49, 0x49, 0x7a],
  H: [0x7f, 0x08, 0x08, 0x08, 0x7f],
  I: [0x00, 0x41, 0x7f, 0x41, 0x00],
  J: [0x20, 0x40, 0x41, 0x3f, 0x01],
  K: [0x7f, 0x08, 0x14, 0x22, 0x41],
  L: [0x7f, 0x40, 0x40, 0x40, 0x40],
  M: [0x7f, 0x02, 0x0c, 0x02, 0x7f],
  N: [0x7f, 0x04, 0x08, 0x10, 0x7f],
  O: [0x3e, 0x41, 0x41, 0x41, 0x3e],
  P: [0x7f, 0x09, 0x09, 0x09, 0x06],
  Q: [0x3e, 0x41, 0x51, 0x21, 0x5e],
  R: [0x7f, 0x09, 0x19, 0x29, 0x46],
  S: [0x46, 0x49, 0x49, 0x49, 0x31],
  T: [0x01, 0x01, 0x7f, 0x01, 0x01],
  U: [0x3f, 0x40, 0x40, 0x40, 0x3f],
  V: [0x1f, 0x20, 0x40, 0x20, 0x1f],
  W: [0x3f, 0x40, 0x38, 0x40, 0x3f],
  X: [0x63, 0x14, 0x08, 0x14, 0x63],
  Y: [0x07, 0x08, 0x70, 0x08, 0x07],
  Z: [0x61, 0x51, 0x49, 0x45, 0x43],
};

const TONES = {
  accent: { on: '#5B83FF', glow: 'rgb(47 91 255 / 0.9)', off: 'rgb(47 91 255 / 0.13)' },
  white: { on: '#FFFFFF', glow: 'rgb(255 255 255 / 0.7)', off: 'rgb(255 255 255 / 0.08)' },
  /** Points blanc-gris discrets, faible lueur (afficheur d'offre). */
  dim: { on: '#D5DAE6', glow: 'rgb(190 205 235 / 0.35)', off: 'rgb(255 255 255 / 0.05)' },
  /** Variante bleutée discrète (1re ligne de l'afficheur d'offre). */
  dimAccent: { on: '#8D9FCC', glow: 'rgb(120 150 230 / 0.3)', off: 'rgb(255 255 255 / 0.05)' },
  success: { on: '#4ADE80', glow: 'rgb(34 197 94 / 0.85)', off: 'rgb(34 197 94 / 0.12)' },
};

export interface LedDisplayProps {
  /** Texte ; `\n` pour plusieurs lignes. */
  text?: string;
  /** Secondes restantes : ligne HH:MM:SS (ou « Nj HH:MM:SS » au-delà d'un jour) qui décompte chaque seconde. */
  countdown?: number;
  dot?: number;
  gap?: number;
  tone?: keyof typeof TONES;
  framed?: boolean;
  /** Étiquette en onglet posée sur le haut du cadre (mono majuscules). */
  label?: string;
  /** Ton par ligne (sinon `tone` pour toutes). */
  rowTones?: (keyof typeof TONES)[];
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');
const hms = (s: number) => {
  const d = Math.floor(s / 86400);
  const rest = s % 86400;
  const clock = `${pad(Math.floor(rest / 3600))}:${pad(Math.floor((rest % 3600) / 60))}:${pad(rest % 60)}`;
  return d ? `${d}J ${clock}` : clock;
};

function Row({ text, dot, gap, tone }: { text: string; dot: number; gap: number; tone: keyof typeof TONES }) {
  const chars = useMemo(() => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().split(''), [text]);
  const columns = chars.flatMap((c, i) => [...(FONT[c] ?? FONT[' ']), ...(i < chars.length - 1 ? [0] : [])]);
  const step = dot + gap;
  const w = columns.length * step - gap;
  const h = 7 * step - gap;
  const t = TONES[tone];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="h-auto max-w-full overflow-visible">
      {columns.map((col, x) =>
        Array.from({ length: 7 }, (_, y) => {
          const on = (col >> y) & 1;
          return (
            <circle
              key={`${x}-${y}`}
              cx={x * step + dot / 2}
              cy={y * step + dot / 2}
              r={dot / 2}
              fill={on ? t.on : t.off}
              style={on ? { filter: `drop-shadow(0 0 ${dot * 0.7}px ${t.glow})` } : undefined}
            />
          );
        }),
      )}
    </svg>
  );
}

export function LedDisplay({
  text,
  countdown,
  dot = 4,
  gap = 1.5,
  tone = 'accent',
  framed = true,
  label,
  rowTones,
  className,
}: LedDisplayProps) {
  const [left, setLeft] = useState(countdown ?? 0);
  useEffect(() => {
    if (countdown === undefined) return;
    setLeft(countdown);
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  const rows = [...(text ? text.split('\n') : []), ...(countdown !== undefined ? [hms(left)] : [])];

  return (
    <div
      role="img"
      aria-label={[label, ...rows].filter(Boolean).join(' ')}
      className={cn(
        'relative inline-flex max-w-full flex-col items-center',
        framed &&
          'rounded-[22px] bg-[#050507] px-5 py-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06),inset_0_10px_30px_rgb(0_0_0/0.9),0_0_0_6px_#0c0d11,0_24px_50px_-20px_rgb(0_0_0/0.5)] sm:px-7 sm:py-5',
        className,
      )}
      style={{ gap: dot * 3 }}
    >
      {label && framed && (
        <span className="absolute -top-[22px] left-1/2 -translate-x-1/2 rounded-t-[10px] bg-[#0c0d11] px-3.5 pt-1 pb-0.5 font-pl-mono text-[10px] font-bold tracking-[0.22em] whitespace-nowrap text-[#6f7ba0] uppercase">
          {label}
        </span>
      )}
      {rows.map((r, i) => (
        <Row key={i} text={r} dot={dot} gap={gap} tone={rowTones?.[i] ?? tone} />
      ))}
    </div>
  );
}

export default LedDisplay;
