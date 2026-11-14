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
import { IMPORT_SPEC, packageName } from '../shared/resolve.js';
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
  /** Feuilles de styles globales du template (tokens, utilitaires), jointes à chaque section. */
  styles?: string[];
  /** Sections et écrans extraits en items du registre, chacun capturé sur la démo. */
  sections?: TemplateSectionDef[];
  acceptRestricted?: RestrictedAcceptance;
}

export interface TemplateSectionDef {
  slug: string;
  name: string;
  category: string;
  type?: 'section' | 'screen';
  description?: string;
  /** Fichier(s) qui rendent la section (chemins du dépôt) ; leurs imports locaux suivent. */
  entry: string[];
  /** Page de capture : chemin relatif à la démo, ou URL complète (documentation officielle). */
  page: string;
  /** Élément à capturer : sélecteur CSS, ou `@viewport` pour l'écran visible. */
  find: string;
  /** Texte que l'élément doit contenir (départage plusieurs correspondances). */
  text?: string;
  /** Remonter de n parents après la correspondance (rangée de cartes…). */
  up?: number;
  /** Sortir l'élément de son cadre réduit (aperçus des pages de documentation). */
  isolate?: boolean;
  /** false : contenu entièrement généré (calendrier…), texte non comparable au code. */
  verify?: boolean;
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

const LOCAL_EXT = ['', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json', '.css', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];
const PUBLIC_REF = /["'`](\/[\w./@-]+\.(?:png|jpe?g|gif|webp|avif|svg|ico|mp4|webm))["'`]/g;

/** Racine de l'alias `@/` déclarée dans les tsconfig du dépôt ('' ou 'src/'). */
function aliasRoot(files: FileMap): string[] {
  for (const [rel, content] of files) {
    if (!/^tsconfig(\.[\w-]+)?\.json$/.test(rel) || typeof content !== 'string') continue;
    const m = content.match(/"[@~]\/\*"\s*:\s*\[\s*"(?:\.\/)?([^"*]*)\*"/);
    if (m) return [m[1], ...['src/', ''].filter((r) => r !== m[1])];
  }
  return ['src/', ''];
}

/**
 * Fichiers d'une section : ses fichiers d'entrée, leurs imports locaux (relatifs ou `@/`), récursivement,
 * et les feuilles de styles globales du template. Rend aussi les paquets importés, les imports
 * introuvables et les images de public/ référencées par le code.
 */
export function sectionFiles(files: FileMap, entries: string[], styles: string[] = []) {
  const roots = aliasRoot(files);
  const lookup = (base: string) => LOCAL_EXT.map((e) => base + e).find((p) => typeof files.get(p) === 'string');
  const found = new Set<string>();
  const packages = new Set<string>();
  const missing = new Set<string>();
  const publicAssets = new Set<string>();
  const queue = [...entries, ...styles];
  while (queue.length) {
    const rel = queue.shift()!;
    if (found.has(rel)) continue;
    const code = files.get(rel);
    if (typeof code !== 'string') {
      missing.add(rel);
      continue;
    }
    found.add(rel);
    for (const m of code.matchAll(IMPORT_SPEC)) {
      const spec = m[3].split('?')[0];
      let target: string | undefined;
      if (spec.startsWith('.')) target = lookup(path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec)));
      else if (/^[@~#]\//.test(spec)) {
        const rest = spec.slice(2);
        for (const root of roots) target ??= lookup(root + rest);
      } else {
        if (!/^(node:|https?:|\/\/|data:)/.test(spec)) packages.add(packageName(spec));
        continue;
      }
      if (target) queue.push(target);
      else missing.add(`${spec} (${rel})`);
    }
    for (const m of code.matchAll(PUBLIC_REF)) if (files.has(`public${m[1]}`)) publicAssets.add(`public${m[1]}`);
  }
  return { paths: [...found], packages: [...packages].sort(), missing: [...missing], publicAssets: [...publicAssets].sort() };
}

/** URL d'une page de démo : chemin relatif à la démo, ou URL complète (documentation officielle). */
export const pageUrl = (demo: string, page: string) =>
  /^https?:\/\//.test(page) ? page : page === '/' ? demo : demo.replace(/\/$/, '') + page;

/**
 * Le texte visible d'une capture doit venir du code de l'item (titres, libellés, données). Ses premières
 * lignes (une ligne = un élément affiché) sont cherchées dans le code, sans tenir compte de la casse ni des
 * entités JSX ; une longue ligne compte si la moitié de ses paires de mots s'y trouvent. Il faut au moins
 * deux lignes retrouvées, et soit 30 % des lignes, soit la première (le titre) : les données générées par
 * la démo (dates, axes, lignes aléatoires) ne font pas échouer une section dont le titre et les libellés
 * sont dans le code, alors qu'une autre variante (mêmes titres génériques, textes différents) est écartée.
 */
export function textCheck(visible: string, code: string): { ok: boolean; matched: number; total: number; missing: string[] } {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  const flat = norm(
    code
      .replace(/&apos;|&#39;|&rsquo;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/\{\s*["']\s+["']\s*\}/g, ' '),
  );
  const results: { line: string; ok: boolean }[] = [];
  // Une ligne par élément affiché ; les cellules d'un tableau (séparées par des tabulations) comptent à part.
  for (const line of [
    ...new Set(
      visible
        .split(/[\n\t]/)
        .map(norm)
        .filter(Boolean),
    ),
  ].slice(0, 30)) {
    if (!/[a-zà-ÿ]{3}/.test(line)) continue; // chiffres et symboles : rien à vérifier
    if (line.length <= 40) {
      const ok = flat.includes(line);
      // Ligne avec des chiffres (date, identifiant, « Week 3 ») : souvent générée, comptée seulement si retrouvée.
      if (ok || !/\d/.test(line)) results.push({ line, ok });
      continue;
    }
    const words = line.split(' ');
    const pairs = words
      .slice(0, -1)
      .map((w, i) => `${w} ${words[i + 1]}`)
      .filter((p) => p.length >= 9 && /^[a-zà-ÿ' -]+$/.test(p));
    if (pairs.length) results.push({ line, ok: pairs.filter((p) => flat.includes(p)).length / pairs.length >= 0.5 });
  }
  const matched = results.filter((r) => r.ok).length;
  const ok = !results.length || (matched >= Math.min(2, results.length) && (matched / results.length >= 0.3 || results[0].ok));
  return { ok, matched, total: results.length, missing: results.filter((r) => !r.ok).map((r) => r.line) };
}

export const textMatchesCode = (visible: string, code: string) => textCheck(visible, code).ok;

export function loadTemplateSources(): TemplateSource[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'importers', 'sources.json'), 'utf8')).templates ?? [];
}

/** Versions déclarées dans le package.json du template (dépendances et dépendances de développement). */
function declaredVersions(files: FileMap): Map<string, string> {
  const raw = files.get('package.json');
  if (typeof raw !== 'string') return new Map();
  const pkg = JSON.parse(raw);
  return new Map(Object.entries({ ...pkg.devDependencies, ...pkg.dependencies }) as [string, string][]);
}

/** Un item `section` ou `screen` par section déclarée : code réel du template, capture faite à part. */
function writeSections(
  collector: Collector,
  src: TemplateSource,
  commit: string,
  files: FileMap,
  license: ReturnType<typeof checkLicense>,
  licenseText: string,
  copyright: string | undefined,
) {
  const versions = declaredVersions(files);
  for (const def of src.sections ?? []) {
    const id = `${src.id}/${def.slug}`;
    const walk = sectionFiles(files, def.entry, src.styles);
    const absent = def.entry.filter((e) => !walk.paths.includes(e));
    if (absent.length) {
      collector.skip(id, `fichier d'entrée absent du dépôt : ${absent.join(', ')}`);
      continue;
    }
    if (walk.missing.length) collector.warn(`${id} : imports locaux introuvables : ${walk.missing.join(', ')}`);
    const subset: FileMap = new Map(walk.paths.map((p) => [p, files.get(p)!]));
    const entries: FileEntry[] = walk.paths.map((p) => ({
      path: p,
      role: /\.(css|scss)$/.test(p) ? 'style' : /\.json$/.test(p) ? 'data' : 'source',
    }));
    const dependencies = walk.packages.map((name) => (versions.has(name) ? `${name}@${versions.get(name)}` : name));
    collector.write(
      {
        id,
        name: def.name,
        type: def.type ?? 'section',
        category: def.category,
        tags: deriveTags(def.name, `${def.category} ${src.kind}`, walk.packages, ['template', src.id]),
        description:
          def.description ??
          `${def.name} du template ${src.name} (${src.kind.toLowerCase()}) : code du dépôt avec ses imports locaux et la feuille de styles du template.`,
        framework: 'react',
        dependencies,
        registryDependencies: [],
        source: src.name,
        sourceId: src.id,
        sourceUrl: encodeURI(`${src.repo}/blob/${commit}/${def.entry[0]}`),
        sourcePath: def.entry[0],
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
        preview: { kind: 'none', reason: 'Section de template : capture de la démo officielle' },
        fromTemplate: { id: `${src.id}/template`, page: def.page, publicAssets: walk.publicAssets },
      },
      subset,
      new Map([['LICENSE', licenseText]]),
    );
  }
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
    writeSections(collector, src, commit, files, license, licenseText, copyright);
    runs.push(collector.finish([src.id]));
    if (lock[`template-${src.id}`]?.commit !== commit) writeLockEntry(`template-${src.id}`, commit);
  }
  return runs;
}
