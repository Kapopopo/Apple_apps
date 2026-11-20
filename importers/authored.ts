/**
 * Sources écrites pour Atlas (authored/<source>/) : thème + composants + sections, publiés dans registry/
 * comme n'importe quelle source (schéma validé, contentHash, LICENSE, journal).
 * Dépendances npm et de registre déduites des imports de chaque fichier source :
 *  - `@/…` ou relatif vers un fichier d'un autre item → registryDependencies ;
 *  - paquet → dependencies, à la version installée dans previews/package.json ;
 *  - `@/lib/utils` → helper cn commun du bundle (non publié).
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../shared/paths.js';
import { EXTENSIONS, IMPORT_SPEC, packageName } from '../shared/resolve.js';
import type { FileEntry } from '../shared/schema.js';
import { Collector } from './lib/collector.js';
import { ITEMS, SOURCE, THEME, type AuthoredItem } from '../authored/saas-premium-ui/manifest.js';
import { themeTokens, tokensCss } from '../authored/saas-premium-ui/tokens.js';

const BASE = path.join(ROOT, 'authored', SOURCE.id);
const SRC = path.join(BASE, 'src');
const IGNORED_PACKAGES = new Set(['react', 'react-dom']);
const CN = /^(@\/)?lib\/utils$/;

function versions(): Record<string, string> {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'previews', 'package.json'), 'utf8'));
  return { ...pkg.dependencies, ...pkg.devDependencies };
}

const read = (rel: string) => {
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) throw new Error(`Fichier absent : authored/${SOURCE.id}/src/${rel}`);
  return fs.readFileSync(abs, 'utf8');
};

/** Chemin d'origine importé → item propriétaire. */
function owners(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of THEME.files) map.set(f, `${SOURCE.id}/${THEME.slug}`);
  for (const item of ITEMS) for (const f of [...item.files, item.demo]) map.set(f, `${SOURCE.id}/${item.slug}`);
  return map;
}

function lookup(owner: Map<string, string>, rel: string): string | undefined {
  for (const ext of EXTENSIONS) {
    const hit = owner.get(rel + ext);
    if (hit) return hit;
  }
  return undefined;
}

/** Dépendances d'un ensemble de fichiers (les démos ne comptent pas). */
export function analyse(files: string[], selfId: string, owner = owners(), installed = versions()) {
  const packages = new Set<string>();
  const registry = new Set<string>();
  const missing: string[] = [];
  for (const rel of files) {
    if (!/\.(tsx?|css)$/.test(rel)) continue;
    for (const m of read(rel).matchAll(IMPORT_SPEC)) {
      const spec = m[3].split('?')[0];
      if (CN.test(spec)) {
        packages.add('clsx');
        packages.add('tailwind-merge');
        continue;
      }
      let target: string | undefined;
      if (spec.startsWith('@/')) target = spec.slice(2);
      else if (spec.startsWith('.')) target = path.posix.normalize(path.posix.join(path.posix.dirname(rel), spec));
      if (target !== undefined) {
        const id = lookup(owner, target);
        if (!id) missing.push(`${spec} (dans ${rel})`);
        else if (id !== selfId) registry.add(id);
        continue;
      }
      if (/^(geist-fonts|node:)/.test(spec)) continue;
      const name = packageName(spec);
      if (!IGNORED_PACKAGES.has(name)) packages.add(name);
    }
  }
  const dependencies = [...packages].sort().map((name) => (installed[name] ? `${name}@${installed[name]}` : name));
  return { dependencies, registryDependencies: [...registry].sort(), missing };
}

const fileEntry = (rel: string, role: FileEntry['role']): FileEntry => ({ path: rel, role });

export function importAuthored() {
  const collector = new Collector('authored', SOURCE.id);
  const license = fs.readFileSync(path.join(BASE, 'LICENSE'), 'utf8');
  const extra = new Map([['LICENSE', license]]);
  const common = {
    framework: 'react' as const,
    source: SOURCE.name,
    sourceId: SOURCE.id,
    sourceUrl: '' as const,
    license: SOURCE.license,
    licenseStatus: 'open' as const,
    licenseNotes: SOURCE.licenseNotes,
    attribution: SOURCE.attribution,
  };
  const owner = owners();
  const installed = versions();
  const themeId = `${SOURCE.id}/${THEME.slug}`;

  // Thème : tokens.css généré, le reste écrit à la main.
  const themeFiles = new Map<string, string>(THEME.files.map((f) => [f, f === 'tokens.css' ? tokensCss() : read(f)]));
  const themeDeps = analyse(
    THEME.files.filter((f) => f !== 'tokens.css'),
    themeId,
    owner,
    installed,
  );
  collector.write(
    {
      ...common,
      id: themeId,
      name: THEME.name,
      type: 'theme',
      category: 'Thèmes',
      tags: [...THEME.tags],
      description: THEME.description,
      framework: 'agnostic',
      dependencies: [...new Set([...themeDeps.dependencies, `geist@${installed.geist ?? '^1.9.1'}`])].sort(),
      registryDependencies: [],
      files: THEME.files.map((f) => fileEntry(f, f.endsWith('.css') ? 'theme' : 'source')),
      tokens: themeTokens(),
      preview: { kind: 'none', reason: `Planche du thème : ${SOURCE.id}/theme-board` },
    },
    themeFiles,
    extra,
  );

  for (const item of ITEMS) write(item);

  function write(item: AuthoredItem) {
    const id = `${SOURCE.id}/${item.slug}`;
    const deps = analyse(item.files, id, owner, installed);
    if (deps.missing.length) {
      collector.skip(id, `Imports introuvables : ${deps.missing.join(', ')}`);
      return;
    }
    const demoDeps = analyse([item.demo], id, owner, installed);
    if (demoDeps.missing.length) {
      collector.skip(id, `Imports de la démo introuvables : ${demoDeps.missing.join(', ')}`);
      return;
    }
    const files = new Map<string, string>([...item.files, item.demo].map((f) => [f, read(f)]));
    collector.write(
      {
        ...common,
        id,
        name: item.name,
        type: item.type,
        category: item.category,
        tags: [...new Set(item.tags)],
        description: item.description,
        dependencies: deps.dependencies,
        // Le thème est toujours requis : tokens, utilitaires Tailwind et keyframes.
        registryDependencies: [...new Set([themeId, ...deps.registryDependencies])].sort(),
        files: [...item.files.map((f) => fileEntry(f, f.endsWith('.css') ? 'style' : 'source')), fileEntry(item.demo, 'demo')],
        theme: themeId,
        preview: { kind: 'live', entry: item.demo, demo: 'source' },
      },
      files,
      extra,
    );
  }

  return [collector.finish([SOURCE.id])];
}
