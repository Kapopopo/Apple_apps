/**
 * Données des pages : galerie du catalogue (44 démos Atlas + composants interactifs du registre)
 * et index du registre enrichi (interactivité, vignettes, textes de licence restaurés).
 */
import fs from 'node:fs';
import path from 'node:path';
import { DATA, REGISTRY } from '../shared/paths.js';
import { hydrate, loadIndex } from '../shared/registry.js';
import type { IndexEntry } from '../shared/schema.js';
import { loadAudit, previewsBuilt, previewState, thumbUrl } from '../shared/interactive.js';
import { enrichmentFor, loadEnrichment } from '../shared/enrichment.js';
import { normalize, VOCAB } from '../shared/taxonomy.js';

export const readIndex = () => loadIndex();

export interface EnrichedEntry extends IndexEntry {
  interactive: boolean;
  previewState: string;
  thumb?: string;
  screens?: TemplateScreen[];
  /** Enrichissement en français (npm run enrich), si à jour pour ce code. */
  descriptionFr?: string;
  usages?: string[];
  keywords?: string[];
}

/** Dernière vérification des sources (npm run outdated) : sources qui ont publié depuis leur commit verrouillé. */
function updates(): { checkedAt: string; behind: string[] } | null {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(REGISTRY, '_updates.json'), 'utf8'));
    return {
      checkedAt: String(raw.checkedAt ?? ''),
      behind: Array.isArray(raw.behind) ? raw.behind.filter((x: unknown) => typeof x === 'string') : [],
    };
  } catch {
    return null;
  }
}

export interface TemplateScreen {
  url: string;
  title: string;
  path: string;
  viewport: string;
}

/** Captures d'un template (npm run capture:templates), versionnées par leur date pour le cache navigateur. */
export function templateScreens(e: IndexEntry): TemplateScreen[] {
  const file = path.join(REGISTRY, e.dir, 'screens', 'screens.json');
  try {
    const v = Math.round(fs.statSync(file).mtimeMs).toString(36);
    const list: { file: string; title: string; path: string; viewport: string }[] = JSON.parse(fs.readFileSync(file, 'utf8'));
    return list.map((s) => ({
      url: `/template-screens/${e.sourceId}/${s.file}?v=${v}`,
      title: s.title,
      path: s.path,
      viewport: s.viewport,
    }));
  } catch {
    return [];
  }
}

/** Index pour le builder : chaque item avec son état d'aperçu et sa vignette. */
export function registryPayload() {
  const index = readIndex();
  const audit = loadAudit(),
    built = previewsBuilt(),
    enriched = loadEnrichment();
  const items: EnrichedEntry[] = index.items.map((e) => {
    const state = previewState(e, audit, built);
    const thumb = state === 'interactive' ? thumbUrl(e, audit) : undefined;
    const fr = enrichmentFor(e, enriched);
    return {
      ...e,
      interactive: state === 'interactive',
      previewState: state,
      ...(thumb ? { thumb } : {}),
      ...(fr ? { descriptionFr: fr.description, usages: fr.usages, keywords: fr.keywords } : {}),
      ...(e.type === 'template' ? { screens: templateScreens(e) } : {}),
    };
  });
  return {
    generatedAt: index.generatedAt,
    count: items.length,
    previewsBuilt: built,
    audited: !!audit,
    updates: updates(),
    sources: index.sources,
    items,
  };
}

interface Curated {
  id: string;
  demo: string;
  category: string;
  interaction: string;
  usage: string;
  reason: string;
  source_url: string;
  code_source: string;
  license: string;
  integration: string;
}

/**
 * Galerie du catalogue. Identifiant = id du registre pour tout le monde (panier commun avec le builder) ;
 * les 44 fiches Atlas gardent `catalog_id` pour migrer les anciennes sélections.
 */
export function cataloguePayload() {
  const { items, sources, previewsBuilt: built, audited } = registryPayload();
  const curationFile = path.join(DATA, 'curation.json');
  const curation: Curated[] = fs.existsSync(curationFile) ? JSON.parse(fs.readFileSync(curationFile, 'utf8')) : [];
  const byCatalog = new Map(items.filter((e) => e.catalogId).map((e) => [e.catalogId!, e]));
  const terms = (e: EnrichedEntry) =>
    normalize(
      [
        e.name,
        e.source,
        e.category,
        VOCAB[e.category] ?? '',
        e.description,
        e.descriptionFr ?? '',
        e.tags.join(' '),
        (e.keywords ?? []).join(' '),
        e.type,
      ].join(' '),
    );
  const card = (e: EnrichedEntry) => {
    const full = hydrate(e, sources);
    return {
      id: e.id,
      registry_id: e.id,
      name: e.name,
      source: e.source,
      source_id: e.sourceId,
      kind: 'Composant',
      item_type: e.type,
      type_label: e.category,
      url: e.sourceUrl,
      description: e.descriptionFr ?? e.description,
      ...(e.usages ? { usages: e.usages } : {}),
      tags: e.tags,
      license: e.license,
      license_status: e.licenseStatus,
      attribution: full.attribution,
      dependencies: e.dependencies,
      search_terms: terms(e),
      group: e.group,
      isNew: !!e.isNew,
      importedAt: e.importedAt,
      ...(e.thumb ? { thumb: e.thumb } : {}),
    };
  };
  const curated = curation.flatMap((c, order) => {
    const e = byCatalog.get(c.id);
    return e
      ? [{ ...card(e), catalog_id: c.id, url: c.source_url, description: c.reason, registry: false, curation: { ...c, order } }]
      : [];
  });
  const others = items
    .filter((e) => e.interactive && !e.catalogId && ['component', 'section', 'screen'].includes(e.type))
    .map((e) => ({ ...card(e), registry: true, curation: null }));
  const all = [...curated, ...others];
  const counts = new Map<string, { id: string; name: string; components: number }>();
  for (const c of all) {
    const s = counts.get(c.source_id) ?? { id: c.source_id, name: c.source, components: 0 };
    s.components++;
    counts.set(c.source_id, s);
  }
  return { components: all, sources: [...counts.values()].sort((a, b) => a.name.localeCompare(b.name)), previewsBuilt: built, audited };
}
