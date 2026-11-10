import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CACHE } from '../../shared/paths.js';

const git = (args: string[], cwd?: string) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export interface SyncOptions {
  /** Aucun accès réseau : le cache doit exister (le commit verrouillé doit y être présent). */
  offline?: boolean;
  /** Commit à utiliser (importers/lock.json) ; absent = dernier commit de la branche par défaut. */
  commit?: string;
  /** Dossiers utiles (mode cone) : clone partiel, seuls ces dossiers et les fichiers de la racine sont extraits. */
  sparse?: string[];
}

function applySparse(dir: string, sparse?: string[]) {
  if (!sparse?.length) return;
  const current = (() => {
    try {
      return git(['sparse-checkout', 'list'], dir).split('\n').filter(Boolean);
    } catch {
      return [];
    }
  })();
  if (current.length === sparse.length && sparse.every((s) => current.includes(s))) return;
  git(['sparse-checkout', 'set', '--cone', ...sparse], dir);
}

/**
 * Clone superficiel dans .cache/sources/<id> (partiel si `sparse`), puis positionnement sur le commit
 * verrouillé ou sur le dernier commit de la branche par défaut. Le code cloné n'est jamais exécuté : il est seulement lu.
 */
export function syncRepo(id: string, url: string, options: SyncOptions = {}): { dir: string; commit: string } {
  const { offline = false, commit, sparse } = options;
  const dir = path.join(CACHE, id);
  if (!fs.existsSync(path.join(dir, '.git'))) {
    if (offline) throw new Error(`Cache absent pour ${id} et mode hors ligne.`);
    fs.mkdirSync(CACHE, { recursive: true });
    git(['clone', '--quiet', '--depth', '1', '--no-tags', ...(sparse?.length ? ['--filter=blob:none', '--sparse'] : []), url, dir]);
    applySparse(dir, sparse);
  } else applySparse(dir, sparse);
  const head = git(['rev-parse', 'HEAD'], dir);
  if (commit && head !== commit) {
    if (offline)
      throw new Error(`${id} : commit verrouillé ${commit.slice(0, 7)} absent du cache (HEAD ${head.slice(0, 7)}) et mode hors ligne.`);
    git(['fetch', '--quiet', '--depth', '1', 'origin', commit], dir);
    git(['reset', '--quiet', '--hard', 'FETCH_HEAD'], dir);
  } else if (!commit && !offline) {
    git(['fetch', '--quiet', '--depth', '1', 'origin', 'HEAD'], dir);
    git(['reset', '--quiet', '--hard', 'FETCH_HEAD'], dir);
  }
  return { dir, commit: git(['rev-parse', 'HEAD'], dir) };
}

/** Dernier commit publié sur la branche par défaut, sans rien télécharger d'autre. */
export function remoteHead(url: string): string {
  return git(['ls-remote', url, 'HEAD']).split(/\s+/)[0];
}

export function readLicenseText(dir: string): string | null {
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'LICENCE', 'LICENCE.md', 'LICENCE.txt']) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  }
  return null;
}
