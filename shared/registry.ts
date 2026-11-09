import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { REGISTRY, KIND_DIRS, safeJoin, toPosix } from './paths.js';
import { Meta, type IndexEntry, type ItemType } from './schema.js';

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

export function buildIndex(root = REGISTRY): IndexEntry[] {
  const seen = new Set<string>();
  const entries: IndexEntry[] = [];
  for (const { meta, dir } of allMeta(root)) {
    if (seen.has(meta.id)) throw new Error(`Identifiant en double dans le registre : ${meta.id}`);
    seen.add(meta.id);
    const { files, tokens: _t, easings: _e, ...summary } = meta;
    entries.push({ ...summary, dir: toPosix(path.relative(root, dir)), fileCount: files.length });
  }
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(path.join(root, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), count: entries.length, items: entries }, null, 1) + '\n');
  return entries;
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
  return allMeta(root).filter(({ meta }) => meta.sourceId === sourceId).map(({ meta }) => meta.id);
}
