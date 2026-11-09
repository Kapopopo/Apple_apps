/**
 * Graphe d'imports d'un fichier source, sans exécuter de code : sert à compléter
 * les fichiers internes oubliés par un registre, à relier les items entre eux
 * (registryDependencies) et à vérifier les paquets npm déclarés.
 */
import fs from 'node:fs';
import path from 'node:path';
import { toPosix } from '../../shared/paths.js';

const IMPORT_RE = /(?:import|export)\s+(?:type\s+)?(?:[^'"`;]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)|require\(\s*['"]([^'"]+)['"]\s*\)|@import\s+(?:url\()?['"]([^'"]+)['"]/g;
const EXTENSIONS = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.css', '/index.tsx', '/index.ts', '/index.js'];
const IGNORED_PACKAGES = new Set(['react', 'react-dom', 'react/jsx-runtime']);
const BUILTINS = /^(node:|fs$|path$|url$|crypto$)/;

export function importSpecifiers(code: string): { spec: string; typeOnly: boolean }[] {
  const result: { spec: string; typeOnly: boolean }[] = [];
  for (const m of code.matchAll(IMPORT_RE)) {
    const spec = m[1] ?? m[2] ?? m[3] ?? m[4];
    if (spec) result.push({ spec, typeOnly: /^(?:import|export)\s+type\s/.test(m[0]) });
  }
  return result;
}

export function packageName(spec: string): string {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

export type Aliases = Record<string, string>;

/** Résout un spécifieur en chemin relatif au repo (posix), ou null s'il s'agit d'un paquet npm. */
export function resolveInRepo(repoDir: string, fromRel: string, spec: string, aliases: Aliases, exists: (rel: string) => boolean): string | null | undefined {
  let base: string | null = null;
  if (spec.startsWith('.')) base = toPosix(path.posix.normalize(path.posix.join(path.posix.dirname(fromRel), spec)));
  else {
    const alias = Object.keys(aliases).sort((a, b) => b.length - a.length).find((a) => spec.startsWith(a));
    if (alias !== undefined) base = aliases[alias] + spec.slice(alias.length);
  }
  if (base === null) return null;
  for (const ext of EXTENSIONS) if (exists(base + ext)) return base + ext;
  return undefined; // interne mais introuvable
}

export interface WalkResult {
  files: string[];
  packages: string[];
  dependsOn: string[];
  unresolved: string[];
}

/**
 * Parcourt les imports depuis `entries`. Un fichier appartenant à un autre item (`owners`)
 * devient une dépendance de registre au lieu d'être recopié.
 */
export function walk(repoDir: string, entries: string[], self: string, owners: Map<string, string>, aliases: Aliases, readFile?: (rel: string) => string | undefined): WalkResult {
  const read = readFile ?? ((rel: string) => { const f = path.join(repoDir, rel); return fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : undefined; });
  const exists = (rel: string) => read(rel) !== undefined;
  const files = new Set<string>();
  const packages = new Set<string>();
  const dependsOn = new Set<string>();
  const unresolved = new Set<string>();
  const queue = [...entries];
  while (queue.length) {
    const rel = queue.shift()!;
    if (files.has(rel)) continue;
    const code = read(rel);
    if (code === undefined) { unresolved.add(rel); continue; }
    files.add(rel);
    for (const { spec, typeOnly } of importSpecifiers(code)) {
      if (spec.startsWith('http') || spec.startsWith('data:')) continue;
      const target = resolveInRepo(repoDir, rel, spec, aliases, exists);
      if (target === null) {
        const pkg = packageName(spec);
        if (!typeOnly && !IGNORED_PACKAGES.has(pkg) && !BUILTINS.test(spec)) packages.add(pkg);
      } else if (target === undefined) unresolved.add(spec);
      else {
        const owner = owners.get(target);
        if (owner && owner !== self) dependsOn.add(owner);
        else queue.push(target);
      }
    }
  }
  return { files: [...files], packages: [...packages].sort(), dependsOn: [...dependsOn].sort(), unresolved: [...unresolved].sort() };
}
