import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

/** Racine du repo : ATLAS_ROOT, sinon premier parent contenant registry/ et package.json. */
function findRoot(): string {
  if (process.env.ATLAS_ROOT) return path.resolve(process.env.ATLAS_ROOT);
  let dir = path.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'shared'))) return dir;
    dir = path.dirname(dir);
  }
  throw new Error('Racine Component Atlas introuvable (définir ATLAS_ROOT).');
}

export const ROOT = findRoot();
export const REGISTRY = path.join(ROOT, 'registry');
export const SPECS = path.join(ROOT, 'specs');
export const PRESETS = path.join(SPECS, 'presets');
/** Versions précédentes des specs (une copie par enregistrement ou suppression). */
export const SPEC_HISTORY = path.join(SPECS, '.history');
export const CACHE = path.join(ROOT, '.cache', 'sources');
export const DATA = path.join(ROOT, 'data');
export const WEB = path.join(ROOT, 'web');
/** Vignettes produites par l'audit des aperçus (gitignorées, regénérables). */
export const THUMBS = path.join(WEB, 'thumbs');

export const KIND_DIRS = {
  component: 'items',
  section: 'items',
  screen: 'items',
  lib: 'items',
  theme: 'themes',
  font: 'fonts',
  easing: 'easings',
  sound: 'sounds',
} as const;

/** Refuse tout chemin qui sortirait du dossier parent (fichiers issus de sources externes). */
export function safeJoin(base: string, rel: string): string {
  const target = path.resolve(base, rel);
  const relative = path.relative(base, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Chemin refusé : ${rel}`);
  return target;
}

export const toPosix = (p: string) => p.split(path.sep).join('/');
