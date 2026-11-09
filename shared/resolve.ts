/**
 * Résolution des imports du code importé, commune aux aperçus (previews/vite.config.ts), au bundle
 * (MCP, CLI, registre shadcn) : alias propres à chaque source, fichiers d'autres items de la même
 * source, helper `cn` partagé, primitives shadcn/ui en repli.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './paths.js';
import type { Meta } from './schema.js';

export type Aliases = Record<string, string>;
export const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '/index.tsx', '/index.ts', '/index.js'];

/** Alias déclarés dans importers/sources.json (+ démos Atlas vendorisées). */
export function loadAliases(): Record<string, Aliases> {
  const map: Record<string, Aliases> = { 'magic-ui': { '@/': 'demos/src/' }, 'motion-primitives': { '@/': 'demos/src/' } };
  const file = path.join(ROOT, 'importers', 'sources.json');
  if (!fs.existsSync(file)) return map;
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const s of cfg.github ?? []) {
    if (s.aliases) map[s.id] = { ...map[s.id], ...s.aliases };
    for (const v of s.variants ?? []) if (v.aliases) map[v.id] = { ...map[v.id], ...v.aliases };
  }
  return map;
}

export interface FileRef { itemId: string; sourceId: string; rel: string; abs: string; role: string }

export interface ResolveContext {
  aliases: Record<string, Aliases>;
  /** Par source : chemin d'origine → fichier du premier item qui le déclare. */
  files: Map<string, Map<string, FileRef>>;
  /** Par item : ses propres fichiers (prioritaires sur ceux des autres items de la source). */
  items: Map<string, Map<string, FileRef>>;
}

/** Index des fichiers du registre par source et par item. */
export function buildContext(metas: { meta: Meta; dir: string }[], aliases = loadAliases()): ResolveContext {
  const files = new Map<string, Map<string, FileRef>>();
  const items = new Map<string, Map<string, FileRef>>();
  for (const { meta, dir } of metas) {
    const bySource = files.get(meta.sourceId) ?? new Map<string, FileRef>();
    const own = new Map<string, FileRef>();
    for (const f of meta.files) {
      const ref = { itemId: meta.id, sourceId: meta.sourceId, rel: f.path, abs: path.join(dir, 'files', f.path), role: f.role };
      own.set(f.path, ref);
      if (!bySource.has(f.path)) bySource.set(f.path, ref);
    }
    files.set(meta.sourceId, bySource);
    items.set(meta.id, own);
  }
  return { aliases, files, items };
}

export type Resolution =
  | { kind: 'file'; ref: FileRef }
  | { kind: 'cn' }
  | { kind: 'package'; name: string }
  | { kind: 'missing'; spec: string };

function lookup(ctx: ResolveContext, source: string, rel: string): FileRef | undefined {
  const map = ctx.files.get(source);
  for (const ext of EXTENSIONS) { const hit = map?.get(rel + ext); if (hit) return hit; }
  return undefined;
}

export const packageName = (spec: string) => (spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);

/** Replis communs : helper cn, primitives et hooks shadcn qu'une source importe sans les fournir. */
function shared(ctx: ResolveContext, target: string): Resolution | undefined {
  if (/(^|\/)lib\/utils$/.test(target)) return { kind: 'cn' };
  const primitive = target.match(/(?:^|\/)(ui|hooks)\/([\w.-]+)$/);
  const ref = primitive ? lookup(ctx, 'shadcn', `${primitive[1]}/${primitive[2]}`) : undefined;
  return ref ? { kind: 'file', ref } : undefined;
}

/** Dossiers parents d'un fichier, du plus proche à la racine ('' en dernier). */
function ancestors(rel: string): string[] {
  const out: string[] = [];
  let dir = path.posix.dirname(rel);
  while (dir && dir !== '.') { out.push(dir); dir = path.posix.dirname(dir); }
  return [...out, ''];
}

/** Premier candidat trouvé : d'abord dans les fichiers de l'item lui-même, puis dans toute la source. */
function firstHit(ctx: ResolveContext, source: string, candidates: string[], itemId: string): FileRef | undefined {
  for (const map of [ctx.items.get(itemId), ctx.files.get(source)]) {
    if (!map) continue;
    for (const c of candidates) for (const ext of EXTENSIONS) { const hit = map.get(c + ext); if (hit) return hit; }
  }
  return undefined;
}

const cnOnlyCache = new Map<string, boolean>();

/** Fichier utils qui n'exporte que le helper cn (identique d'une source à l'autre) : fusionné en un seul lib/utils.ts. */
export function isCnOnly(ref: FileRef, read: (abs: string) => string): boolean {
  if (!/(^|\/)(lib\/)?utils\.(ts|js)$/.test(ref.rel)) return false;
  let hit = cnOnlyCache.get(ref.abs);
  if (hit === undefined) {
    const code = read(ref.abs);
    const exported = [...code.matchAll(/export\s+(?:default\s+)?(?:async\s+)?(?:function|const|let|var|class)\s+(\w+)|export\s*\{([^}]*)\}/g)].flatMap((m) => (m[1] ? [m[1]] : m[2].split(',').map((s) => s.trim().split(/\s+as\s+/).pop()!).filter(Boolean)));
    hit = exported.length === 1 && exported[0] === 'cn';
    cnOnlyCache.set(ref.abs, hit);
  }
  return hit;
}

export function resolveImport(ctx: ResolveContext, spec: string, from: { itemId: string; sourceId: string; rel: string }): Resolution {
  if (spec === 'cn') return { kind: 'cn' };
  const clean = spec.split('?')[0];
  if (clean.startsWith('.')) {
    const ref = firstHit(ctx, from.sourceId, [path.posix.normalize(path.posix.join(path.posix.dirname(from.rel), clean))], from.itemId);
    return ref ? { kind: 'file', ref } : { kind: 'missing', spec };
  }
  const aliases = ctx.aliases[from.sourceId] ?? {};
  const alias = Object.keys(aliases).sort((a, b) => b.length - a.length).find((a) => clean.startsWith(a));
  const generic = clean.match(/^[@~#]\//)?.[0];
  if (alias !== undefined || generic) {
    const rest = clean.slice((alias ?? generic)!.length);
    // Cible déclarée, puis la racine du projet d'origine supposée parmi les dossiers parents du fichier.
    const candidates = [...(alias !== undefined ? [aliases[alias] + rest] : []), ...ancestors(from.rel).map((d) => (d ? `${d}/${rest}` : rest))];
    const ref = firstHit(ctx, from.sourceId, candidates, from.itemId);
    if (ref) return { kind: 'file', ref };
    return shared(ctx, rest) ?? { kind: 'missing', spec };
  }
  return { kind: 'package', name: packageName(clean) };
}

/** Spécifieurs d'import d'un fichier, avec leur position pour la réécriture. */
export const IMPORT_SPEC = /((?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?|import\s*\(\s*|require\s*\(\s*|@import\s+(?:url\()?)(['"])([^'"\n]+)\2/g;

