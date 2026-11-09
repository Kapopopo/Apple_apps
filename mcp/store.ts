/** Lecture du registre et des specs pour le serveur MCP (relu à chaque appel : les imports sont pris en compte sans redémarrage). */
import fs from 'node:fs';
import path from 'node:path';
import { PRESETS, REGISTRY, SPECS, ROOT } from '../shared/paths.js';
import { allMeta, readFiles } from '../shared/registry.js';
import { Spec, type IndexEntry, type Meta } from '../shared/schema.js';
import { matches, normalize, VOCAB } from '../shared/taxonomy.js';

let cache: { mtime: number; items: IndexEntry[] } | null = null;

export function index(): IndexEntry[] {
  const file = path.join(REGISTRY, 'index.json');
  if (!fs.existsSync(file)) return [];
  const mtime = fs.statSync(file).mtimeMs;
  if (!cache || cache.mtime !== mtime) cache = { mtime, items: JSON.parse(fs.readFileSync(file, 'utf8')).items };
  return cache.items;
}

export function getEntry(id: string): IndexEntry | undefined {
  return index().find((e) => e.id === id);
}

export function getItem(id: string): { meta: Meta; dir: string } | undefined {
  const entry = getEntry(id);
  if (entry) {
    const dir = path.join(REGISTRY, entry.dir);
    const file = path.join(dir, 'meta.json');
    if (fs.existsSync(file)) return { meta: JSON.parse(fs.readFileSync(file, 'utf8')), dir };
  }
  return allMeta().find(({ meta }) => meta.id === id);
}

/** Fermeture transitive des registryDependencies, dans l'ordre d'installation (dépendances d'abord). */
export function dependencyClosure(id: string): { ids: string[]; missing: string[] } {
  const ordered: string[] = [];
  const missing: string[] = [];
  const visiting = new Set<string>();
  const visit = (current: string) => {
    if (ordered.includes(current) || visiting.has(current)) return;
    visiting.add(current);
    const item = getItem(current);
    if (!item) { missing.push(current); return; }
    for (const dep of item.meta.registryDependencies) visit(dep);
    ordered.push(current);
  };
  visit(id);
  return { ids: ordered.filter((x) => x !== id), missing };
}

export function itemFiles(id: string) {
  const item = getItem(id);
  return item ? readFiles(item.meta, item.dir) : [];
}

const haystack = (e: IndexEntry) => normalize([e.id, e.name, e.description, e.category, VOCAB[e.category] ?? '', e.type, e.source, e.framework, ...e.tags].join(' '));

export function searchRegistry(args: { query?: string; type?: string; framework?: string; source?: string; category?: string; license_status?: string; tags?: string[]; limit?: number }) {
  const q = normalize(args.query ?? '').split(/\s+/).filter(Boolean);
  const rows = index().filter((e) =>
    (args.type ? e.type === args.type : e.type !== 'lib') &&
    (!args.framework || e.framework === args.framework) &&
    (!args.source || e.sourceId === args.source || normalize(e.source) === normalize(args.source)) &&
    (!args.category || normalize(e.category) === normalize(args.category)) &&
    (!args.license_status || e.licenseStatus === args.license_status) &&
    (!args.tags?.length || args.tags.every((t) => e.tags.map(normalize).includes(normalize(t)))) &&
    (!q.length || matches(q.join(' '), haystack(e), true)));
  const score = (e: IndexEntry) => q.reduce((s, w) => s + (normalize(e.name).includes(w) ? 3 : 0) + (normalize(e.category).includes(w) ? 2 : 0) + (e.tags.some((t) => normalize(t).includes(w)) ? 2 : 0) + (normalize(e.description).includes(w) ? 1 : 0), 0);
  return rows.map((e) => ({ e, s: score(e) })).sort((a, b) => b.s - a.s || a.e.name.localeCompare(b.e.name)).slice(0, args.limit ?? 30).map(({ e }) => e);
}

export interface StoredSpec { spec: Spec; file: string; preset: boolean }

export function listSpecs(): StoredSpec[] {
  const out: StoredSpec[] = [];
  for (const [dir, preset] of [[SPECS, false], [PRESETS, true]] as const) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()) {
      try {
        out.push({ spec: Spec.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))), file: path.relative(ROOT, path.join(dir, f)).split(path.sep).join('/'), preset });
      } catch { /* fichier invalide : ignoré, signalé par list_specs */ }
    }
  }
  return out;
}

export function getSpec(name: string): StoredSpec | undefined {
  const clean = name.replace(/\.json$/, '');
  return listSpecs().find((s) => s.spec.name === clean) ;
}
