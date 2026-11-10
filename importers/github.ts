/**
 * Importer GitHub : clone superficiel, vérification de licence sur le texte du LICENSE,
 * puis un parser par format de source. Relançable : les items identiques ne sont pas réécrits.
 */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, toPosix } from '../shared/paths.js';
import { checkLicense, type LicenseCheck, type RestrictedAcceptance } from '../shared/license.js';
import { classify, deriveTags, normalize, refineType } from '../shared/taxonomy.js';
import { allMeta, existingIds, type Draft, type FileMap } from '../shared/registry.js';
import type { FileEntry, ItemType } from '../shared/schema.js';
import { readLicenseText, remoteHead, syncRepo } from './lib/git.js';
import { importSpecifiers, resolveInRepo, walk, type Aliases } from './lib/graph.js';
import { extractTheme } from './lib/css-tokens.js';
import { Collector } from './lib/collector.js';

interface ThemeConfig {
  file: string | string[];
  name: string;
}
interface BaseSource {
  id: string;
  name: string;
  repo: string;
  homepage: string;
  parser: string;
  framework?: 'react' | 'react-native';
  acceptRestricted?: RestrictedAcceptance;
  theme?: ThemeConfig;
  aliases?: Aliases;
  demos?: string;
  sparse?: string[];
}
/**
 * Démos « de route » (Easy UI) : chaque démo charge ses composants via des registres paresseux
 * (`DEMO_COMPONENTS.X` = import dynamique). Atlas génère, par item, une version statique de ces
 * registres limitée aux entrées utilisées, pour que la démo se rende hors du site d'origine.
 */
interface RouteDemos {
  pattern: string;
  registries: { file: string; name: string }[];
  reexports?: Record<string, string>;
}
interface ShadcnSource extends BaseSource {
  parser: 'shadcn-registry';
  registry: string;
  metadata?: string;
  routeDemos?: RouteDemos;
}
interface Variant {
  id: string;
  dir: string;
  framework: 'react' | 'react-native';
  blockType?: ItemType;
  aliases?: Aliases;
  demos?: string;
  theme?: ThemeConfig;
  componentList?: { file: string; key: string };
  /** registry.json source de métadonnées complémentaires (titre, description, meta.tags) par nom. */
  index?: string;
  /** Une seule variante par composant (ex. React Bits : -TS-TW sinon -TS-CSS), suffixe retiré du nom. */
  variantSuffixes?: string[];
  /** Ne pas remplacer les items déjà fournis par un autre importer avec une démo Atlas. */
  skipExisting?: boolean;
  /** Source où chercher une dépendance de registre absente de celle-ci (ex. shadcn). */
  fallbackSource?: string;
  /** Nom construit depuis meta.tags quand l'item n'a pas de titre (Origin UI : comp-01…). */
  nameFromTags?: boolean;
  /** Stocker chaque fichier à son chemin cible (champ target) plutôt qu'à son chemin publié. */
  targetPaths?: boolean;
  /** Paquets npm dont la présence désactive l'aperçu live (paquet non vérifié, WebGPU…). */
  noPreviewPackages?: string[];
  /** Primitives et hooks propres à la source (ReUI : Base UI), stockés à leur emplacement cible, importés comme utilitaires. */
  primitives?: { dir: string; target: string; prefix: string; idPrefix: string }[];
  /** Exemples officiels décrits par des fichiers de métadonnées (ReUI : titre, description, dépendances). */
  examples?: { meta: string; root: string };
  /** Sons : recettes `<prefix><Nom><suffix>` jouées par le moteur `engine` (React Bits). */
  sounds?: { prefix: string; suffix: string; engine: string };
}
interface BuiltSource extends BaseSource {
  parser: 'shadcn-built';
  variants: Variant[];
}
interface BlocksSource extends BaseSource {
  parser: 'folder-blocks';
  blocks: string;
  exclude: string[];
  excludeReadme?: string;
  sounds?: string;
}
type Source = ShadcnSource | BuiltSource | BlocksSource;

export const slugify = (s: string) =>
  normalize(s.replace(/([a-z0-9])([A-Z])/g, '$1-$2'))
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

interface Ctx {
  src: Source;
  dir: string;
  commit: string;
  license: LicenseCheck;
  licenseText: string;
  collector: Collector;
}

const read = (dir: string, rel: string) => {
  const f = path.join(dir, rel);
  return fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : undefined;
};
const roleOf = (rel: string): FileEntry['role'] => (/\.css$/.test(rel) ? 'style' : /\.mdx?$/.test(rel) ? 'doc' : 'source');
const blobUrl = (ctx: Ctx, rel: string) => `${ctx.src.repo}/blob/${ctx.commit}/${rel.split('/').map(encodeURIComponent).join('/')}`;
const uniq = <T>(xs: T[]) => [...new Set(xs)];

function copyright(text: string): string | undefined {
  return text.match(/^\s*Copyright[^\n]+/im)?.[0].trim();
}

function base(
  ctx: Ctx,
  sourceId: string,
  slug: string,
  fields: Pick<Draft, 'name' | 'type' | 'framework' | 'description'> & Partial<Draft>,
): Draft {
  const { license } = ctx;
  const attribution =
    license.attribution ??
    (copyright(ctx.licenseText) ? `Conserver la notice ${license.license} : ${copyright(ctx.licenseText)}` : undefined);
  return {
    id: `${sourceId}/${slug}`,
    category:
      fields.type === 'lib' ? 'Utilitaires' : fields.type === 'theme' ? 'Thèmes' : classify(`${slug} ${fields.name}`, fields.description),
    tags: [],
    dependencies: [],
    registryDependencies: [],
    source: ctx.src.name,
    sourceId,
    sourceUrl: ctx.src.repo,
    sourceCommit: ctx.commit,
    license: license.license,
    licenseStatus: license.status === 'restricted' ? 'restricted' : 'open',
    ...(license.notes ? { licenseNotes: license.notes } : {}),
    ...(attribution ? { attribution } : {}),
    files: [],
    preview: { kind: 'none' },
    ...fields,
  };
}

/** Motif simple : segments `*`, alternatives `{a,b}` et marqueur `{name}`. */
export function expandGlob(dir: string, pattern: string, name?: string): string[] {
  const segments = pattern.replaceAll('{name}', name ?? '*').split('/');
  let current = [''];
  for (const segment of segments) {
    const next: string[] = [];
    for (const prefix of current) {
      const abs = path.join(dir, prefix);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;
      const alternatives = segment.match(/^\{(.+)\}(\..+)?$/);
      if (segment === '*') for (const e of fs.readdirSync(abs).sort()) next.push(prefix ? `${prefix}/${e}` : e);
      else if (alternatives)
        for (const alt of alternatives[1].split(',')) next.push(`${prefix ? prefix + '/' : ''}${alt}${alternatives[2] ?? ''}`);
      else if (segment.includes('{')) {
        const [a, rest] = segment.split('{');
        const [alts, suffix] = rest.split('}');
        for (const alt of alts.split(',')) next.push(`${prefix ? prefix + '/' : ''}${a}${alt}${suffix}`);
      } else next.push(prefix ? `${prefix}/${segment}` : segment);
    }
    current = next;
  }
  return current.filter((rel) => fs.existsSync(path.join(dir, rel)) && fs.statSync(path.join(dir, rel)).isFile());
}

function importTheme(ctx: Ctx, sourceId: string, theme: ThemeConfig, framework: Draft['framework']): string | undefined {
  const files = Array.isArray(theme.file) ? theme.file : [theme.file];
  const missing = files.filter((f) => read(ctx.dir, f) === undefined);
  if (missing.length) {
    ctx.collector.skip(`${sourceId}/theme`, `Fichier de thème introuvable : ${missing.join(', ')}`);
    return;
  }
  const { css: extracted, tokens } = extractTheme(files.map((f) => read(ctx.dir, f)!).join('\n'));
  const draft = base(ctx, sourceId, 'theme', {
    name: `Thème ${theme.name}`,
    type: 'theme',
    framework,
    description: `Tokens (couleurs clair/sombre, typographie, rayons) extraits de ${files.join(' + ')}. Les styles propres au site d'origine sont exclus.`,
    tags: ['tokens', ...(Object.keys(tokens.colors.dark).length ? ['dark mode'] : [])],
    sourceUrl: blobUrl(ctx, files[0]),
    sourcePath: files.join(' + '),
    files: [{ path: 'theme.css', role: 'theme' }],
    tokens,
  });
  ctx.collector.write(draft, new Map([['theme.css', extracted]]), new Map([['LICENSE', ctx.licenseText]]));
  return draft.id;
}

/** Ajoute la démo et ses fichiers voisins importés en relatif (icônes, données de démo…). */
function attachDemo(dir: string, demo: string, files: FileMap, entries: FileEntry[]) {
  for (const rel of walk(dir, [demo], '__demo__', new Map(), {}).files) {
    if (files.has(rel)) continue;
    files.set(rel, read(dir, rel)!);
    entries.push({ path: rel, role: rel === demo ? 'demo' : rel.endsWith('.css') ? 'style' : 'demo' });
  }
}

/* ---------- Parser 1 : registre shadcn (registry.json + fichiers du repo) ---------- */

interface ShadcnItem {
  name: string;
  type: string;
  title?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files?: { path: string; type?: string; target?: string; content?: string }[];
}

function mapType(shadcnType: string, name: string, blockType: ItemType = 'section'): ItemType | null {
  if (/registry:(lib|hook|primitive|style)/.test(shadcnType)) return 'lib';
  if (shadcnType === 'registry:theme') return 'theme';
  if (shadcnType === 'registry:block') return blockType;
  if (shadcnType === 'registry:page') return 'screen';
  if (/registry:(ui|component|example)/.test(shadcnType)) return refineType(name, 'component');
  return null;
}

export const depName = (sourceId: string, dep: string) =>
  `${sourceId}/${slugify(
    dep
      .replace(/^https?:\/\/.*\/r\/(?:web\/)?/, '')
      .replace(/\.json$/, '')
      .replace(/^@[\w-]+\//, ''),
  )}`;

function mergeDeps(declared: string[] = [], found: string[] = []) {
  const byName = new Map<string, string>();
  for (const d of [...declared, ...found]) {
    const name = d.startsWith('@') ? '@' + d.slice(1).split('@')[0] : d.split('@')[0];
    if (!byName.has(name) && !/^(react|react-dom|cn)$/.test(name)) byName.set(name, d);
  }
  return [...byName.values()].sort();
}

function easyMetadata(
  ctx: Ctx,
  rel?: string,
): Map<
  string,
  {
    category?: string;
    badges?: string[];
    tagline?: string;
    features?: string[];
    props?: { name: string; type: string; default?: string; description?: string }[];
  }
> {
  const map = new Map();
  if (!rel) return map;
  const code = read(ctx.dir, rel);
  const json = code?.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/)?.[1];
  if (!json) {
    ctx.collector.warn(`Métadonnées illisibles : ${rel}`);
    return map;
  }
  for (const m of JSON.parse(json)) map.set(m.id, m);
  return map;
}

function readmeFrom(
  name: string,
  meta: { tagline?: string; features?: string[]; props?: { name: string; type: string; default?: string; description?: string }[] },
  cli?: string,
) {
  const lines = [`# ${name}`, '', meta.tagline ?? '', ''];
  if (meta.features?.length) lines.push('## Fonctionnalités', '', ...meta.features.map((f) => `- ${f}`), '');
  if (meta.props?.length)
    lines.push(
      '## Props',
      '',
      '| Prop | Type | Défaut | Description |',
      '| --- | --- | --- | --- |',
      ...meta.props.map(
        (p) =>
          `| \`${p.name}\` | \`${p.type.replace(/\|/g, '\\|')}\` | ${p.default ? '`' + p.default + '`' : '—'} | ${p.description ?? ''} |`,
      ),
      '',
    );
  if (cli) lines.push('## Installation d’origine', '', '```bash', cli, '```', '');
  lines.push('_Généré par Component Atlas depuis les métadonnées publiées par la source._');
  return lines.join('\n');
}

/** Entrées `Clé: fn(() => import('chemin'), 'export')` d'un registre de composants paresseux. */
export function lazyEntries(code: string): Map<string, { spec: string; exportName: string }> {
  const map = new Map<string, { spec: string; exportName: string }>();
  for (const m of code.matchAll(/(\w+)\s*:\s*\w+\(\s*\(\)\s*=>\s*import\(\s*['"]([^'"]+)['"]\s*\)\s*,\s*['"](\w+)['"]\s*\)/g))
    map.set(m[1], { spec: m[2], exportName: m[3] });
  return map;
}

/** Clés d'un registre utilisées par un fichier : `const { A, B } = NOM` et `NOM.A`. */
export function usedKeys(code: string, name: string): Set<string> {
  const keys = new Set<string>();
  for (const m of code.matchAll(new RegExp(`const\\s*\\{([^}]*)\\}\\s*=\\s*${name}\\b`, 'g'))) {
    for (const part of m[1].split(',')) {
      const key = part.trim().split(/\s*:\s*/)[0];
      if (/^\w+$/.test(key)) keys.add(key);
    }
  }
  for (const m of code.matchAll(new RegExp(`\\b${name}\\.(\\w+)`, 'g'))) keys.add(m[1]);
  return keys;
}

export function staticRegistry(name: string, entries: Map<string, { spec: string; exportName: string }>, keys: Set<string>): string {
  const imports: string[] = [],
    props: string[] = [];
  for (const key of [...keys].sort()) {
    const e = entries.get(key);
    if (!e) continue;
    imports.push(
      e.exportName === 'default'
        ? `import ${key} from '${e.spec}';`
        : e.exportName === key
          ? `import { ${key} } from '${e.spec}';`
          : `import { ${e.exportName} as ${key} } from '${e.spec}';`,
    );
    props.push(key);
  }
  return [
    `/* Généré par Component Atlas : version statique de ${name}, limitée aux entrées utilisées par la démo. */`,
    ...imports,
    '',
    `export const ${name} = { ${props.join(', ')} } as const;`,
    '',
  ].join('\n');
}

function routeDemo(
  ctx: Ctx,
  cfg: RouteDemos,
  itemName: string,
  self: string,
  owners: Map<string, string>,
  aliases: Aliases,
): { entry: string; files: Map<string, string> } | null {
  const entry = cfg.pattern.replaceAll('{name}', itemName);
  if (read(ctx.dir, entry) === undefined) return null;
  const regs = cfg.registries.map((r) => ({ ...r, entries: lazyEntries(read(ctx.dir, r.file) ?? '') }));
  const used = new Map(regs.map((r) => [r.name, new Set<string>()]));
  // Entrées utilisées par la démo, puis par les démos intermédiaires qu'elle charge.
  let scan = [entry];
  const seen = new Set<string>();
  for (let depth = 0; depth < 3 && scan.length; depth++) {
    const next: string[] = [];
    for (const rel of scan) {
      if (seen.has(rel)) continue;
      seen.add(rel);
      const code = read(ctx.dir, rel) ?? '';
      for (const r of regs)
        for (const key of usedKeys(code, r.name)) {
          const e = r.entries.get(key);
          if (!e) continue;
          used.get(r.name)!.add(key);
          const target = resolveInRepo(ctx.dir, r.file, e.spec, aliases, (x) => read(ctx.dir, x) !== undefined);
          if (target) next.push(target);
        }
    }
    scan = next;
  }
  const generated = new Map<string, string>();
  for (const r of regs) if (used.get(r.name)!.size) generated.set(r.file, staticRegistry(r.name, r.entries, used.get(r.name)!));
  if (generated.size) for (const [file, content] of Object.entries(cfg.reexports ?? {})) generated.set(file, content);
  const reader = (rel: string) => generated.get(rel) ?? read(ctx.dir, rel);
  const w = walk(ctx.dir, [entry], self, owners, aliases, reader);
  return { entry, files: new Map(w.files.map((rel) => [rel, reader(rel)!])) };
}

function importShadcn(ctx: Ctx & { src: ShadcnSource }) {
  const { src, dir, collector } = ctx;
  const registry = JSON.parse(read(dir, src.registry) ?? '{"items":[]}');
  const items: ShadcnItem[] = registry.items ?? [];
  const aliases = src.aliases ?? {};
  const themeId = src.theme ? importTheme(ctx, src.id, src.theme, 'agnostic') : undefined;
  const meta = easyMetadata(ctx, src.metadata);

  // Un fichier déclaré par un seul item lui « appartient » ; partagé, il est recopié dans chaque item.
  const declaredBy = new Map<string, Set<string>>();
  for (const item of items)
    for (const f of item.files ?? []) {
      const id = `${src.id}/${slugify(item.name)}`;
      declaredBy.set(f.path, (declaredBy.get(f.path) ?? new Set()).add(id));
    }
  const owners = new Map([...declaredBy].filter(([, s]) => s.size === 1).map(([p, s]) => [p, [...s][0]]));

  const demos = new Map<string, string>();
  if (src.demos)
    for (const demo of expandGlob(dir, src.demos)) {
      // Seuls les imports directs de la démo désignent le composant montré.
      const direct = importSpecifiers(read(dir, demo) ?? '')
        .map(({ spec }) => resolveInRepo(dir, demo, spec, aliases, (rel) => read(dir, rel) !== undefined))
        .map((rel) => (rel ? owners.get(rel) : undefined))
        .filter((id): id is string => !!id && !id.endsWith('/utils'));
      const owner = direct.find((id) => !demos.has(id));
      if (owner) demos.set(owner, demo);
    }

  for (const item of items) {
    const slug = slugify(item.name);
    const id = `${src.id}/${slug}`;
    const type = mapType(item.type, item.name);
    if (!type || type === 'theme') {
      collector.skip(id, `Type shadcn non géré : ${item.type}`);
      continue;
    }
    const declared = (item.files ?? []).map((f) => f.path);
    if (!declared.length) {
      collector.skip(id, 'Aucun fichier déclaré');
      continue;
    }
    const missing = declared.filter((p) => read(dir, p) === undefined);
    if (missing.length) {
      collector.skip(id, `Fichiers déclarés absents du repo : ${missing.join(', ')}`);
      continue;
    }
    const w = walk(dir, declared, id, owners, aliases);
    for (const spec of w.unresolved) collector.warn(`${id} : import interne non résolu « ${spec} »`);
    const files: FileMap = new Map(w.files.map((rel) => [rel, read(dir, rel)!]));
    const entries: FileEntry[] = w.files.map((rel) => ({
      path: rel,
      role: roleOf(rel),
      ...(item.files?.find((f) => f.path === rel)?.target ? { target: item.files!.find((f) => f.path === rel)!.target } : {}),
    }));
    let demo = demos.get(id);
    if (demo) attachDemo(dir, demo, files, entries);
    const route = !demo && src.routeDemos && type !== 'lib' ? routeDemo(ctx, src.routeDemos, item.name, id, owners, aliases) : null;
    if (route) {
      demo = route.entry;
      for (const [rel, content] of route.files)
        if (!files.has(rel)) {
          files.set(rel, content);
          entries.push({ path: rel, role: rel.endsWith('.css') ? 'style' : 'demo' });
        }
    }
    const extra = meta.get(item.name);
    if (extra) {
      files.set('README.md', readmeFrom(item.title ?? item.name, extra));
      entries.push({ path: 'README.md', role: 'doc' });
    }
    const dependencies = mergeDeps(item.dependencies, w.packages);
    const description = item.description ?? extra?.tagline ?? '';
    collector.write(
      base(ctx, src.id, slug, {
        name: item.title ?? item.name,
        type,
        framework: src.framework ?? 'react',
        description,
        tags: deriveTags(item.name, description, dependencies, [...(extra?.badges ?? []), ...(extra?.category ? [extra.category] : [])]),
        dependencies,
        registryDependencies: uniq([...(item.registryDependencies ?? []).map((d) => depName(src.id, d)), ...w.dependsOn])
          .filter((d) => d !== id)
          .sort(),
        sourceUrl: blobUrl(ctx, declared[0]),
        sourcePath: declared[0],
        files: entries,
        ...(themeId && type !== 'lib' ? { theme: themeId } : {}),
        preview:
          type === 'lib'
            ? { kind: 'none', reason: 'Utilitaire sans rendu' }
            : demo
              ? { kind: 'live', entry: demo, demo: 'source' }
              : { kind: 'live', entry: declared[0] },
      }),
      files,
      new Map([['LICENSE', ctx.licenseText]]),
    );
  }
  return [src.id];
}

/* ---------- Parser 2 : registre shadcn déjà construit (JSON par item, code inline) ---------- */

const isExample = (item: ShadcnItem) => item.type === 'registry:example' || /-(demo|example)(-[\w-]+)?$/.test(item.name);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const prettify = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
const depBase = (d: string) => (d.startsWith('@') ? '@' + d.slice(1).split('@')[0] : d.split('@')[0]);
const stripTarget = (p: string) => p.replace(/^@?\/*/, '');

/** Tags d'exemples dont le libellé visible décrit l'exemple lui-même (champs de formulaire). */
const FIELD_TAGS = new Set([
  'input',
  'label',
  'select',
  'native select',
  'textarea',
  'checkbox',
  'radio',
  'switch',
  'slider',
  'range',
  'otp',
  'date',
  'time',
  'datepicker',
  'file',
  'combobox',
  'autocomplete',
  'password',
  'search',
  'email',
  'phone',
  'number',
  'form',
]);

/** Libellé visible dans le code d'un exemple (Origin UI) : <Label>…</Label> ou premier titre. */
export function labelOf(code: string): string | undefined {
  const m = code.match(/<Label\b[^>]*>\s*([^<>{}]{3,60}?)\s*<\/Label>/) ?? code.match(/<h[1-4]\b[^>]*>\s*([^<>{}]{3,60}?)\s*<\/h[1-4]>/);
  const text = m?.[1].replace(/\s+/g, ' ').trim();
  return text && /[a-z]/i.test(text) ? capitalize(text) : undefined;
}

/** Paquets npm importés par un fichier (hors alias internes, relatifs, react, cn et imports de type). */
function packagesOf(code: string): string[] {
  const out = new Set<string>();
  for (const { spec, typeOnly } of importSpecifiers(code)) {
    if (
      typeOnly ||
      spec.startsWith('.') ||
      spec.startsWith('@/') ||
      spec === 'cn' ||
      /^(react|react-dom)(\/|$)/.test(spec) ||
      /^node:/.test(spec)
    )
      continue;
    out.add(spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0]);
  }
  return [...out].sort();
}

/** Primitives propres à la source (ReUI : Base UI) : un utilitaire par fichier, rangé à son emplacement cible. */
function importPrimitives(ctx: Ctx, variant: Variant): { ids: Map<string, string>; owners: Map<string, string> } {
  const ids = new Map<string, string>(),
    owners = new Map<string, string>();
  const sets = variant.primitives!.map((set) => {
    const abs = path.join(ctx.dir, set.dir);
    if (!fs.existsSync(abs)) {
      ctx.collector.warn(`${variant.id} : primitives introuvables (${set.dir})`);
      return { set, files: [] as string[] };
    }
    const files = fs
      .readdirSync(abs)
      .filter((f) => /\.tsx?$/.test(f) && !f.startsWith('_'))
      .sort();
    for (const f of files) {
      const id = `${variant.id}/${set.idPrefix}${slugify(f.replace(/\.tsx?$/, ''))}`;
      if (!ids.has(f.replace(/\.tsx?$/, ''))) ids.set(f.replace(/\.tsx?$/, ''), id);
      owners.set(`${set.target}/${f}`, id);
    }
    return { set, files };
  });
  for (const { set, files } of sets)
    for (const f of files) {
      const name = f.replace(/\.tsx?$/, '');
      const code = read(ctx.dir, `${set.dir}/${f}`)!;
      const regDeps = new Set<string>();
      for (const { spec } of importSpecifiers(code)) {
        const other = sets.find(({ set: s }) => spec.startsWith(s.prefix));
        if (!other) continue;
        const dep = `${other.set.target}/${spec.slice(other.set.prefix.length)}`;
        const owner = owners.get(`${dep}.tsx`) ?? owners.get(`${dep}.ts`);
        if (owner && owner !== owners.get(`${set.target}/${f}`)) regDeps.add(owner);
      }
      const stored = `${set.target}/${f}`;
      const hook = /^use-/.test(name);
      ctx.collector.write(
        base(ctx, variant.id, `${set.idPrefix}${slugify(name)}`, {
          name: hook ? name : `${prettify(name)} (primitive ${ctx.src.name})`,
          type: 'lib',
          framework: variant.framework,
          description: hook
            ? `Hook ${name} de ${ctx.src.name}, utilisé par ses composants et ses exemples.`
            : `Primitive Base UI de ${ctx.src.name} (${name}) : utilisée par ses composants et ses exemples à la place de la version Radix de shadcn.`,
          tags: hook ? ['hook'] : ['primitive', 'base-ui'],
          dependencies: mergeDeps([], packagesOf(code)),
          registryDependencies: [...regDeps].sort(),
          sourceUrl: blobUrl(ctx, `${set.dir}/${f}`),
          sourcePath: `${set.dir}/${f}`,
          files: [{ path: stored, role: 'source', target: stored }],
          preview: { kind: 'none', reason: hook ? 'Hook sans rendu' : 'Primitive sans rendu propre' },
        }),
        new Map([[stored, code]]),
        new Map([['LICENSE', ctx.licenseText]]),
      );
    }
  return { ids, owners };
}

interface ExampleMeta {
  name: string;
  title?: string;
  description?: string;
  descriptionLong?: string;
  categories?: string[];
  registryDependencies?: string[];
  dependencies?: string[];
  files: { path: string; target?: string }[];
  meta?: { label?: string; order?: number };
}

/** Description utile d'un exemple : phrases de la description longue, sans le texte promotionnel. */
const exampleDescription = (ex: ExampleMeta) =>
  (ex.descriptionLong ?? ex.description ?? '')
    .split(/(?<=\.)\s+/)
    .filter((s) => s && !/free, open source|npx shadcn|install with|edit as your own/i.test(s))
    .slice(0, 2)
    .join(' ');

function loadExamples(ctx: Ctx, variant: Variant): ExampleMeta[] {
  const dir = path.join(ctx.dir, variant.examples!.meta);
  if (!fs.existsSync(dir)) {
    ctx.collector.warn(`${variant.id} : métadonnées d'exemples introuvables (${variant.examples!.meta})`);
    return [];
  }
  const out: ExampleMeta[] = [];
  for (const f of fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const items = Array.isArray(json) ? json : json.items;
    if (Array.isArray(items)) out.push(...items.filter((i: ExampleMeta) => i?.name && i.files?.length));
  }
  return out.sort(
    (a, b) =>
      (a.categories?.[0] ?? '').localeCompare(b.categories?.[0] ?? '') ||
      (a.meta?.order ?? 0) - (b.meta?.order ?? 0) ||
      a.name.localeCompare(b.name, 'en', { numeric: true }),
  );
}

/**
 * Fichiers d'un exemple : les fichiers déclarés et leurs voisins importés en relatif, rangés par
 * rapport au dossier des exemples. Un fichier déclaré hors de ce dossier (ReUI : logos
 * `../../../components/ui/svgs/x.tsx`) est rangé à son emplacement cible (`components/ui/svgs/x.tsx`).
 */
function exampleFiles(ctx: Ctx, root: string, ex: ExampleMeta): Map<string, string> | null {
  const files = new Map<string, string>();
  const queue = ex.files.map((f) => ({ rel: f.path, target: f.target }));
  while (queue.length) {
    const { rel, target } = queue.shift()!;
    const repoRel = path.posix.normalize(`${root}/${rel}`);
    const inside = repoRel.startsWith(`${root}/`);
    if (!inside && repoRel.startsWith('..')) continue;
    const stored = inside ? repoRel.slice(root.length + 1) : target ? stripTarget(target) : repoRel;
    if (files.has(stored)) continue;
    const code = read(ctx.dir, repoRel);
    if (code === undefined) {
      if (files.size) continue;
      return null;
    }
    files.set(stored, code);
    if (!inside) continue;
    for (const { spec } of importSpecifiers(code)) {
      if (!spec.startsWith('.')) continue;
      const next = resolveInRepo(
        path.join(ctx.dir, root),
        stored,
        spec,
        {},
        (x) => read(ctx.dir, path.posix.normalize(`${root}/${x}`)) !== undefined,
      );
      if (next && !next.startsWith('..')) queue.push({ rel: next, target: undefined });
    }
  }
  return files;
}

type Parsed = { file: string; item: ShadcnItem & { meta?: { tags?: string[] } } };

/** Sons (React Bits) : le moteur Web Audio comme utilitaire, chaque recette comme item `sound`. */
function importSounds(ctx: Ctx, variant: Variant, parsed: Parsed[], themeId?: string): Parsed[] {
  const { prefix, suffix, engine } = variant.sounds!;
  // Une recette = un item qui dépend du moteur (variantes TS et JS) ; le reste suit le circuit normal.
  const engineBase = engine.replace(suffix, '');
  const usesEngine = (p: Parsed) => (p.item.registryDependencies ?? []).some((d) => d.includes(engineBase));
  const engineItem = parsed.find((p) => p.item.name === engine);
  const recipes = parsed.filter((p) => p.item.name.startsWith(prefix) && p.item.name.endsWith(suffix) && usesEngine(p));
  const rest = parsed.filter((p) => !p.item.name.startsWith(engineBase) && !usesEngine(p));
  if (!engineItem) {
    ctx.collector.warn(`${variant.id} : moteur de sons ${engine} introuvable, sons ignorés`);
    return rest;
  }
  const fileMap = (item: ShadcnItem) =>
    new Map((item.files ?? []).filter((f) => typeof f.content === 'string').map((f) => [stripTarget(f.target || f.path), f.content!]));
  const engineId = `${variant.id}/sound-engine`;
  const engineFiles = fileMap(engineItem.item);
  ctx.collector.write(
    base(ctx, variant.id, 'sound-engine', {
      name: `Moteur de sons ${ctx.src.name}`,
      type: 'lib',
      framework: variant.framework,
      description: engineItem.item.description ?? 'Moteur Web Audio qui rend et joue les sons.',
      tags: ['son', 'web audio'],
      dependencies: mergeDeps(engineItem.item.dependencies, [...engineFiles.values()].flatMap(packagesOf)),
      sourceUrl: blobUrl(ctx, `${variant.dir}/${engineItem.file}`),
      sourcePath: `${variant.dir}/${engineItem.file}`,
      files: [...engineFiles.keys()].map((p) => ({ path: p, role: 'source' as const, target: p })),
      preview: { kind: 'none', reason: 'Moteur audio sans rendu' },
    }),
    engineFiles,
    new Map([['LICENSE', ctx.licenseText]]),
  );
  for (const { file, item } of recipes) {
    const raw = item.name.slice(prefix.length, -suffix.length);
    const files = fileMap(item);
    if (!files.size) continue;
    const label = prettify(raw);
    ctx.collector.write(
      base(ctx, variant.id, `sound-${slugify(raw)}`, {
        name: `Son ${label}`,
        type: 'sound',
        framework: variant.framework,
        category: 'Sons',
        description: item.description ?? `Son d’interface « ${label} ».`,
        tags: ['son', 'web audio', 'feedback'],
        registryDependencies: [engineId],
        sound: { engine: 'react-bits', names: [raw] },
        sourceUrl: blobUrl(ctx, `${variant.dir}/${file}`),
        sourcePath: `${variant.dir}/${file}`,
        files: [...files.keys()].map((p) => ({ path: p, role: 'source' as const, target: p })),
        ...(themeId ? { theme: themeId } : {}),
        preview: { kind: 'live', entry: [...files.keys()][0] },
      }),
      files,
      new Map([['LICENSE', ctx.licenseText]]),
    );
  }
  ctx.collector.warn(`${variant.id} : ${recipes.length} sons importés (moteur ${engine})`);
  return rest;
}

function importBuilt(ctx: Ctx & { src: BuiltSource }) {
  const { src, dir, collector } = ctx;
  for (const variant of src.variants) {
    const abs = path.join(dir, variant.dir);
    const jsons = fs
      .readdirSync(abs)
      .filter((f) => f.endsWith('.json') && f !== 'registry.json' && f !== 'index.json')
      .sort();
    let parsed = jsons
      .map((f) => ({
        file: f,
        item: JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8')) as ShadcnItem & { meta?: { tags?: string[] } },
      }))
      .filter(({ item }) => item && !Array.isArray(item) && item.name);
    // ReUI : fichiers publiés à plat mais importés selon leur emplacement cible (components/reui/…).
    for (const { item } of parsed)
      for (const f of item.files ?? []) f.path = ((variant.targetPaths && f.target) || f.path).replace(/^@?\/+/, '');

    // Métadonnées complémentaires (Origin UI : meta.tags ; React Bits : titres).
    if (variant.index) {
      const index = JSON.parse(read(dir, variant.index) ?? '{"items":[]}');
      const byName = new Map<string, Record<string, unknown>>(
        ((Array.isArray(index) ? index : index.items) ?? []).map((i: { name: string }) => [i.name, i]),
      );
      for (const p of parsed) {
        const extra = byName.get(p.item.name);
        if (extra)
          p.item = {
            ...extra,
            ...p.item,
            title: p.item.title ?? (extra.title as string),
            description: p.item.description || (extra.description as string),
            meta: (p.item.meta ?? extra.meta) as { tags?: string[] },
          };
      }
    }

    // Sons (React Bits) : recettes + moteur, avant le tri des variantes qui les écarterait.
    if (variant.sounds) parsed = importSounds(ctx, variant, parsed);

    // Une variante par composant (ex. TS + Tailwind), nom de base sans suffixe.
    if (variant.variantSuffixes) {
      const chosen = new Map<string, (typeof parsed)[number]>();
      for (const suffix of variant.variantSuffixes) {
        for (const p of parsed) {
          if (!p.item.name.endsWith(suffix)) continue;
          const baseName = p.item.name.slice(0, -suffix.length);
          if (!chosen.has(baseName)) chosen.set(baseName, { ...p, item: { ...p.item, name: baseName } });
        }
      }
      collector.warn(
        `${variant.id} : ${chosen.size} composants retenus (variantes ${variant.variantSuffixes.join(' puis ')}) sur ${parsed.length} fichiers`,
      );
      parsed = [...chosen.values()];
    }

    let themeId = variant.theme ? importTheme(ctx, variant.id, variant.theme, 'agnostic') : undefined;
    const examples = parsed.filter(({ item }) => isExample(item));
    const components = parsed.filter(({ item }) => !isExample(item));
    const names = new Set(components.map(({ item }) => item.name));

    // Exemples officiels rattachés au composant qu'ils montrent : ils servent de démo d'usage et d'aperçu live.
    const demosFor = new Map<string, ShadcnItem[]>();
    for (const { item } of examples) {
      const deps = (item.registryDependencies ?? []).map((d) =>
        d
          .replace(/^https?:\/\/.*\/r\/(?:web\/)?/, '')
          .replace(/\.json$/, '')
          .replace(/^@[\w-]+\//, ''),
      );
      const byPrefix = item.name.replace(/-(demo|example)(-[\w-]+)?$/, '');
      const target = names.has(byPrefix)
        ? byPrefix
        : (deps.find((d) => names.has(d) && item.name.startsWith(d)) ?? deps.find((d) => names.has(d)));
      if (!target) continue;
      demosFor.set(target, [...(demosFor.get(target) ?? []), item]);
    }

    const inline = new Map(components.flatMap(({ item }) => (item.files ?? []).map((f) => [f.path, f.content ?? ''] as const)));
    const owners = new Map(
      components.flatMap(({ item }) => (item.files ?? []).map((f) => [f.path, `${variant.id}/${slugify(item.name)}`] as const)),
    );
    const listed = variant.componentList
      ? new Set<string>(JSON.parse(read(dir, variant.componentList.file) ?? '{}')[variant.componentList.key] ?? [])
      : null;
    const local = new Set(
      variant.skipExisting
        ? allMeta()
            .filter(({ meta }) => meta.preview.kind === 'atlas-demo')
            .map(({ meta }) => meta.id)
        : [],
    );
    const fallback = variant.fallbackSource ? new Set(existingIds(variant.fallbackSource)) : new Set<string>();
    const primitives = variant.primitives
      ? importPrimitives(ctx, variant)
      : { ids: new Map<string, string>(), owners: new Map<string, string>() };
    const exampleMetas = variant.examples ? loadExamples(ctx, variant) : [];
    const familyOf = (ex: ExampleMeta) => ex.categories?.[0] ?? ex.name.replace(/^c-/, '').replace(/-\d+$/, '');
    const families = new Map<string, ExampleMeta[]>();
    for (const ex of exampleMetas) families.set(familyOf(ex), [...(families.get(familyOf(ex)) ?? []), ex]);
    const blocked = new Set(variant.noPreviewPackages ?? []);
    const resolveDep = (d: string) => {
      const own = depName(variant.id, d);
      const short = own.split('/')[1];
      if (/^https?:/.test(d) && !d.includes(variant.id) && !names.has(short)) return own;
      // ReUI : « @reui/badge » = composant de la source ; « badge » = sa primitive Base UI si elle existe.
      if (names.has(short) && (/^@[\w-]+\//.test(d) || !primitives.ids.has(short))) return own;
      if (primitives.ids.has(short)) return primitives.ids.get(short)!;
      const alt = `${variant.fallbackSource}/${short}`;
      return fallback.has(alt) ? alt : own;
    };
    // Item qui fournit le fichier visé par un import aliasé (exemples ReUI).
    const aliasList = Object.entries(variant.aliases ?? {}).sort((a, b) => b[0].length - a[0].length);
    const ownerOfSpec = (spec: string) => {
      const hit = aliasList.find(([a]) => spec.startsWith(a));
      if (!hit) return undefined;
      const target = hit[1] + spec.slice(hit[0].length);
      for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
        const o = owners.get(target + ext) ?? primitives.owners.get(target + ext);
        if (o) return o;
      }
      return undefined;
    };

    for (const { file, item } of components) {
      const slug = slugify(item.name);
      const id = `${variant.id}/${slug}`;
      if (local.has(id)) {
        collector.keep(id);
        continue;
      }
      let type = mapType(item.type, item.name, variant.blockType);
      if (listed && type === 'component' && !listed.has(item.name)) type = 'lib';
      // Sous-partie d'une famille qui a ses exemples (data-grid-table…) : utilitaire, la famille montre les exemples.
      if (
        families.size &&
        type === 'component' &&
        !families.has(item.name) &&
        [...families.keys()].some((f) => item.name.startsWith(`${f}-`))
      )
        type = 'lib';
      if (!type || (type as string) === 'font') {
        collector.skip(id, `Type shadcn non géré : ${item.type}`);
        continue;
      }
      const itemFiles = (item.files ?? []).filter((f) => typeof f.content === 'string');
      if (!itemFiles.length) {
        collector.skip(id, 'Aucun contenu inline');
        continue;
      }
      const files: FileMap = new Map(itemFiles.map((f) => [f.path, f.content!]));
      let entries: FileEntry[] = itemFiles.map((f) => ({
        path: f.path,
        role: type === 'theme' ? 'theme' : roleOf(f.path),
        ...(f.target ? { target: f.target } : {}),
      }));
      const w = walk(
        dir,
        itemFiles.map((f) => f.path),
        id,
        owners,
        variant.aliases ?? {},
        (rel) => inline.get(rel),
      );
      let demo: string | undefined;
      if (variant.demos && type !== 'lib' && type !== 'theme') {
        const candidates = expandGlob(dir, variant.demos, item.name);
        const folder = path.join(dir, path.dirname(variant.demos.replaceAll('{name}', item.name)));
        demo =
          candidates[0] ??
          (fs.existsSync(folder)
            ? fs
                .readdirSync(folder)
                .filter((f) => f.endsWith('.tsx') && f !== 'thumb.tsx')
                .sort()
                .map((f) => toPosix(path.relative(dir, path.join(folder, f))))[0]
            : undefined);
        if (demo) attachDemo(dir, demo, files, entries);
      }
      const official = (demosFor.get(item.name) ?? []).sort(
        (a, b) => Number(b.name === `${item.name}-demo`) - Number(a.name === `${item.name}-demo`) || a.name.localeCompare(b.name),
      );
      for (const example of official.slice(0, 4))
        for (const f of example.files ?? []) {
          if (typeof f.content !== 'string' || files.has(f.path)) continue;
          files.set(f.path, f.content);
          entries.push({ path: f.path, role: 'demo' });
          demo = demo ?? f.path;
        }
      // Famille avec exemples officiels décrits (ReUI) : les premiers servent de démo et d'aperçu.
      if (type !== 'lib' && type !== 'theme')
        for (const ex of (families.get(item.name) ?? []).slice(0, 3)) {
          for (const [rel, content] of exampleFiles(ctx, variant.examples!.root, ex) ?? []) {
            if (files.has(rel)) continue;
            files.set(rel, content);
            entries.push({ path: rel, role: 'demo' });
            demo = demo ?? rel;
          }
        }
      if (type === 'theme') {
        const { tokens } = extractTheme(itemFiles.map((f) => f.content).join('\n'));
        entries = entries.map((e) => ({ ...e, role: 'theme' }));
        themeId = themeId ?? id;
        collector.write(
          base(ctx, variant.id, slug, {
            name: `Thème ${src.name}${variant.framework === 'react-native' ? ' (React Native)' : ''}`,
            type,
            framework: variant.framework,
            description: item.description ?? '',
            tags: ['tokens'],
            files: entries,
            tokens,
            sourceUrl: blobUrl(ctx, `${variant.dir}/${file}`),
            sourcePath: `${variant.dir}/${file}`,
          }),
          files,
          new Map([['LICENSE', ctx.licenseText]]),
        );
        continue;
      }
      const tags = item.meta?.tags ?? [];
      const number = item.name.match(/(\d+)$/)?.[1];
      // Origin UI : nom tiré du libellé visible dans le code (« Simple input »), sinon des tags (« Input 01 »).
      // Le libellé ne nomme l'exemple que pour un champ de formulaire (« Simple input ») ; ailleurs
      // (tableau avec « Rows per page »…) c'est un contrôle secondaire : nom tiré des tags.
      const label = variant.nameFromTags && FIELD_TAGS.has(tags[0]) ? labelOf(itemFiles[0].content ?? '') : undefined;
      const labelled =
        label && !label.includes(' ') && tags[0] && normalize(label) !== normalize(tags[0]) ? `${label} (${tags[0]})` : label;
      const name =
        item.title ??
        labelled ??
        (variant.nameFromTags && tags.length ? `${capitalize(tags[0])}${number ? ` ${number}` : ''}` : prettify(item.name));
      const dependencies = mergeDeps(item.dependencies, w.packages);
      const description = item.description || (tags.length ? `Exemple ${src.name} : ${tags.join(', ')}.` : '');
      const blockedPkg = dependencies.map(depBase).find((d) => blocked.has(d));
      collector.write(
        base(ctx, variant.id, slug, {
          name,
          type,
          framework: variant.framework,
          description,
          tags: deriveTags(`${item.name} ${name}`, description, dependencies, [
            variant.framework === 'react-native' ? 'expo' : 'web',
            ...tags,
          ]),
          dependencies,
          registryDependencies: uniq([...(item.registryDependencies ?? []).map(resolveDep), ...w.dependsOn])
            .filter((d) => d !== id)
            .sort(),
          sourceUrl: blobUrl(ctx, `${variant.dir}/${file}`),
          sourcePath: `${variant.dir}/${file}`,
          files: entries,
          ...(themeId && type !== 'lib' ? { theme: themeId } : {}),
          preview:
            variant.framework === 'react-native'
              ? { kind: 'none', reason: 'Composant React Native (Expo) : pas de rendu web' }
              : type === 'lib'
                ? { kind: 'none', reason: 'Utilitaire sans rendu' }
                : blockedPkg
                  ? { kind: 'none', reason: `Aperçu désactivé : dépend de ${blockedPkg} (paquet non vérifié)` }
                  : demo
                    ? { kind: 'live', entry: demo, demo: 'source' }
                    : { kind: 'live', entry: itemFiles[0].path },
        }),
        files,
        new Map([['LICENSE', ctx.licenseText]]),
      );
    }

    // Exemples officiels (ReUI) : un item interactif chacun, nommé et décrit par la source.
    for (const ex of exampleMetas) {
      const slug = slugify(ex.name);
      const id = `${variant.id}/${slug}`;
      const exFiles = exampleFiles(ctx, variant.examples!.root, ex);
      if (!exFiles?.size) {
        collector.skip(id, 'Fichier d’exemple absent du repo');
        continue;
      }
      const code = [...exFiles.values()].join('\n');
      const registryDependencies = uniq(
        importSpecifiers(code)
          .map(({ spec }) => ownerOfSpec(spec))
          .filter((o): o is string => !!o && o !== id),
      ).sort();
      const dependencies = mergeDeps(ex.dependencies, packagesOf(code));
      const family = familyOf(ex);
      const name = ex.title ?? prettify(ex.name);
      const description = exampleDescription(ex) || `${prettify(family)} : ${ex.meta?.label ?? name}.`;
      const blockedPkg = dependencies.map(depBase).find((d) => blocked.has(d));
      const entry = ex.files[0].path;
      // Catégorie d'après la famille (data-grid → Tableaux de données), le titre ne servant qu'en repli.
      const byFamily = classify(family.replace(/-/g, ' '));
      collector.write(
        base(ctx, variant.id, slug, {
          name,
          category: byFamily !== 'Autres composants' ? byFamily : classify(`${family} ${name}`, description),
          type: refineType(name, 'component'),
          framework: variant.framework,
          description,
          tags: deriveTags(`${family} ${name}`, description, dependencies, ['exemple', family, ...(ex.meta?.label ? [ex.meta.label] : [])]),
          dependencies,
          registryDependencies,
          sourceUrl: blobUrl(ctx, `${variant.examples!.root}/${entry}`),
          sourcePath: `${variant.examples!.root}/${entry}`,
          files: [...exFiles.keys()].map((p) => ({ path: p, role: roleOf(p) })),
          ...(themeId ? { theme: themeId } : {}),
          preview: blockedPkg
            ? { kind: 'none', reason: `Aperçu désactivé : dépend de ${blockedPkg} (paquet non vérifié)` }
            : { kind: 'live', entry },
        }),
        exFiles,
        new Map([['LICENSE', ctx.licenseText]]),
      );
    }
    if (exampleMetas.length) collector.warn(`${variant.id} : ${exampleMetas.length} exemples officiels, ${families.size} familles`);
  }
  return src.variants.map((v) => v.id);
}

/* ---------- Parser 3 : un dossier par bloc (Bencho) ---------- */

/** Sons Bencho : un fichier sounds.ts (Web Audio, sans fichier audio) → un item `sound` par son. */
function importBencho(ctx: Ctx, rel: string) {
  const code = read(ctx.dir, rel);
  if (!code) {
    ctx.collector.warn(`${ctx.src.id} : ${rel} introuvable, sons ignorés`);
    return;
  }
  const block = code.slice(code.indexOf('export const SOUNDS'), code.indexOf('export type SoundName'));
  const families = new Map([...code.matchAll(/\/\*\s*(\w+)\s*·\s*([\w ]+?)\s*\*\/\s*\n\s*(\w+):/g)].map((m) => [m[3], m[2]]));
  const names = [...block.matchAll(/^\s{2}(\w+):\s*\[/gm)].map((m) => m[1]);
  // « Beacon and Plop are rebuilt from cuelume by … (MIT, © …) » : crédit tiers repris sur les sons concernés.
  const rebuiltMatch = code.match(/([A-Z]\w+(?:,? (?:and )?[A-Z]\w+)*)\s+(?:is|are)\s+rebuilt\s+from\s+([\s\S]+?\))/);
  const rebuilt = rebuiltMatch ? [rebuiltMatch[0], rebuiltMatch[1], rebuiltMatch[2].replace(/\s+/g, ' ')] : null;
  const credited = new Set((rebuilt?.[1] ?? '').split(/,? and |, /).map((s) => s.trim().toLowerCase()));
  for (const name of names) {
    const label = capitalize(name);
    const family = families.get(name);
    ctx.collector.write(
      base(ctx, ctx.src.id, `sound-${slugify(name)}`, {
        ...(credited.has(name) && rebuilt
          ? {
              licenseNotes: [ctx.license.notes, `Son reconstruit d’après ${rebuilt[2]} (voir THIRD_PARTY.md de la source).`]
                .filter(Boolean)
                .join(' '),
            }
          : {}),
        name: `Son ${label}`,
        type: 'sound',
        framework: 'react',
        category: 'Sons',
        description: `Son d’interface « ${label} »${family ? ` (${family.toLowerCase()})` : ''} : play("${name}"), synthétisé en Web Audio, sans fichier audio ni dépendance.`,
        tags: ['son', 'web audio', ...(family ? [family.toLowerCase()] : [])],
        sound: { engine: 'bencho', names: [name] },
        sourceUrl: blobUrl(ctx, rel),
        sourcePath: rel,
        files: [{ path: rel, role: 'source' }],
        preview: { kind: 'live', entry: rel },
      }),
      new Map([[rel, code]]),
      new Map([['LICENSE', ctx.licenseText]]),
    );
  }
  ctx.collector.warn(`${ctx.src.id} : ${names.length} sons importés depuis ${rel}`);
}

function importBlocks(ctx: Ctx & { src: BlocksSource }) {
  const { src, dir, collector } = ctx;
  for (const excluded of src.exclude)
    if (fs.existsSync(path.join(dir, excluded)))
      collector.skip(
        excluded + '/',
        excluded === 'assets'
          ? 'Visuels et photos : hors licence ou non nécessaires (exclus)'
          : 'Application de démonstration du repo (exclue)',
      );
  const themeId = src.theme ? importTheme(ctx, src.id, src.theme, 'agnostic') : undefined;
  if (src.sounds) importBencho(ctx, src.sounds);
  const root = path.join(dir, src.blocks);
  const owners = new Map<string, string>();
  for (const folder of fs.readdirSync(root).sort()) {
    const abs = path.join(root, folder);
    if (!fs.statSync(abs).isDirectory()) continue;
    const slug = slugify(folder);
    const id = `${src.id}/${slug}`;
    const readme = read(root, `${folder}/README.md`) ?? '';
    if (src.excludeReadme && new RegExp(src.excludeReadme, 'i').test(readme)) {
      collector.skip(id, 'Bloc Pro / payant (exclu)');
      continue;
    }
    const usage = readme.match(/import\s*\{\s*(\w+)\s*\}\s*from\s*["']\.\/(\w+)["']/);
    const tsx = fs
      .readdirSync(abs)
      .filter((f) => /\.tsx?$/.test(f))
      .sort();
    const entry = usage ? `${usage[2]}.tsx` : tsx[0];
    if (!entry || !tsx.includes(entry)) {
      collector.skip(id, 'Aucun composant TSX trouvé');
      continue;
    }
    const rels = fs
      .readdirSync(abs)
      .filter((f) => /\.(tsx?|css|md)$/.test(f))
      .map((f) => `${src.blocks}/${folder}/${f}`);
    const w = walk(
      dir,
      rels.filter((r) => !r.endsWith('.md')),
      id,
      owners,
      src.aliases ?? {},
    );
    for (const spec of w.unresolved) collector.warn(`${id} : import interne non résolu « ${spec} »`);
    const all = uniq([...rels, ...w.files]).sort();
    const files: FileMap = new Map(all.map((rel) => [rel, read(dir, rel)!]));
    const title = readme.match(/^#\s+(.+)$/m)?.[1].trim() ?? folder;
    const description =
      readme
        .split('\n')
        .map((l) => l.trim())
        .find((l) => l && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('[')) ?? '';
    const installed =
      readme
        .match(/npm install ([^\n`]+)/)?.[1]
        .trim()
        .split(/\s+/) ?? [];
    const dependencies = mergeDeps(installed, w.packages);
    const entryPath = `${src.blocks}/${folder}/${entry}`;
    collector.write(
      base(ctx, src.id, slug, {
        name: title,
        type: refineType(title, 'component'),
        framework: src.framework ?? 'react',
        description,
        tags: deriveTags(
          `${folder} ${title}`,
          description,
          dependencies,
          readme.match(/·\s*(\w[\w ]*)\s*$/m)?.[1] ? [readme.match(/·\s*(\w[\w ]*)\s*$/m)![1]] : [],
        ),
        dependencies,
        sourceUrl: `${src.repo}/tree/${ctx.commit}/${src.blocks}/${folder}`,
        sourcePath: `${src.blocks}/${folder}`,
        files: all.map((rel) => ({ path: rel, role: roleOf(rel) })),
        ...(themeId ? { theme: themeId } : {}),
        preview: { kind: 'live', entry: entryPath, ...(usage ? { exportName: usage[1] } : {}) },
      }),
      files,
      new Map([['LICENSE', ctx.licenseText]]),
    );
  }
  return [src.id];
}

/* ---------- Orchestration ---------- */

export function loadSources(): Source[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'importers', 'sources.json'), 'utf8')).github;
}

/* Commits verrouillés : un import reproduit exactement le registre ; `npm run update` les fait avancer. */
const LOCK_FILE = path.join(ROOT, 'importers', 'lock.json');
export interface LockEntry {
  commit: string;
  importedAt: string;
}
export function readLock(): Record<string, LockEntry> {
  try {
    return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8')).sources ?? {};
  } catch {
    return {};
  }
}
function writeLock(sources: Record<string, LockEntry>) {
  const sorted = Object.fromEntries(Object.entries(sources).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(
    LOCK_FILE,
    JSON.stringify(
      {
        $comment:
          'Commit importé par source. npm run import réutilise ces commits ; npm run update prend les derniers et met ce fichier à jour.',
        sources: sorted,
      },
      null,
      2,
    ) + '\n',
  );
}

export function importGithub(options: { only?: string; offline?: boolean; update?: boolean } = {}) {
  const runs = [];
  const lock = readLock();
  for (const src of loadSources()) {
    if (options.only && options.only !== src.id) continue;
    const locked = options.update ? undefined : lock[src.id]?.commit;
    const { dir, commit } = syncRepo(src.id, src.repo, { offline: options.offline, commit: locked, sparse: src.sparse });
    const licenseText = readLicenseText(dir);
    const license = checkLicense(licenseText, src.acceptRestricted);
    const collector = new Collector('github', src.id, { commit, license: license.license });
    const sourceIds = src.parser === 'shadcn-built' ? src.variants.map((v) => v.id) : [src.id];
    if (license.status === 'rejected' || !licenseText) {
      collector.skip(src.repo, license.reason);
      runs.push(collector.finish(sourceIds));
      continue;
    }
    console.log(`→ ${src.name} @ ${commit.slice(0, 7)} — ${license.reason}`);
    const ctx = { src, dir, commit, license, licenseText, collector } as Ctx;
    if (src.parser === 'shadcn-registry') importShadcn(ctx as Ctx & { src: ShadcnSource });
    else if (src.parser === 'shadcn-built') importBuilt(ctx as Ctx & { src: BuiltSource });
    else if (src.parser === 'folder-blocks') importBlocks(ctx as Ctx & { src: BlocksSource });
    runs.push(collector.finish(sourceIds));
    // Verrou avancé seulement après un import complet sous licence acceptée.
    if (lock[src.id]?.commit !== commit) {
      lock[src.id] = { commit, importedAt: new Date().toISOString() };
      writeLock(lock);
    }
  }
  return runs;
}

/** Sources dont la branche par défaut a avancé depuis le commit verrouillé (aucun téléchargement de code). */
export function outdated(): { id: string; name: string; locked?: string; latest: string; behind: boolean }[] {
  const lock = readLock();
  return loadSources().map((src) => {
    const latest = remoteHead(src.repo);
    return { id: src.id, name: src.name, locked: lock[src.id]?.commit, latest, behind: lock[src.id]?.commit !== latest };
  });
}
