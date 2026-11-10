/**
 * Templates complets (sites et applications) : le dépôt entier au commit verrouillé, licence vérifiée
 * sur le texte du LICENSE, sans dépendances installées, builds, verrous ni secrets. Les images et
 * polices sont gardées en binaire (rôle `asset`) dans une limite de taille ; le reste est listé.
 * Les captures des pages viennent de la démo officielle (npm run capture:templates). Le code est
 * lu, jamais exécuté.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, toPosix } from '../shared/paths.js';
import { checkLicense, type RestrictedAcceptance } from '../shared/license.js';
import { deriveTags } from '../shared/taxonomy.js';
import type { FileMap } from '../shared/registry.js';
import type { FileEntry } from '../shared/schema.js';
import { readLicenseText, syncRepo } from './lib/git.js';
import { Collector } from './lib/collector.js';
import { readLock, writeLockEntry } from './github.js';

export interface TemplateSource {
  id: string;
  name: string;
  repo: string;
  demo: string;
  kind: string;
  category: string;
  stack: string;
  description: string;
  pages: { path: string; title: string }[];
  /** Image du dépôt utilisée comme visuel quand la démo n'est plus en ligne. */
  cover?: string;
  acceptRestricted?: RestrictedAcceptance;
}

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  'out',
  '.vercel',
  '.turbo',
  '.cache',
  'coverage',
  '.github',
  '.husky',
  '.vscode',
  '.idea',
  '.contentlayer',
]);
const SKIP_FILES =
  /^(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|\.DS_Store|Thumbs\.db|\.env(\.local|\.production|\.development)?|LICEN[CS]E(\.md|\.txt)?)$/i;
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|bmp|woff2?|ttf|otf|eot|mp3|wav|ogg|mp4|webm|mov|pdf|zip)$/i;
const MAX_TEXT = 512 * 1024;
const MAX_ASSET = 1.5 * 1024 * 1024;
const ASSET_BUDGET = 12 * 1024 * 1024;

const roleOf = (rel: string, binary: boolean): FileEntry['role'] =>
  binary ? 'asset' : /\.(css|scss|sass)$/.test(rel) ? 'style' : /\.mdx?$/.test(rel) ? 'doc' : 'source';

/** Fichiers du dépôt à reprendre : texte (≤ 512 ko) et binaires dans le budget ; le reste est listé à part. */
export function collectTemplateFiles(dir: string): { files: FileMap; entries: FileEntry[]; skipped: string[] } {
  const files: FileMap = new Map();
  const entries: FileEntry[] = [];
  const skipped: string[] = [];
  let assets = 0;
  const visit = (rel: string) => {
    for (const name of fs.readdirSync(path.join(dir, rel)).sort()) {
      const childRel = rel ? `${rel}/${name}` : name;
      const abs = path.join(dir, childRel);
      const stat = fs.lstatSync(abs);
      if (stat.isSymbolicLink()) continue;
      if (stat.isDirectory()) {
        if (!SKIP_DIRS.has(name)) visit(childRel);
        continue;
      }
      if (SKIP_FILES.test(name)) continue;
      const binary = BINARY.test(name);
      if (binary) {
        if (stat.size > MAX_ASSET || assets + stat.size > ASSET_BUDGET) {
          skipped.push(`${childRel} (${(stat.size / 1024).toFixed(0)} ko)`);
          continue;
        }
        assets += stat.size;
        files.set(childRel, fs.readFileSync(abs));
      } else {
        if (stat.size > MAX_TEXT) {
          skipped.push(`${childRel} (${(stat.size / 1024).toFixed(0)} ko)`);
          continue;
        }
        const buffer = fs.readFileSync(abs);
        if (buffer.subarray(0, 8000).includes(0)) {
          skipped.push(`${childRel} (binaire non reconnu)`);
          continue;
        }
        files.set(childRel, buffer.toString('utf8'));
      }
      entries.push({ path: toPosix(childRel), role: roleOf(childRel, binary) });
    }
  };
  visit('');
  return { files, entries, skipped };
}

/** Commandes selon le gestionnaire de paquets du dépôt, et variables attendues (.env.example). */
export function templateRuntime(dir: string) {
  const has = (f: string) => fs.existsSync(path.join(dir, f));
  const pm = has('pnpm-lock.yaml') ? 'pnpm' : has('yarn.lock') ? 'yarn' : has('bun.lockb') || has('bun.lock') ? 'bun' : 'npm';
  const pkg = has('package.json') ? JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) : {};
  const envFile = ['.env.example', '.env.local.example', '.env.sample', '.env.template'].find(has);
  const env = envFile
    ? [
        ...new Set(
          fs
            .readFileSync(path.join(dir, envFile), 'utf8')
            .split(/\r?\n/)
            .map((l) => l.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/)?.[1])
            .filter((k): k is string => !!k),
        ),
      ]
    : [];
  return {
    install: `${pm} install`,
    dev: pkg.scripts?.dev ? `${pm} run dev` : `${pm} start`,
    env,
    dependencies: Object.entries(pkg.dependencies ?? {})
      .map(([n, v]) => `${n}@${v}`)
      .sort(),
  };
}

export function loadTemplateSources(): TemplateSource[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'importers', 'sources.json'), 'utf8')).templates ?? [];
}

export function importTemplates(options: { only?: string; offline?: boolean; update?: boolean } = {}) {
  const runs = [];
  const lock = readLock();
  for (const src of loadTemplateSources()) {
    if (options.only && options.only !== src.id) continue;
    const { dir, commit } = syncRepo(`template-${src.id}`, src.repo, {
      offline: options.offline,
      commit: options.update ? undefined : lock[`template-${src.id}`]?.commit,
    });
    const licenseText = readLicenseText(dir);
    const license = checkLicense(licenseText, src.acceptRestricted);
    const collector = new Collector('templates', src.id, { commit, license: license.license });
    if (license.status === 'rejected' || !licenseText) {
      collector.skip(src.repo, license.reason);
      runs.push(collector.finish([src.id]));
      continue;
    }
    console.log(`→ ${src.name} @ ${commit.slice(0, 7)} — ${license.reason}`);
    const { files, entries, skipped } = collectTemplateFiles(dir);
    const runtime = templateRuntime(dir);
    const copyright = licenseText.match(/^\s*Copyright[^\n]+/im)?.[0].trim();
    collector.write(
      {
        id: `${src.id}/template`,
        name: src.name,
        type: 'template',
        category: src.category,
        tags: deriveTags(
          src.name,
          `${src.kind} ${src.description}`,
          runtime.dependencies.map((d) => d.replace(/(.)@.*$/, '$1')),
          ['template', src.category.toLowerCase()],
        ),
        description: src.description,
        framework: 'react',
        dependencies: runtime.dependencies,
        registryDependencies: [],
        source: src.name,
        sourceId: src.id,
        sourceUrl: `${src.repo}/tree/${commit}`,
        sourceCommit: commit,
        license: license.license,
        licenseStatus: license.status === 'restricted' ? 'restricted' : 'open',
        ...(license.notes ? { licenseNotes: license.notes } : {}),
        ...(license.attribution
          ? { attribution: license.attribution }
          : copyright
            ? { attribution: `Conserver la notice ${license.license} : ${copyright}` }
            : {}),
        files: entries,
        template: {
          kind: src.kind,
          stack: src.stack,
          demo: src.demo,
          pages: src.pages,
          install: runtime.install,
          dev: runtime.dev,
          env: runtime.env,
          skipped,
        },
        preview: { kind: 'none', reason: 'Template complet : captures des pages et démo officielle' },
      },
      files,
      new Map([['LICENSE', licenseText]]),
    );
    if (skipped.length)
      collector.warn(`${src.id} : ${skipped.length} fichier(s) trop lourds non repris (listés dans meta.template.skipped)`);
    runs.push(collector.finish([src.id]));
    if (lock[`template-${src.id}`]?.commit !== commit) writeLockEntry(`template-${src.id}`, commit);
  }
  return runs;
}
