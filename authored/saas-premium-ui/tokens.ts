/**
 * Tokens du thème « Saas premium UI » : source unique de tokens.css et de meta.tokens (builder, skin, get_theme).
 * Valeurs tirées de process-style.md §2, calibrées sur des mesures du rendu (tailles, couleurs, ombres) ; aucun asset repris.
 * Préfixe --pl-* : pas de collision avec les tokens d'autres thèmes ; un bloc de compatibilité shadcn
 * (--background, --primary…) permet au builder de recolorer les composants des autres sources.
 */

/** Couleurs fixes (identiques en clair et dans les blocs sombres). */
export const palette: Record<string, string> = {
  '--pl-bg': '#F5F5F7',
  '--pl-bg-soft': '#F3F3F4',
  '--pl-bg-soft-2': '#E6E8EE',
  '--pl-surface': '#FFFFFF',
  '--pl-ink': '#0B0B0F',
  /** Encre des titres display (légèrement adoucie, texte « gravé »). */
  '--pl-ink-display': '#1C1C21',
  '--pl-ink-dark-bg': '#000000',
  /** Cadres des cartes sombres et footer. */
  '--pl-ink-card': '#0C0D11',
  '--pl-ink-footer': '#060608',
  '--pl-ink-raised-from': '#1C1C20',
  '--pl-ink-raised-to': '#141417',
  '--pl-muted': '#52525B',
  '--pl-muted-2': '#A1A1AA',
  '--pl-line': '#ECECEF',
  '--pl-accent': '#2F5BFF',
  '--pl-accent-deep': '#1D33F5',
  '--pl-accent-sky': '#8EC5FF',
  '--pl-accent-soft-bg': '#EEF5FF',
  '--pl-accent-line': '#C5DBFF',
  '--pl-link': '#0B62D6',
  '--pl-success': '#15803D',
  '--pl-success-bg': '#ECFDF5',
  '--pl-success-dot': '#22C55E',
  '--pl-warning': '#B45309',
  '--pl-warning-bg': '#FFFBEB',
  '--pl-danger': '#B91C1C',
  '--pl-danger-bg': '#FEF2F2',
  '--pl-agent-1': '#D97757',
  '--pl-agent-2': '#A7A1F5',
  '--pl-agent-3': '#3C47F3',
};

/** Rôles qui basculent dans un bloc sombre (.pl-dark) ou en mode sombre global. */
export const semanticLight: Record<string, string> = {
  '--pl-page': '#F5F5F7',
  '--pl-fg': '#0B0B0F',
  '--pl-fg-2': '#63636E',
  '--pl-fg-3': '#A1A1AA',
  /** Seconde ligne des titres deux tons. */
  '--pl-fg-sub': '#6B6B74',
  '--pl-card': '#FFFFFF',
  '--pl-card-2': '#F3F3F4',
  '--pl-border': '#ECECEF',
  '--pl-glass-bg': 'rgb(255 255 255 / 0.72)',
  '--pl-glass-edge': 'rgb(255 255 255 / 0.85)',
};
export const semanticDark: Record<string, string> = {
  '--pl-page': '#000000',
  '--pl-fg': '#FFFFFF',
  '--pl-fg-2': 'rgb(255 255 255 / 0.62)',
  '--pl-fg-3': '#71717A',
  '--pl-fg-sub': 'rgb(255 255 255 / 0.45)',
  '--pl-card': '#141417',
  '--pl-card-2': '#1C1C20',
  '--pl-border': 'rgb(255 255 255 / 0.09)',
  '--pl-glass-bg': 'rgb(20 20 28 / 0.52)',
  '--pl-glass-edge': 'rgb(255 255 255 / 0.13)',
};

/** Compatibilité shadcn : recolore les composants des autres sources quand ce thème est choisi dans le builder. */
export const compatLight: Record<string, string> = {
  '--background': '#F5F5F7',
  '--foreground': '#0A0A0A',
  '--card': '#FFFFFF',
  '--card-foreground': '#0A0A0A',
  '--popover': '#FFFFFF',
  '--popover-foreground': '#0A0A0A',
  '--primary': '#0A0A0A',
  '--primary-foreground': '#FFFFFF',
  '--secondary': '#F3F3F4',
  '--secondary-foreground': '#0A0A0A',
  '--muted': '#F3F3F4',
  '--muted-foreground': '#52525B',
  '--accent': '#EEF5FF',
  '--accent-foreground': '#2F5BFF',
  '--destructive': '#B91C1C',
  '--border': '#ECECEF',
  '--input': '#ECECEF',
  '--ring': '#2F5BFF',
};
export const compatDark: Record<string, string> = {
  '--background': '#000000',
  '--foreground': '#FFFFFF',
  '--card': '#141417',
  '--card-foreground': '#FFFFFF',
  '--popover': '#141417',
  '--popover-foreground': '#FFFFFF',
  '--primary': '#FFFFFF',
  '--primary-foreground': '#0A0A0A',
  '--secondary': '#1C1C20',
  '--secondary-foreground': '#FFFFFF',
  '--muted': '#1C1C20',
  '--muted-foreground': '#A1A1AA',
  '--accent': '#1C1C20',
  '--accent-foreground': '#8EC5FF',
  '--destructive': '#EF4444',
  '--border': 'rgb(255 255 255 / 0.09)',
  '--input': 'rgb(255 255 255 / 0.13)',
  '--ring': '#2F5BFF',
};

/** Pas de guillemets : la feuille « skin » du builder n'accepte que des valeurs CSS simples. */
export const typography: Record<string, string> = {
  '--pl-font-sans': 'var(--font-geist-sans, Geist), Inter, ui-sans-serif, system-ui, sans-serif',
  '--pl-font-mono': 'var(--font-geist-mono, Geist Mono), ui-monospace, SFMono-Regular, Menlo, monospace',
  '--font-sans': 'var(--pl-font-sans)',
  '--font-mono': 'var(--pl-font-mono)',
  '--pl-tracking-display': '-0.045em',
  '--pl-tracking-body': '-0.01em',
  '--pl-leading-display': '1.02',
  '--pl-tracking-h2': '-0.035em',
  '--pl-tracking-dark': '-0.05em',
};

export const radius: Record<string, string> = {
  '--pl-r-xs': '3px',
  '--pl-r-sm': '11px',
  '--pl-r-md': '14px',
  '--pl-r-lg': '28px',
  '--pl-r-xl': '48px',
  '--pl-r-pill': '999px',
  '--radius': '0.875rem',
};

export const shadows: Record<string, string> = {
  '--pl-shadow-xs': '0 1px 2px rgb(0 0 0 / 0.04)',
  '--pl-shadow-card': '0 1px 2px rgb(0 0 0 / 0.04), 0 12px 32px -18px rgb(0 0 0 / 0.18)',
  '--pl-shadow-card-hover': '0 2px 4px rgb(0 0 0 / 0.05), 0 22px 44px -20px rgb(0 0 0 / 0.24)',
  '--pl-shadow-btn': '0 10px 28px rgb(0 0 0 / 0.14)',
  '--pl-shadow-dark-item': 'inset 0 1px 0 rgb(255 255 255 / 0.13), 0 0 0 1px rgb(255 255 255 / 0.09), 0 12px 26px -12px #000',
  '--pl-glow-accent': 'inset 0 1px 0 rgb(255 255 255/.35),0 0 0 1px rgb(80 120 255/.6),0 2px 12px rgb(60 100 255/.55)',
  '--pl-glow-soft': '0 0 0 1px rgb(120 130 255 / 0.16), 0 0 34px rgb(79 123 255 / 0.34), 0 24px 60px rgb(20 24 40 / 0.16)',
  '--pl-glow-ring': '0 0 0 6px rgb(120 140 255 / 0.06), 0 24px 60px rgb(60 80 200 / 0.12)',
  '--pl-glow-cta': '0 0 0 1px rgb(11 11 15/.9),0 13px 29px -10px rgb(47 91 255/.53),0 0 38px rgb(79 180 255/.24)',
  '--pl-shadow-dark-card': '0 18px 40px -14px rgb(0 0 0 / 0.35), 0 2px 6px rgb(0 0 0 / 0.12)',
  '--pl-shadow-pill': '0 1px 1px rgb(23 26 38 / 0.06), 0 2px 5px rgb(23 26 38 / 0.08)',
  '--pl-shadow-inset': 'inset 0 2px 3px rgb(23 26 38 / 0.11), inset 0 -1px 0 #fff, 0 1px 0 #fff',
  '--pl-ring-pulse': '0 0 0 6px rgb(47 107 255 / 0.14)',
  '--pl-engrave': '0 1px 0 rgb(255 255 255 / 0.9), 0 -1px 0 rgb(0 0 0 / 0.28)',
  '--pl-glass-shadow': 'inset 0 1px 0 var(--pl-glass-edge), 0 8px 24px rgb(12 12 16 / 0.1)',
  '--pl-glass-filter': 'blur(18px) saturate(1.7)',
};

/** Courbes nommées (process-style.md §2 « Easings ») : [nom CSS, cubic-bezier, usage]. */
export const curves: [string, [number, number, number, number], string][] = [
  ['out-soft', [0.2, 0.8, 0.2, 1], 'Apparitions, cartes, listes'],
  ['out-expo', [0.22, 1, 0.36, 1], 'Accordéons, slides, gros éléments'],
  ['ios', [0.32, 0.72, 0, 1], 'Sheets, drawers, indicateur d’onglets'],
  ['spring-sm', [0.2, 1.2, 0.4, 1], 'Hover, press, pop de badges'],
  ['spring-md', [0.2, 1.4, 0.4, 1], 'Retour de press des boutons'],
  ['spring-back', [0.34, 1.56, 0.64, 1], 'Entrée avec overshoot et flou'],
  ['inout', [0.65, 0, 0.35, 1], 'Boucles d’échange (swap)'],
  ['slow-settle', [0.16, 1, 0.3, 1], 'Grosses transitions de scène (1,3 s)'],
  ['press', [0.3, 1.4, 0.5, 1], 'Rebond court des petits contrôles (200 ms)'],
  ['drift', [0.3, 0.5, 0.4, 1], 'Boucles lentes (vagues de pixels 11–17 s)'],
];

export const durations: [string, number][] = [
  ['press', 120],
  ['hover', 220],
  ['enter', 450],
  ['card', 800],
  ['settle', 1300],
  ['ambient', 12000],
  ['marquee', 70000],
];

export const motionVars = (): Record<string, string> => ({
  ...Object.fromEntries(curves.map(([name, b]) => [`--pl-ease-${name}`, `cubic-bezier(${b.join(', ')})`])),
  ...Object.fromEntries(durations.map(([name, ms]) => [`--pl-dur-${name}`, `${ms}ms`])),
});

const block = (selector: string, vars: Record<string, string>) =>
  `${selector} {\n${Object.entries(vars)
    .map(([k, v]) => `  ${k}: ${v};`)
    .join('\n')}\n}`;

/** tokens.css : variables seules, sans Tailwind. */
export function tokensCss(): string {
  return [
    '/* Thème Saas premium UI : tokens (généré depuis authored/saas-premium-ui/tokens.ts, npm run import:authored). */',
    '/* Style seulement : aucun asset, logo ni texte repris du site analysé. */',
    '',
    block(':root', { ...palette, ...semanticLight, ...typography, ...radius, ...shadows, ...motionVars() }),
    '',
    '/* Compatibilité shadcn (recoloration des composants d’autres sources). */',
    block(':root', compatLight),
    '',
    '/* Blocs sombres (sections noires) et mode sombre global. */',
    block('.pl-dark,\n[data-theme="dark"],\n.dark', { ...semanticDark, ...compatDark }),
    '',
    '/* Bloc clair à l’intérieur d’une page sombre. */',
    block('.pl-light', { ...semanticLight, ...compatLight }),
    '',
  ].join('\n');
}

/** meta.tokens : lu par le builder (aperçu, éditeur de thème), /api/skin.css et get_theme. */
export function themeTokens() {
  return {
    colors: {
      light: { ...palette, ...semanticLight, ...compatLight },
      dark: { ...semanticDark, ...compatDark },
    },
    typography,
    radius,
    easings: curves.map(([name]) => `--pl-ease-${name}`),
    other: { ...shadows, ...motionVars() },
  };
}
