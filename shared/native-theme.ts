/** Thème du registre → tokens natifs de mobile-base (src/config/theme.json, lu par tailwind.config.js). */
import { mix, over, parseColor, readableOn, toHex, type Rgba } from './color.js';
import type { ThemeTokens } from './schema.js';

export type Palette = Record<string, string>;
export interface NativeTheme {
  colors: { light: Palette; dark: Palette };
  radius: number;
  spacing: Record<string, number>;
  /** Familles chargées par src/config/fonts.ts ; null = police système. */
  fonts: { sans: string; medium: string; bold: string; display: string } | null;
}

function palette(vars: Record<string, string>): Palette | null {
  const read = (name: string) => (vars[`--${name}`] === undefined ? null : parseColor(vars[`--${name}`], vars));
  const bg = read('background'),
    fg = read('foreground'),
    primary = read('primary');
  if (!bg || !fg || !primary) return null;
  const base = over(bg, [1, 1, 1, 1]);
  const get = (name: string, fallback: Rgba): Rgba => over(read(name) ?? fallback, base);
  const card = get('card', base),
    main = over(primary, base),
    secondary = get('secondary', mix(base, fg, 0.08)),
    accent = get('accent', mix(base, main, 0.14)),
    destructive = get('destructive', [0.78, 0.13, 0.13, 1]),
    border = get('border', mix(base, fg, 0.16));
  const colors: Record<string, Rgba> = {
    background: base,
    foreground: over(fg, base),
    card,
    'card-foreground': get('card-foreground', fg),
    popover: get('popover', card),
    'popover-foreground': get('popover-foreground', fg),
    primary: main,
    'primary-foreground': get('primary-foreground', readableOn(main)),
    secondary,
    'secondary-foreground': get('secondary-foreground', fg),
    muted: get('muted', mix(base, fg, 0.06)),
    'muted-foreground': get('muted-foreground', mix(fg, base, 0.3)),
    accent,
    'accent-foreground': get('accent-foreground', fg),
    destructive,
    'destructive-foreground': readableOn(destructive),
    border,
    input: get('input', border),
    ring: get('ring', main),
    success: get('success', [0.09, 0.55, 0.28, 1]),
    warning: get('warning', [0.78, 0.45, 0.04, 1]),
    info: get('info', [0.15, 0.42, 0.85, 1]),
  };
  return Object.fromEntries(Object.entries(colors).map(([name, c]) => [name, toHex(c)]));
}

/** null si le thème n'a pas les tokens shadcn de base dans une syntaxe convertible. */
export function nativeColors(tokens: ThemeTokens): NativeTheme['colors'] | null {
  const shared = { ...tokens.other, ...tokens.colors.light };
  const light = palette(shared);
  if (!light) return null;
  const dark = Object.keys(tokens.colors.dark).length ? palette({ ...shared, ...tokens.colors.dark }) : light;
  return dark ? { light, dark } : null;
}

function radiusPx(tokens: ThemeTokens): number {
  const raw = tokens.radius['--radius'] ?? tokens.other['--radius'] ?? tokens.colors.light['--radius'] ?? '';
  const m = raw.trim().match(/^([\d.]+)(px|rem)?$/);
  return m ? Math.min(40, Math.round(Number(m[1]) * (m[2] === 'rem' ? 16 : 1))) : 12;
}

const SCALE: Record<string, number> = { compact: 0.75, normal: 1, airy: 1.25 };
const STEPS = { tight: 8, stack: 16, pad: 16, gutter: 24, section: 32 };

export function nativeTheme(tokens: ThemeTokens, spacing: string, fonts: NativeTheme['fonts'] = null): NativeTheme {
  const colors = nativeColors(tokens);
  if (!colors) throw new Error('Thème non convertible en natif : tokens --background, --foreground et --primary attendus.');
  return {
    colors,
    radius: radiusPx(tokens),
    spacing: Object.fromEntries(Object.entries(STEPS).map(([name, px]) => [name, Math.round(px * (SCALE[spacing] ?? 1))])),
    fonts,
  };
}
