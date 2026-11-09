/**
 * Port TypeScript de catalog.py + curation.py pour les outils historiques
 * (list_sources, search_components, recommend_components) : mêmes scores, filtres et ordre.
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from '../shared/paths.js';
import { classifyCatalog, matches, normalize } from '../shared/taxonomy.js';

export const KINDS = ['', 'Composant', 'Bloc', 'Animation', 'Référence visuelle'] as const;

interface CatalogComponent { id: string; name: string; url: string; kind: string; source?: string; verified?: boolean; documented?: boolean; accessibility?: boolean; [k: string]: unknown }
interface CatalogSource { id: string; name: string; url: string; category: string; status: string; components: CatalogComponent[]; [k: string]: unknown }

const readJson = (file: string) => JSON.parse(fs.readFileSync(file, 'utf8'));

export function loadCatalog(): { updated: string | null; sources: CatalogSource[] } {
  const catalog = readJson(path.join(DATA, 'catalog.json'));
  const refs = path.join(DATA, 'reference_sources.json');
  if (fs.existsSync(refs)) {
    const additions: CatalogSource[] = readJson(refs);
    const ids = new Set(additions.map((s) => s.id));
    catalog.sources = [...catalog.sources.filter((s: CatalogSource) => !ids.has(s.id)), ...additions];
  }
  return catalog;
}

export function rank(component: Record<string, unknown>, query = '') {
  let score = 0;
  const reasons: string[] = [];
  if (component.verified) { score += 40; reasons.push('Page de documentation accessible (+40)'); }
  if (component.documented) { score += 20; reasons.push('Exemple de code détecté (+20)'); }
  if (component.accessibility) { score += 10; reasons.push('Accessibilité mentionnée dans la documentation (+10)'); }
  const classified = classifyCatalog(component as CatalogComponent & { source?: string });
  const haystack = normalize([classified.search_terms, String(component.kind ?? '')].join(' '));
  if (normalize(query).split(/\s+/).filter(Boolean).length && matches(query, haystack)) { score += 30; reasons.push('Correspond à tous les termes recherchés (+30)'); }
  return { ...classified, score, reasons };
}

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

export function search({ query = '', source = '', kind = '', verified_only = false, limit = 2000 }: { query?: string; source?: string; kind?: string; verified_only?: boolean; limit?: number }) {
  const result = [];
  for (const library of loadCatalog().sources) {
    if (source && library.id !== source) continue;
    for (const raw of library.components) {
      const item = rank({ ...raw, source: library.name, source_id: library.id }, query);
      if (kind && item.kind !== kind) continue;
      if (verified_only && !item.verified) continue;
      if (query && !matches(query, item.search_terms + ' ' + item.kind)) continue;
      result.push(item);
    }
  }
  return result
    .sort((a, b) => b.score - a.score || cmp(String(a.source).toLowerCase(), String(b.source).toLowerCase()) || cmp(String(a.name).toLowerCase(), String(b.name).toLowerCase()))
    .slice(0, limit);
}

export function enrich<T extends { id: string }>(components: T[]) {
  const file = path.join(DATA, 'curation.json');
  const curation: { id: string }[] = fs.existsSync(file) ? readJson(file) : [];
  const choices = new Map(curation.map((c, order) => [c.id, { ...c, order }]));
  return components.map((c) => ({ ...c, curation: choices.get(c.id) ?? null }));
}

export function listSources() {
  return loadCatalog().sources.map(({ components, ...s }) => ({ ...s, component_count: components.length }));
}

export function recommend(args: { query?: string; source?: string; kind?: string; verified_only?: boolean; limit?: number }) {
  const { limit = 6, ...rest } = args;
  const data = enrich(search({ ...rest, limit: 10000 }));
  data.sort((a, b) => ((a.curation as { order: number } | null)?.order ?? 9999) - ((b.curation as { order: number } | null)?.order ?? 9999) || b.score - a.score || cmp(String(a.name), String(b.name)));
  return data.slice(0, limit);
}
