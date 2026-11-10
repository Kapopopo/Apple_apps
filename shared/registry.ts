import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { REGISTRY, KIND_DIRS, safeJoin, toPosix } from './paths.js';
import { Meta, type IndexEntry, type ItemType, type RegistryIndex, type SourceInfo } from './schema.js';
import { normalize } from './taxonomy.js';

export type Draft = Omit<Meta, 'contentHash' | 'importedAt' | 'updatedAt'>;
export type FileMap = Map<string, string>;
export type WriteResult = 'added' | 'updated' | 'unchanged';

export function itemDir(id: string, type: ItemType, root = REGISTRY): string {
  const [sourceId, slug] = id.split('/');
  return path.join(root, KIND_DIRS[type], sourceId, slug);
}

function hashOf(draft: Draft, files: FileMap): string {
  const h = crypto.createHash('sha256');
  const { sourceCommit: _ignored, ...stable } = draft;
  h.update(JSON.stringify(stable));
  for (const key of [...files.keys()].sort()) h.update('\0' + key + '\0' + files.get(key));
  return h.digest('hex').slice(0, 16);
}

export function readMeta(dir: string): Meta | null {
  const file = path.join(dir, 'meta.json');
  if (!fs.existsSync(file)) return null;
  return Meta.parse(JSON.parse(fs.readFileSync(file, 'utf8')));
}

/**
 * Écrit un item de façon idempotente : même contenu → rien ne change (importedAt conservé) ;
 * contenu différent → fichiers remplacés, updatedAt renseigné. Jamais de doublon : l'id fixe le dossier.
 */
export function writeItem(draft: Draft, files: FileMap, extraFiles: FileMap = new Map(), root = REGISTRY): WriteResult {
  const dir = itemDir(draft.id, draft.type, root);
  const previous = readMeta(dir);
  const all = new Map([...files, ...extraFiles]);
  const contentHash = hashOf(draft, all);
  const now = new Date().toISOString();
  if (previous && previous.contentHash === contentHash) {
    if (previous.sourceCommit !== draft.sourceCommit && draft.sourceCommit) {
      fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ ...previous, sourceCommit: draft.sourceCommit }, null, 2) + '\n');
    }
    return 'unchanged';
  }
  const meta = Meta.parse({ ...draft, contentHash, importedAt: previous?.importedAt ?? now, ...(previous ? { updatedAt: now } : {}) });
  fs.rmSync(path.join(dir, 'files'), { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, content] of files) {
    const target = safeJoin(path.join(dir, 'files'), rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
  for (const [rel, content] of extraFiles) fs.writeFileSync(safeJoin(dir, rel), content);
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
  return previous ? 'updated' : 'added';
}

export function allMeta(root = REGISTRY): { meta: Meta; dir: string }[] {
  const result: { meta: Meta; dir: string }[] = [];
  for (const kind of new Set(Object.values(KIND_DIRS))) {
    const base = path.join(root, kind);
    if (!fs.existsSync(base)) continue;
    for (const source of fs.readdirSync(base)) {
      const sourceDir = path.join(base, source);
      if (!fs.statSync(sourceDir).isDirectory()) continue;
      for (const slug of fs.readdirSync(sourceDir)) {
        const dir = path.join(sourceDir, slug);
        const meta = fs.statSync(dir).isDirectory() ? readMeta(dir) : null;
        if (meta) result.push({ meta, dir });
      }
    }
  }
  return result.sort((a, b) => a.meta.id.localeCompare(b.meta.id));
}

const STOP_WORDS = /\b(demo|basic|default|example|simple|animated|component|block|ui|new|v\d+)\b/g;

/** Clé d'équivalence : « Input 01 », « input » et « Animated Input » se retrouvent sous « input ». */
export function groupKey(name: string): string {
  return normalize(name)
    .replace(/[-_]/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(STOP_WORDS, ' ')
    .replace(/[^a-z ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Valeur la plus fréquente d'un champ parmi les items d'une source. */
function mostCommon<T>(values: T[]): T | undefined {
  const counts = new Map<string, { value: T; n: number }>();
  for (const v of values) {
    const k = JSON.stringify(v ?? null);
    const c = counts.get(k);
    if (c) c.n++;
    else counts.set(k, { value: v, n: 1 });
  }
  return [...counts.values()].sort((a, b) => b.n - a.n)[0]?.value;
}

function summarize(meta: Meta, dir: string, root: string): IndexEntry {
  const { files, tokens: _t, easings: _e, ...summary } = meta;
  const ui = meta.type === 'component' || meta.type === 'section' || meta.type === 'screen';
  return {
    ...summary,
    dir: toPosix(path.relative(root, dir)),
    fileCount: files.length,
    ...(ui && groupKey(meta.name) ? { group: groupKey(meta.name) } : {}),
  };
}

/** Retire de l'entrée les textes de licence identiques à ceux de sa source (ils sont dans `sources`). */
function compact(entry: IndexEntry, source: SourceInfo): IndexEntry {
  const out = { ...entry };
  if (out.licenseNotes === source.licenseNotes) delete out.licenseNotes;
  if (out.attribution === source.attribution) delete out.attribution;
  return out;
}

/** Restaure licenseNotes / attribution depuis la table des sources (inverse de compact). */
export function hydrate(entry: IndexEntry, sources: Record<string, SourceInfo>): IndexEntry {
  const source = sources[entry.sourceId];
  if (!source || entry.license !== source.license) return entry;
  return { ...entry, licenseNotes: entry.licenseNotes ?? source.licenseNotes, attribution: entry.attribution ?? source.attribution };
}

const indexCache = new Map<string, { mtime: number; index: RegistryIndex; hydrated?: IndexEntry[] }>();

function cachedIndex(root: string) {
  const file = path.join(root, 'index.json');
  if (!fs.existsSync(file)) return { mtime: 0, index: { generatedAt: '', count: 0, sources: {}, items: [] } as RegistryIndex };
  const mtime = fs.statSync(file).mtimeMs;
  let entry = indexCache.get(root);
  if (!entry || entry.mtime !== mtime) {
    entry = { mtime, index: { sources: {}, ...JSON.parse(fs.readFileSync(file, 'utf8')) } };
    indexCache.set(root, entry);
  }
  return entry;
}

/** registry/index.json tel qu'écrit (textes de licence communs dans `sources`), relu seulement s'il a changé. */
export function loadIndex(root = REGISTRY): RegistryIndex {
  return cachedIndex(root).index;
}

/** Entrées de l'index avec leurs textes de licence complets. */
export function indexItems(root = REGISTRY): IndexEntry[] {
  const entry = cachedIndex(root) as { index: RegistryIndex; hydrated?: IndexEntry[] };
  entry.hydrated ??= entry.index.items.map((e) => hydrate(e, entry.index.sources));
  return entry.hydrated;
}

/** Date de modification de l'index (clé de cache des calculs dérivés). */
export const indexVersion = (root = REGISTRY) => cachedIndex(root).mtime;

/**
 * Régénère registry/index.json : une entrée par item (sans code), une table des sources
 * pour les textes de licence communs, les groupes d'équivalents et le marqueur « nouveauté »
 * (item importé après le premier import de sa source).
 */
export function buildIndex(root = REGISTRY): IndexEntry[] {
  const seen = new Set<string>();
  const entries: IndexEntry[] = [];
  for (const { meta, dir } of allMeta(root)) {
    if (seen.has(meta.id)) throw new Error(`Identifiant en double dans le registre : ${meta.id}`);
    seen.add(meta.id);
    entries.push(summarize(meta, dir, root));
  }
  const bySource = new Map<string, IndexEntry[]>();
  for (const e of entries) bySource.set(e.sourceId, [...(bySource.get(e.sourceId) ?? []), e]);
  const sources: Record<string, SourceInfo> = {};
  const firstDay = new Map<string, string>();
  for (const [sourceId, list] of bySource) {
    const license = mostCommon(list.map((e) => e.license))!;
    const same = list.filter((e) => e.license === license);
    sources[sourceId] = {
      name: list[0].source,
      license,
      licenseStatus: same[0].licenseStatus,
      licenseNotes: mostCommon(same.map((e) => e.licenseNotes)),
      attribution: mostCommon(same.map((e) => e.attribution)),
    };
    firstDay.set(sourceId, list.map((e) => e.importedAt.slice(0, 10)).sort()[0]);
  }
  const items = entries.map((e) => {
    const compacted = e.license === sources[e.sourceId].license ? compact(e, sources[e.sourceId]) : e;
    return e.importedAt.slice(0, 10) > firstDay.get(e.sourceId)! ? { ...compacted, isNew: true } : compacted;
  });
  const index: RegistryIndex = { generatedAt: new Date().toISOString(), count: items.length, sources, items };
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify(index, null, 1) + '\n');
  return entries;
}

/** Ajoute ou remplace un seul item dans l'index sans tout relire (thèmes personnels créés depuis le builder). */
export function upsertIndex(meta: Meta, dir: string, root = REGISTRY): void {
  const file = path.join(root, 'index.json');
  if (!fs.existsSync(file)) {
    buildIndex(root);
    return;
  }
  const index: RegistryIndex = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entry = summarize(meta, dir, root);
  index.sources[meta.sourceId] ??= {
    name: meta.source,
    license: meta.license,
    licenseStatus: meta.licenseStatus,
    licenseNotes: meta.licenseNotes,
    attribution: meta.attribution,
  };
  const source = index.sources[meta.sourceId];
  const compacted = entry.license === source.license ? compact(entry, source) : entry;
  index.items = [...index.items.filter((i) => i.id !== meta.id), compacted].sort((a, b) => a.id.localeCompare(b.id));
  index.count = index.items.length;
  index.generatedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(index, null, 1) + '\n');
}

/** Retire un item de l'index (suppression d'un thème personnel). */
export function removeFromIndex(id: string, root = REGISTRY): void {
  const file = path.join(root, 'index.json');
  if (!fs.existsSync(file)) return;
  const index: RegistryIndex = JSON.parse(fs.readFileSync(file, 'utf8'));
  index.items = index.items.filter((i) => i.id !== id);
  index.count = index.items.length;
  fs.writeFileSync(file, JSON.stringify(index, null, 1) + '\n');
}

export function readFiles(meta: Meta, dir: string): { path: string; role: string; target?: string; content: string }[] {
  return meta.files.map((f) => ({ ...f, content: fs.readFileSync(safeJoin(path.join(dir, 'files'), f.path), 'utf8') }));
}

export interface RunLog {
  importer: string;
  source: string;
  at: string;
  commit?: string;
  license?: string;
  added: string[];
  updated: string[];
  unchanged: number;
  missingUpstream: string[];
  skipped: { item: string; reason: string }[];
  warnings?: string[];
}

/** Journal des imports (les 100 derniers passages), lisible par le builder et les tests. */
export function appendLog(run: RunLog, root = REGISTRY) {
  const file = path.join(root, '_import-log.json');
  const runs: RunLog[] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).runs : [];
  runs.push(run);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(file, JSON.stringify({ runs: runs.slice(-100) }, null, 2) + '\n');
}

/** Ids déjà présents pour une source, pour signaler les items disparus en amont (jamais supprimés automatiquement). */
export function existingIds(sourceId: string, root = REGISTRY): string[] {
  return allMeta(root)
    .filter(({ meta }) => meta.sourceId === sourceId)
    .map(({ meta }) => meta.id);
}
