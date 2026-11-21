/**
 * GlassLogo : logo en verre 3D (glassmorphism) — tuile arrondie inclinée vers la lumière, verre dépoli qui floute
 * réellement le décor derrière (backdrop-filter), tranche extrudée (ombres empilées dans le plan de la tuile),
 * liseré lumineux, reflet spéculaire et éclat de lumière qui balaie la surface en boucle ; symbole gravé au centre
 * (étoile à 4 branches générique, à remplacer par le vrai logo via `children`). Lévitation lente.
 * Animations coupées sous prefers-reduced-motion (data-pl-loop).
 */
import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Tranche du verre : ombres décalées pas à pas dans le plan de la tuile, de plus en plus sombres. */
const EXTRUDE = Array.from({ length: 12 }, (_, i) => {
  const d = i + 1;
  const l = 150 - i * 7;
  return `${d * 0.55}px ${d}px 0 rgb(${l - 50} ${l - 20} 255 / ${0.55 - i * 0.025})`;
}).join(', ');

/** Symbole du logo (étoile à 4 branches gravée). Id de dégradé unique : plusieurs logos peuvent coexister. */
export function Spark() {
  const id = useId();
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.55" stopColor="#d6e2ff" />
          <stop offset="1" stopColor="#8fb0ff" />
        </linearGradient>
      </defs>
      {/* Gravure : creux sombre décalé, puis le symbole clair par-dessus. */}
      <path
        d="M50 6 C54 32 68 46 94 50 C68 54 54 68 50 94 C46 68 32 54 6 50 C32 46 46 32 50 6Z"
        fill="rgb(10 25 90 / 0.55)"
        transform="translate(1.6 2.4)"
      />
      <path d="M50 6 C54 32 68 46 94 50 C68 54 54 68 50 94 C46 68 32 54 6 50 C32 46 46 32 50 6Z" fill={`url(#${id})`} />
      {/* Arête brillante de la branche haute. */}
      <path d="M50 10 C52.5 30 60 41 72 46" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function GlassLogo({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      {/* Halo bleu derrière le verre : il l'intègre à la lumière de la scène. */}
      <div aria-hidden className="absolute inset-[-35%] rounded-full bg-[radial-gradient(closest-side,rgb(70_130_255/0.55),transparent)] blur-2xl" />
      {/* La perspective doit être sur le parent direct de la tuile inclinée. */}
      <div data-pl-loop className="relative size-full animate-pl-float" style={{ perspective: 900 }}>
        <div
          className="relative size-full overflow-hidden rounded-[27%] border border-white/40 bg-[linear-gradient(145deg,rgb(255_255_255/0.32),rgb(150_185_255/0.12)_42%,rgb(40_80_210/0.22))] backdrop-blur-xl backdrop-saturate-150"
          style={{
            transform: 'rotateX(14deg) rotateY(-20deg) rotateZ(-5deg)',
            boxShadow: [
              'inset 0 1.5px 0 rgb(255 255 255 / 0.85)',
              'inset 1.5px 0 0 rgb(255 255 255 / 0.4)',
              'inset -1px -1px 0 rgb(140 175 255 / 0.5)',
              'inset 0 -18px 40px rgb(10 25 90 / 0.35)',
              EXTRUDE,
              '0 40px 70px -18px rgb(40 95 255 / 0.65)',
            ].join(', '),
          }}
        >
          {/* Reflet spéculaire diffus en haut à gauche. */}
          <span aria-hidden className="absolute -top-[30%] -left-[20%] size-[85%] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.75),transparent)] blur-md" />
          {/* Lisière de lumière le long du bord droit. */}
          <span aria-hidden className="absolute inset-y-[8%] right-0 w-[14%] bg-[linear-gradient(90deg,transparent,rgb(170_200_255/0.45))] blur-[2px]" />
          {/* Éclat qui balaie la surface (le déplacement est animé sur l'enveloppe, l'inclinaison est sur l'enfant). */}
          <span
            aria-hidden
            data-pl-loop
            className="absolute inset-y-[-20%] left-0 w-[45%]"
            style={{ animation: 'pl-glass-sweep 5.5s cubic-bezier(0.45,0,0.2,1) infinite' }}
          >
            <span className="block size-full -skew-x-[20deg] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.55),transparent)]" />
          </span>
          <div className="absolute inset-[22%] drop-shadow-[0_0_14px_rgb(160_195_255/0.85)]">{children ?? <Spark />}</div>
        </div>
      </div>
    </div>
  );
}

/**
 * GlassMark : version compacte du logo pour le header, le menu mobile et le footer (28–40 px) — même verre bleu,
 * même étoile, mais de face (une inclinaison 3D se lit mal en petit) : tranche de 3 px, liseré, reflet, et l'éclat
 * de lumière ne passe qu'au survol du lien parent (classe `group`). Lisible sur fond clair comme sombre.
 */
export function GlassMark({ size = 32, className }: { size?: number; className?: string }) {
  const depth = Math.max(2, Math.round(size / 11));
  const extrude = Array.from({ length: depth }, (_, i) => `0 ${i + 1}px 0 rgb(${40 - i * 6} ${70 - i * 8} ${200 - i * 15})`).join(', ');
  return (
    <span
      aria-hidden
      className={cn('relative inline-block shrink-0 overflow-hidden', className)}
      style={{
        width: size,
        height: size,
        marginBottom: depth,
        borderRadius: size * 0.27,
        background: 'linear-gradient(145deg, #8fb3ff 0%, #3f6dff 45%, #1f3fe0 100%)',
        boxShadow: [
          'inset 0 1px 0 rgb(255 255 255 / 0.85)',
          'inset 1px 0 0 rgb(255 255 255 / 0.35)',
          'inset 0 -4px 8px rgb(10 25 90 / 0.35)',
          extrude,
          `0 ${depth + 4}px 12px -4px rgb(40 95 255 / 0.55)`,
        ].join(', '),
      }}
    >
      <span className="absolute -top-[35%] -left-[25%] size-[85%] rounded-full bg-[radial-gradient(closest-side,rgb(255_255_255/0.7),transparent)]" />
      <span className="absolute inset-y-[-20%] left-0 w-1/2 -translate-x-[160%] transition-transform duration-700 ease-out group-hover:translate-x-[260%]">
        <span className="block size-full -skew-x-[20deg] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.6),transparent)]" />
      </span>
      <span className="absolute inset-[20%] drop-shadow-[0_0_4px_rgb(190_215_255/0.9)]">
        <Spark />
      </span>
    </span>
  );
}

export default GlassLogo;
