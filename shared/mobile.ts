/**
 * Spec mobile → fichiers de config du template mobile-base (src/config/app.ts, theme.json, fonts.ts).
 * Partagé par scaffold et le MCP (get_template). Tout texte de la spec passe par JSON.stringify.
 */
import { mobileDefaults, supports, TEMPLATE_ID } from '../web/lib/mobile.js';
import { metaOf } from './bundle.js';
import { nativeColors, nativeTheme, type NativeTheme } from './native-theme.js';
import { indexItems } from './registry.js';
import type { Meta, Mobile, Spec, ThemeTokens } from './schema.js';
import { normalize } from './taxonomy.js';

export { TEMPLATE_ID };
export const DEFAULT_THEME = 'mobile-base/encre';

export interface AppSpec {
  name: string;
  title?: string;
  mobile?: Mobile;
}

/** Identité de l'app : les champs vides sont déduits de la spec, avec un bundle id d'exemple bloqué en production. */
export function appIdentity(spec: AppSpec) {
  const m = spec.mobile ?? (mobileDefaults() as Mobile);
  const slug =
    m.slug ||
    normalize(spec.name)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'mon-app';
  const compact = slug.replace(/-/g, '');
  const scheme = /^[a-z]/.test(compact) ? compact : `app${compact}`;
  return {
    name: m.appName.trim() || spec.title?.trim().slice(0, 30) || spec.name.slice(0, 30),
    slug,
    scheme,
    bundleId: m.bundleId || `com.example.${scheme}`,
  };
}

export function appConfigSource(spec: AppSpec): string {
  const m = spec.mobile ?? (mobileDefaults() as Mobile);
  const { name, slug, scheme, bundleId } = appIdentity(spec);
  const config = {
    name,
    slug,
    scheme,
    version: '1.0.0',
    bundleId,
    iosAppId: m.iosAppId,
    supportEmail: m.supportEmail,
    termsUrl: m.termsUrl,
    privacyUrl: m.privacyUrl,
    revenueCat: m.revenueCat,
    trial: m.trial,
    layouts: { onboarding: m.layouts.onboarding, paywall: m.layouts.paywall },
    onboarding: { slides: m.slides, questions: m.questions },
    paywall: m.paywall,
  };
  return [
    "import type { AppConfig } from './types';",
    '',
    '// Config de l’app, générée depuis la spec Atlas au démarrage du projet. À modifier ici ensuite.',
    `export const appConfig: AppConfig = ${JSON.stringify(config, null, 2)};`,
    '',
  ].join('\n');
}

/** Police à télécharger au scaffold : un TTF par graisse retenue. */
export interface FontDownload {
  family: string;
  slug: string;
  weight: number;
  /** Chemin dans le projet. */
  path: string;
}

interface Faces {
  fonts: NonNullable<NativeTheme['fonts']> | null;
  assets: [family: string, file: string][];
  downloads: FontDownload[];
}

function fontFaces(sans: Meta | undefined, display: Meta | undefined): Faces {
  if (!sans?.font) return { fonts: null, assets: [], downloads: [] };
  const downloads = new Map<string, FontDownload>();
  const file = (meta: Meta, wanted: number) => {
    const font = meta.font!;
    if (!/^[a-z0-9-]+$/.test(font.slug)) throw new Error(`Nom de police invalide : ${font.slug}`);
    // weight 1 = fichier variable, que React Native ne sait pas décliner.
    const weights = font.styles.filter((s) => !s.italic && s.weight >= 100).map((s) => s.weight);
    const weight = weights.sort((a, b) => Math.abs(a - wanted) - Math.abs(b - wanted) || b - a)[0] ?? 400;
    const target = `assets/fonts/${font.slug}-${weight}.ttf`;
    downloads.set(target, { family: font.family, slug: font.slug, weight, path: target });
    return target;
  };
  const fonts = { sans: 'AppSans', medium: 'AppSans-Medium', bold: 'AppSans-Bold', display: 'AppDisplay' };
  const assets: [string, string][] = [
    [fonts.sans, file(sans, 400)],
    [fonts.medium, file(sans, 500)],
    [fonts.bold, file(sans, 700)],
    [fonts.display, file(display?.font ? display : sans, 700)],
  ];
  return { fonts, assets, downloads: [...downloads.values()] };
}

export function fontsSource(assets: Faces['assets']): string {
  const entries = assets.map(([family, file]) => `  '${family}': require('../../${file}'),\n`).join('');
  return [
    '// Polices embarquées (licence : assets/fonts/OFL.txt). Vide = police système.',
    assets.length
      ? `export const fontAssets: Record<string, number> = {\n${entries}};`
      : 'export const fontAssets: Record<string, number> = {};',
    '',
  ].join('\n');
}

export interface MobileApp {
  files: { path: string; content: string }[];
  downloads: FontDownload[];
  /** Choix de la spec sans équivalent natif, laissés de côté. */
  ignored: string[];
}

/** Fichiers de config à partir d'une app, de ses tokens et de ses polices (sans lire le registre). */
export function configFiles(spec: AppSpec, tokens: ThemeTokens, sans?: Meta, display?: Meta) {
  const { fonts, assets, downloads } = fontFaces(sans, display);
  const spacing = spec.mobile?.layouts.spacing ?? 'normal';
  return {
    downloads,
    files: [
      { path: 'src/config/app.ts', content: appConfigSource(spec) },
      { path: 'src/config/theme.json', content: JSON.stringify(nativeTheme(tokens, spacing, fonts), null, 2) + '\n' },
      { path: 'src/config/fonts.ts', content: fontsSource(assets) },
    ],
  };
}

export function mobileApp(spec: Spec): MobileApp {
  const ignored: string[] = [];
  const entries = new Map(indexItems().map((e) => [e.id, e]));

  let tokens = metaOf(DEFAULT_THEME)?.tokens;
  if (spec.theme) {
    const chosen = metaOf(spec.theme)?.tokens;
    if (chosen && nativeColors(chosen)) tokens = chosen;
    else ignored.push(`${spec.theme} (thème non convertible en natif : palette Encre à la place)`);
  }
  if (!tokens) throw new Error(`Palette par défaut absente du registre (${DEFAULT_THEME}) : lancer npm run import:authored.`);

  const fonts: Meta[] = [];
  for (const id of spec.fonts) {
    const meta = metaOf(id);
    if (!meta?.font || !supports(entries.get(id), 'mobile')) ignored.push(`${id} (police non embarquable : licence non ouverte)`);
    else if (fonts.length < 2) fonts.push(meta);
    else ignored.push(`${id} (deux polices au plus : texte et titres)`);
  }
  for (const id of spec.sounds) ignored.push(`${id} (son web only)`);
  if (spec.template && spec.template !== TEMPLATE_ID) ignored.push(`${spec.template} (template web : mobile-base à la place)`);

  return { ...configFiles(spec, tokens, fonts[0], fonts[1]), ignored };
}
