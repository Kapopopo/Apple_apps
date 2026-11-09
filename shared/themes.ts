/**
 * Thèmes personnels (registry/themes/perso/<slug>/) créés depuis le builder, et feuille « skin »
 * générée depuis les tokens d'un thème pour recolorer les aperçus (tokens shadcn et dérivés).
 */
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY } from './paths.js';
import { itemDir, removeFromIndex, upsertIndex, writeItem, readMeta } from './registry.js';
import type { Meta, ThemeTokens } from './schema.js';
import { normalize } from './taxonomy.js';

const VAR_NAME = /^--[a-z0-9-]{1,40}$/;
const SAFE_VALUE = /^[#(),.%\w\s\-/]{1,100}$/;

/** Valeur de custom property sûre : pas de point-virgule, accolade, guillemet ni commentaire CSS. */
export const safeValue = (v: unknown): v is string => typeof v === 'string' && SAFE_VALUE.test(v) && !v.includes('/*');

function declarations(vars: Record<string, string>): string {
  return Object.entries(vars).filter(([k, v]) => VAR_NAME.test(k) && safeValue(v)).map(([k, v]) => `  ${k}: ${v};`).join('\n');
}

/** Feuille CSS ne contenant que des custom properties, appliquée après le thème d'origine de l'aperçu. */
export function skinCss(tokens: ThemeTokens): string {
  const light = { ...tokens.other, ...tokens.typography, ...tokens.radius, ...tokens.colors.light };
  const dark = tokens.colors.dark;
  return [
    '/* Skin Atlas : tokens du thème choisi, appliqués par-dessus le thème d\'origine du composant. */',
    `:root {\n${declarations(light)}\n}`,
    Object.keys(dark).length ? `.dark, [data-theme="dark"] {\n${declarations(dark)}\n}` : '',
  ].filter(Boolean).join('\n\n') + '\n';
}

export interface ThemeInput { name: string; light: Record<string, string>; dark?: Record<string, string>; radius?: string; fontFamily?: string; base?: string }
export type ThemeResult = { ok: true; meta: Meta } | { ok: false; status: number; error: string };

const slugify = (s: string) => normalize(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

function cleanVars(vars: unknown): Record<string, string> | null {
  if (!vars || typeof vars !== 'object' || Array.isArray(vars)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (!VAR_NAME.test(k) || !safeValue(v)) return null;
    out[k] = v.trim();
  }
  return Object.keys(out).length <= 80 ? out : null;
}

export function createTheme(raw: unknown, { overwrite = false } = {}): ThemeResult {
  const input = raw as Partial<ThemeInput>;
  if (!input || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 60) return { ok: false, status: 400, error: 'Nom de thème requis (60 caractères maximum)' };
  const slug = slugify(input.name);
  if (!slug) return { ok: false, status: 400, error: 'Nom de thème invalide' };
  const light = cleanVars(input.light), dark = input.dark === undefined ? {} : cleanVars(input.dark);
  if (!light || !dark) return { ok: false, status: 400, error: 'Couleurs invalides : noms --token et valeurs CSS simples uniquement' };
  if (input.radius !== undefined && !safeValue(input.radius)) return { ok: false, status: 400, error: 'Rayon invalide' };
  if (input.fontFamily !== undefined && (typeof input.fontFamily !== 'string' || !/^[\w\s-]{1,60}$/.test(input.fontFamily))) return { ok: false, status: 400, error: 'Police invalide' };
  const id = `perso/${slug}`;
  if (readMeta(itemDir(id, 'theme')) && !overwrite) return { ok: false, status: 409, error: `Le thème « ${input.name} » existe déjà` };
  const tokens: ThemeTokens = {
    colors: { light, dark },
    typography: input.fontFamily ? { '--font-sans': `'${input.fontFamily}', ui-sans-serif, system-ui, sans-serif` } : {},
    radius: input.radius ? { '--radius': input.radius } : {},
    easings: [],
    other: {},
  };
  const css = skinCss(tokens);
  writeItem({
    id, name: input.name.trim(), type: 'theme', category: 'Thèmes', tags: ['perso', 'tokens', ...(Object.keys(dark).length ? ['dark mode'] : [])],
    description: `Thème personnel${input.base ? ` dérivé de ${input.base}` : ''} : couleurs clair/sombre${input.radius ? ', rayon' : ''}${input.fontFamily ? `, police ${input.fontFamily}` : ''}.`,
    framework: 'agnostic', dependencies: [], registryDependencies: [],
    source: 'Personnel', sourceId: 'perso', sourceUrl: '',
    license: 'LicenseRef-Personnel', licenseStatus: 'open', licenseNotes: 'Création personnelle, libre d’usage dans tes projets.',
    files: [{ path: 'theme.css', role: 'theme' }], tokens, preview: { kind: 'none', reason: 'Thème personnel' },
  }, new Map([['theme.css', css]]));
  const dir = itemDir(id, 'theme');
  const meta = readMeta(dir)!;
  upsertIndex(meta, dir);
  return { ok: true, meta };
}

export function deleteTheme(id: string): boolean {
  if (!/^perso\/[a-z0-9-]+$/.test(id)) return false;
  const dir = itemDir(id, 'theme');
  if (!fs.existsSync(path.join(dir, 'meta.json'))) return false;
  fs.rmSync(dir, { recursive: true, force: true });
  removeFromIndex(id, REGISTRY);
  return true;
}
