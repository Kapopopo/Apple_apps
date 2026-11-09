import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CACHE } from '../../shared/paths.js';

const git = (args: string[], cwd?: string) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

/**
 * Clone superficiel dans .cache/sources/<id>, ou mise à jour vers le dernier commit
 * de la branche par défaut. Le code cloné n'est jamais exécuté : il est seulement lu.
 */
export function syncRepo(id: string, url: string, offline = false): { dir: string; commit: string } {
  const dir = path.join(CACHE, id);
  if (!fs.existsSync(path.join(dir, '.git'))) {
    if (offline) throw new Error(`Cache absent pour ${id} et mode hors ligne.`);
    fs.mkdirSync(CACHE, { recursive: true });
    git(['clone', '--quiet', '--depth', '1', '--no-tags', url, dir]);
  } else if (!offline) {
    git(['fetch', '--quiet', '--depth', '1', 'origin', 'HEAD'], dir);
    git(['reset', '--quiet', '--hard', 'FETCH_HEAD'], dir);
  }
  return { dir, commit: git(['rev-parse', 'HEAD'], dir) };
}

export function readLicenseText(dir: string): string | null {
  for (const name of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'license', 'license.md', 'LICENCE', 'LICENCE.md', 'LICENCE.txt']) {
    const file = path.join(dir, name);
    if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  }
  return null;
}
