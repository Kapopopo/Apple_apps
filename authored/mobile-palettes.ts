/** Palettes du template mobile-base, publiées comme thèmes (tokens shadcn) et tirées par « Varier ». */
import type { ThemeTokens } from '../shared/schema.js';
import { schemeOf } from '../web/lib/palette.js';

interface Palette {
  slug: string;
  name: string;
  /** fond, texte, primaire */
  light: [string, string, string];
  dark: [string, string, string];
  radius: number;
}

export const PALETTES: Palette[] = [
  { slug: 'encre', name: 'Encre', light: ['#ffffff', '#15171c', '#1b1f2a'], dark: ['#101216', '#eef0f4', '#e4e7ee'], radius: 12 },
  { slug: 'braise', name: 'Braise', light: ['#fff8f4', '#33160c', '#b8380f'], dark: ['#1c100c', '#fbe9e1', '#ff8a5c'], radius: 22 },
  { slug: 'foret', name: 'Forêt', light: ['#f3f6ef', '#14261a', '#24603a'], dark: ['#0e1811', '#e3efe3', '#86d19b'], radius: 8 },
  { slug: 'lagon', name: 'Lagon', light: ['#f0fbfb', '#0b2b30', '#0b6b74'], dark: ['#07191c', '#dff5f6', '#4fd3dc'], radius: 28 },
  { slug: 'cobalt', name: 'Cobalt', light: ['#f7f9ff', '#101a3a', '#1d45c9'], dark: ['#0a0f22', '#e6ebff', '#8ea8ff'], radius: 14 },
  { slug: 'prune', name: 'Prune', light: ['#faf5f9', '#2c1229', '#7a2370'], dark: ['#190d18', '#f6e6f3', '#e48ad6'], radius: 18 },
  { slug: 'moutarde', name: 'Moutarde', light: ['#fffbea', '#2d2508', '#e3b108'], dark: ['#1a1708', '#f8f0cf', '#f2c93a'], radius: 4 },
  { slug: 'framboise', name: 'Framboise', light: ['#fff5f7', '#3a0d1c', '#b4164b'], dark: ['#1e0b12', '#fde4ec', '#ff7aa5'], radius: 24 },
  { slug: 'ardoise', name: 'Ardoise', light: ['#eef1f3', '#1c262d', '#3b5565'], dark: ['#11171b', '#dde5ea', '#9dbccc'], radius: 2 },
  { slug: 'citron', name: 'Citron vert', light: ['#fafcf2', '#1b2409', '#b5e03a'], dark: ['#12160a', '#eef6d8', '#c5ef4f'], radius: 16 },
  { slug: 'argile', name: 'Argile', light: ['#f7efe6', '#3b271c', '#8f4a2f'], dark: ['#1d1510', '#f1e2d4', '#dfa07e'], radius: 10 },
  { slug: 'menthe', name: 'Menthe', light: ['#f2fbf6', '#0f2b20', '#8fe3bd'], dark: ['#0c1813', '#dcf5e9', '#8fe3bd'], radius: 20 },
  { slug: 'nuit', name: 'Nuit', light: ['#111225', '#eceafd', '#b9a6ff'], dark: ['#090a17', '#eceafd', '#b9a6ff'], radius: 16 },
  { slug: 'carbone', name: 'Carbone', light: ['#141414', '#f2f2f2', '#ff6b3d'], dark: ['#050505', '#f2f2f2', '#ff6b3d'], radius: 6 },
  { slug: 'ciel', name: 'Ciel', light: ['#f1f8ff', '#0c2742', '#9bd0ff'], dark: ['#081522', '#dceeff', '#9bd0ff'], radius: 26 },
  { slug: 'olive', name: 'Olive', light: ['#f6f5e9', '#26270f', '#5b5f1e'], dark: ['#15160c', '#eeeed6', '#c4c96a'], radius: 0 },
];

const scheme = ([background, foreground, primary]: [string, string, string]) => schemeOf({ background, foreground, primary });

export const paletteTokens = (p: Palette): ThemeTokens => ({
  colors: { light: scheme(p.light), dark: scheme(p.dark) },
  typography: {},
  radius: { '--radius': `${p.radius}px` },
  easings: [],
  other: {},
});
