/**
 * Footer sombre (#060608) : grande image d'ambiance pleine largeur qui se fond dans le fond (placeholder nocturne
 * + tuile de verre au centre, à remplacer via `visual`), puis 3 colonnes — marque + email + sélecteur de langue
 * pill / Navigation / Informations — et copyright gris. 1 colonne sur mobile.
 * Props : brand, email, columns (titre + liens), languages, copyright, visual, visualHeight.
 */
import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Wordmark } from '@/components/atlas/process-like/header/header';
import type { MenuLink } from '@/components/atlas/process-like/fullscreen-menu/fullscreen-menu';

export interface FooterColumn {
  title: string;
  links: MenuLink[];
}

export interface FooterProps {
  brand?: ReactNode;
  email?: string;
  columns: FooterColumn[];
  languages?: { code: string; label: string }[];
  copyright?: string;
  visual?: ReactNode;
  visualHeight?: number;
  className?: string;
}

/** Ambiance générique en CSS/SVG : ciel étoilé, lueur d'horizon, chaînes de montagnes, lac, objet de verre lumineux (aucune image). */
export function NightPlaceholder() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#02050d_0%,#05102c_30%,#0f2a78_58%,#1d47b8_70%,#0a1430_82%,#060608_100%)]">
      {/* Étoiles */}
      <div className="absolute inset-0 opacity-80 [background-image:radial-gradient(1px_1px_at_12%_14%,#fff,transparent),radial-gradient(1px_1px_at_28%_8%,#fff,transparent),radial-gradient(1px_1px_at_47%_20%,rgb(255_255_255/0.7),transparent),radial-gradient(1px_1px_at_63%_6%,#fff,transparent),radial-gradient(1px_1px_at_78%_16%,rgb(255_255_255/0.6),transparent),radial-gradient(1px_1px_at_90%_9%,#fff,transparent),radial-gradient(1px_1px_at_6%_30%,rgb(255_255_255/0.5),transparent)]" />
      {/* Lueur d'horizon */}
      <div className="absolute top-[52%] left-1/2 h-[30%] w-[110%] -translate-x-1/2 rounded-full bg-[#3c6bff]/40 blur-[90px]" />
      {/* Objet de verre lumineux (forme générique) : vraie dalle en 3D (tranche faite de couches empilées en
          profondeur), légèrement tournée vers la lumière, en lévitation lente. */}
      <div className="absolute top-[18%] left-1/2 h-[46%] w-[24%] -translate-x-1/2 sm:w-[min(30%,280px)]" style={{ perspective: 900 }}>
        <div data-pl-loop className="absolute inset-0 animate-pl-float">
          <div
            className="absolute inset-0"
            style={{ transformStyle: 'preserve-3d', transform: 'rotateZ(-8deg) rotateY(-18deg) rotateX(8deg)' }}
          >
            {/* Tranche : liserés empilés vers l'arrière, plus sombres en profondeur. */}
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                aria-hidden
                className="absolute inset-0 rounded-[34%] border-[1.5px]"
                style={{
                  transform: `translateZ(${-(i + 1) * 1.6}px)`,
                  borderColor: `rgb(${120 - i * 5} ${150 - i * 5} 255 / ${0.42 - i * 0.02})`,
                  background: i === 13 ? 'rgb(8 18 60 / 0.55)' : undefined,
                }}
              />
            ))}
            {/* Face avant. */}
            <div className="absolute inset-0 rounded-[34%] border border-white/30 bg-[linear-gradient(150deg,rgb(160_190_255/0.55),rgb(40_80_220/0.25)_45%,rgb(10_20_60/0.4))] shadow-[inset_0_2px_0_rgb(255_255_255/0.6),inset_0_-20px_40px_rgb(0_0_0/0.35),0_40px_80px_-20px_rgb(40_90_255/0.6)]" />
            {/* Reflet intérieur diffus (sans arêtes). */}
            <div
              className="absolute inset-[16%] rounded-[30%] bg-[radial-gradient(closest-side_at_42%_36%,rgb(255_255_255/0.5),transparent)] blur-md"
              style={{ transform: 'translateZ(1px)' }}
            />
          </div>
        </div>
      </div>
      {/* Chaînes de montagnes en couches + lac */}
      <svg aria-hidden viewBox="0 0 1440 400" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[52%] w-full">
        <defs>
          <linearGradient id="pl-night-far" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#1b2a5c" />
            <stop offset="1" stopColor="#0b1228" />
          </linearGradient>
          <linearGradient id="pl-night-lake" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#4f86ff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#0a1430" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M0 150 L120 110 L210 140 L330 80 L450 130 L560 95 L700 140 L820 100 L940 135 L1060 90 L1180 130 L1300 105 L1440 140 L1440 400 L0 400Z"
          fill="url(#pl-night-far)"
          opacity="0.9"
        />
        <path d="M0 200 L90 170 L200 205 L300 175 L420 215 L520 190 L600 220 L1440 220 L1440 400 L0 400Z" fill="#070b18" />
        <path d="M620 220 L1440 205 L1440 400 L620 400Z" fill="#070b18" />
        <ellipse cx="720" cy="238" rx="300" ry="22" fill="url(#pl-night-lake)" />
        <path
          d="M0 260 C180 230 300 280 470 255 C560 242 600 250 640 262 L800 262 C870 248 980 235 1100 258 C1250 285 1340 250 1440 262 L1440 400 L0 400Z"
          fill="#05070d"
        />
        <path d="M0 330 C200 300 380 345 600 320 C820 296 1020 340 1240 318 C1330 310 1390 320 1440 315 L1440 400 L0 400Z" fill="#060608" />
      </svg>
      {/* Reflet de l'objet de verre sur le lac. */}
      <div aria-hidden className="absolute top-[77%] left-1/2 h-[3.5%] w-[14%] -translate-x-1/2 rounded-[50%] bg-[#9db8ff]/40 blur-lg" />
      {/* Fleurs / herbes au premier plan (points de lumière froide) */}
      <div className="absolute inset-x-0 bottom-[8%] h-[14%] opacity-70 [background-image:radial-gradient(1.5px_1.5px_at_8%_40%,#8fb0ff,transparent),radial-gradient(1.5px_1.5px_at_17%_70%,#a9c0ff,transparent),radial-gradient(1.5px_1.5px_at_31%_55%,#8fb0ff,transparent),radial-gradient(1.5px_1.5px_at_74%_45%,#a9c0ff,transparent),radial-gradient(1.5px_1.5px_at_86%_70%,#8fb0ff,transparent),radial-gradient(1.5px_1.5px_at_94%_35%,#a9c0ff,transparent)]" />
    </div>
  );
}

export function Footer({
  brand,
  email = 'contact@exemple.com',
  columns,
  languages = [
    { code: 'fr', label: 'Français' },
    { code: 'en', label: 'English' },
  ],
  copyright = `© ${new Date().getFullYear()} Marque. Tous droits réservés.`,
  visual,
  visualHeight,
  className,
}: FooterProps) {
  const [lang, setLang] = useState(languages[0]?.code);
  return (
    <footer className={cn('pl-dark w-full bg-pl-ink-footer text-white', className)}>
      <div
        className={cn('relative w-full overflow-hidden', !visualHeight && 'h-[420px] sm:h-[720px]')}
        style={visualHeight ? { height: visualHeight } : undefined}
      >
        {visual ?? <NightPlaceholder />}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-[linear-gradient(transparent,#060608)]" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 pt-10 pb-10 sm:grid-cols-[1fr_auto_auto] sm:gap-x-20 sm:px-8 sm:pt-14">
        <div className="space-y-5">
          {brand ?? <Wordmark tone="dark" variant="brand" />}
          <a href={`mailto:${email}`} className="block text-[15px] text-white/75 hover:text-white">
            {email}
          </a>
          <label className="relative inline-flex h-8 items-center rounded-pl-pill bg-white/[0.06] pr-8 pl-4 text-sm font-medium text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
            <span className="sr-only">Langue</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="appearance-none bg-transparent pr-6 outline-none [&>option]:text-pl-ink"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 size-3.5 text-white/50" aria-hidden />
          </label>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title} className="space-y-4">
            <h4 className="text-[15px] font-semibold text-white">{col.title}</h4>
            <ul className="space-y-6 sm:space-y-3">
              {col.links.map((l) => (
                <li key={l.href + l.label}>
                  <a href={l.href} className="text-[16px] text-white/60 transition-colors hover:text-white sm:text-[15px]">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="mx-auto max-w-6xl border-t border-white/[0.07] px-5 py-6 text-sm text-white/40 sm:px-8">{copyright}</div>
    </footer>
  );
}

export default Footer;
