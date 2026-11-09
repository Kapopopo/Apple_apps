/**
 * Données des pages : galerie du catalogue (44 démos Atlas + composants interactifs du registre)
 * et index du registre enrichi (interactivité, vignettes, textes de licence restaurés).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA } from '../shared/paths.js';
import { hydrate, loadIndex } from '../shared/registry.js';
import type { IndexEntry } from '../shared/schema.js';
import { loadAudit, previewsBuilt, previewState, thumbUrl } from '../shared/interactive.js';
import { normalize, VOCAB } from '../shared/taxonomy.js';

export const readIndex = () => loadIndex();

export interface EnrichedEntry extends IndexEntry { interactive: boolean; previewState: string; thumb?: string }

/** Index pour le builder : chaque item avec son état d'aperçu et sa vignette. */
export function registryPayload() {
  const index = readIndex();
  const audit = loadAudit(), built = previewsBuilt();
  const items: EnrichedEntry[] = index.items.map((e) => {
    const state = previewState(e, audit, built);
    const thumb = state === 'interactive' ? thumbUrl(e, audit) : undefined;
    return { ...e, interactive: state === 'interactive', previewState: state, ...(thumb ? { thumb } : {}) };
  });
  return { generatedAt: index.generatedAt, count: items.length, previewsBuilt: built, audited: !!audit, sources: index.sources, items };
}

interface Curated { id: string; demo: string; category: string; interaction: string; usage: string; reason: string; source_url: string; code_source: string; license: string; integration: string }

/**
 * Galerie du catalogue. Identifiant = id du registre pour tout le monde (panier commun avec le builder) ;
 * les 44 fiches Atlas gardent `catalog_id` pour migrer les anciennes sélections.
 */
export function cataloguePayload() {
  const { items, sources, previewsBuilt: built, audited } = registryPayload();
  const curationFile = path.join(DATA, 'curation.json');
  const curation: Curated[] = fs.existsSync(curationFile) ? JSON.parse(fs.readFileSync(curationFile, 'utf8')) : [];
  const byCatalog = new Map(items.filter((e) => e.catalogId).map((e) => [e.catalogId!, e]));
  const terms = (e: IndexEntry) => normalize([e.name, e.source, e.category, VOCAB[e.category] ?? '', e.description, e.tags.join(' '), e.type].join(' '));
  const card = (e: EnrichedEntry) => {
    const full = hydrate(e, sources);
    return {
      id: e.id, registry_id: e.id, name: e.name, source: e.source, source_id: e.sourceId, kind: 'Composant', item_type: e.type,
      type_label: e.category, url: e.sourceUrl, description: e.description, tags: e.tags, license: e.license, license_status: e.licenseStatus,
      attribution: full.attribution, dependencies: e.dependencies, search_terms: terms(e), group: e.group, isNew: !!e.isNew, importedAt: e.importedAt,
      ...(e.thumb ? { thumb: e.thumb } : {}),
    };
  };
  const curated = curation.flatMap((c, order) => {
    const e = byCatalog.get(c.id);
    return e ? [{ ...card(e), catalog_id: c.id, url: c.source_url, description: c.reason, registry: false, curation: { ...c, order } }] : [];
  });
  const others = items.filter((e) => e.interactive && !e.catalogId && ['component', 'section', 'screen'].includes(e.type)).map((e) => ({ ...card(e), registry: true, curation: null }));
  const all = [...curated, ...others];
  const counts = new Map<string, { id: string; name: string; components: number }>();
  for (const c of all) { const s = counts.get(c.source_id) ?? { id: c.source_id, name: c.source, components: 0 }; s.components++; counts.set(c.source_id, s); }
  return { components: all, sources: [...counts.values()].sort((a, b) => a.name.localeCompare(b.name)), previewsBuilt: built, audited };
}
