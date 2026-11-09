/** Lecture du registre et des specs pour le serveur MCP (relu quand il change : les imports sont pris en compte sans redémarrage). */
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY } from '../shared/paths.js';
import { allMeta, indexItems, readFiles } from '../shared/registry.js';
import type { IndexEntry, Meta } from '../shared/schema.js';
import { loadAudit, previewsBuilt, previewState, type PreviewState } from '../shared/interactive.js';
import { matches, normalize, VOCAB } from '../shared/taxonomy.js';

export { getSpec, listSpecs, saveSpec, specHistory, type StoredSpec } from '../shared/specs.js';

/** Entrées de l'index avec textes de licence complets. */
export const index = (): IndexEntry[] => indexItems();

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

/** État d'aperçu : « interactive » = démo Atlas ou aperçu live validé par l'audit pour le code actuel. */
export function previewOf(entry: IndexEntry): PreviewState {
  return previewState(entry, loadAudit(), previewsBuilt());
}

const haystack = (e: IndexEntry) => normalize([e.id, e.name, e.description, e.category, VOCAB[e.category] ?? '', e.type, e.source, e.framework, ...e.tags].join(' '));

export interface SearchArgs {
  query?: string; type?: string; framework?: string; source?: string; category?: string;
  license_status?: string; tags?: string[]; interactive_only?: boolean; limit?: number;
}

/**
 * Recherche : filtres stricts, puis score (nom > catégorie, tags > description).
 * À score égal, les items interactifs (vérifiés visuellement) passent devant.
 */
export function searchRegistry(args: SearchArgs) {
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
  return rows
    .map((e) => ({ e, s: score(e), state: previewOf(e) }))
    .filter((r) => !args.interactive_only || r.state === 'interactive')
    .sort((a, b) => b.s - a.s || Number(b.state === 'interactive') - Number(a.state === 'interactive') || a.e.name.localeCompare(b.e.name))
    .slice(0, args.limit ?? 30)
    .map(({ e, state }) => ({ ...e, previewState: state, interactive: state === 'interactive' }));
}
