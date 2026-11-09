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
import { readLicenseText, syncRepo } from './lib/git.js';
import { importSpecifiers, resolveInRepo, walk, type Aliases } from './lib/graph.js';
import { extractTheme } from './lib/css-tokens.js';
import { Collector } from './lib/collector.js';

interface ThemeConfig { file: string | string[]; name: string }
interface BaseSource { id: string; name: string; repo: string; homepage: string; parser: string; framework?: 'react' | 'react-native'; acceptRestricted?: RestrictedAcceptance; theme?: ThemeConfig; aliases?: Aliases; demos?: string }
interface ShadcnSource extends BaseSource { parser: 'shadcn-registry'; registry: string; metadata?: string }
interface Variant {
  id: string; dir: string; framework: 'react' | 'react-native'; blockType?: ItemType; aliases?: Aliases; demos?: string; theme?: ThemeConfig; componentList?: { file: string; key: string };
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
}
interface BuiltSource extends BaseSource { parser: 'shadcn-built'; variants: Variant[] }
interface BlocksSource extends BaseSource { parser: 'folder-blocks'; blocks: string; exclude: string[]; excludeReadme?: string }
type Source = ShadcnSource | BuiltSource | BlocksSource;

export const slugify = (s: string) => normalize(s.replace(/([a-z0-9])([A-Z])/g, '$1-$2')).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface Ctx { src: Source; dir: string; commit: string; license: LicenseCheck; licenseText: string; collector: Collector }

const read = (dir: string, rel: string) => { const f = path.join(dir, rel); return fs.existsSync(f) && fs.statSync(f).isFile() ? fs.readFileSync(f, 'utf8') : undefined; };
const roleOf = (rel: string): FileEntry['role'] => (/\.css$/.test(rel) ? 'style' : /\.mdx?$/.test(rel) ? 'doc' : 'source');
const blobUrl = (ctx: Ctx, rel: string) => `${ctx.src.repo}/blob/${ctx.commit}/${rel.split('/').map(encodeURIComponent).join('/')}`;
const uniq = <T,>(xs: T[]) => [...new Set(xs)];

function copyright(text: string): string | undefined {
  return text.match(/^\s*Copyright[^\n]+/im)?.[0].trim();
}

function base(ctx: Ctx, sourceId: string, slug: string, fields: Pick<Draft, 'name' | 'type' | 'framework' | 'description'> & Partial<Draft>): Draft {
  const { license } = ctx;
  const attribution = license.attribution ?? (copyright(ctx.licenseText) ? `Conserver la notice ${license.license} : ${copyright(ctx.licenseText)}` : undefined);
  return {
    id: `${sourceId}/${slug}`,
    category: fields.type === 'lib' ? 'Utilitaires' : fields.type === 'theme' ? 'Thèmes' : classify(`${slug} ${fields.name}`, fields.description),
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
  const segments = pattern.replace('{name}', name ?? '*').split('/');
  let current = [''];
  for (const segment of segments) {
    const next: string[] = [];
    for (const prefix of current) {
      const abs = path.join(dir, prefix);
      if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;
      const alternatives = segment.match(/^\{(.+)\}(\..+)?$/);
      if (segment === '*') for (const e of fs.readdirSync(abs).sort()) next.push(prefix ? `${prefix}/${e}` : e);
      else if (alternatives) for (const alt of alternatives[1].split(',')) next.push(`${prefix ? prefix + '/' : ''}${alt}${alternatives[2] ?? ''}`);
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
  if (missing.length) { ctx.collector.skip(`${sourceId}/theme`, `Fichier de thème introuvable : ${missing.join(', ')}`); return; }
  const { css: extracted, tokens } = extractTheme(files.map((f) => read(ctx.dir, f)!).join('\n'));
  const draft = base(ctx, sourceId, 'theme', {
    name: `Thème ${theme.name}`, type: 'theme', framework,
    description: `Tokens (couleurs clair/sombre, typographie, rayons) extraits de ${files.join(' + ')}. Les styles propres au site d'origine sont exclus.`,
    tags: ['tokens', ...(Object.keys(tokens.colors.dark).length ? ['dark mode'] : [])],
    sourceUrl: blobUrl(ctx, files[0]), sourcePath: files.join(' + '),
    files: [{ path: 'theme.css', role: 'theme' }], tokens,
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

interface ShadcnItem { name: string; type: string; title?: string; description?: string; dependencies?: string[]; registryDependencies?: string[]; files?: { path: string; type?: string; target?: string; content?: string }[] }

function mapType(shadcnType: string, name: string, blockType: ItemType = 'section'): ItemType | null {
  if (/registry:(lib|hook|primitive|style)/.test(shadcnType)) return 'lib';
  if (shadcnType === 'registry:theme') return 'theme';
  if (shadcnType === 'registry:block') return blockType;
  if (shadcnType === 'registry:page') return 'screen';
  if (/registry:(ui|component|example)/.test(shadcnType)) return refineType(name, 'component');
  return null;
}

export const depName = (sourceId: string, dep: string) => `${sourceId}/${slugify(dep.replace(/^https?:\/\/.*\/r\/(?:web\/)?/, '').replace(/\.json$/, '').replace(/^@[\w-]+\//, ''))}`;

function mergeDeps(declared: string[] = [], found: string[] = []) {
  const byName = new Map<string, string>();
  for (const d of [...declared, ...found]) {
    const name = d.startsWith('@') ? '@' + d.slice(1).split('@')[0] : d.split('@')[0];
    if (!byName.has(name) && !/^(react|react-dom|cn)$/.test(name)) byName.set(name, d);
  }
  return [...byName.values()].sort();
}

function easyMetadata(ctx: Ctx, rel?: string): Map<string, { category?: string; badges?: string[]; tagline?: string; features?: string[]; props?: { name: string; type: string; default?: string; description?: string }[] }> {
  const map = new Map();
  if (!rel) return map;
  const code = read(ctx.dir, rel);
  const json = code?.match(/=\s*(\[[\s\S]*\])\s*;?\s*$/)?.[1];
  if (!json) { ctx.collector.warn(`Métadonnées illisibles : ${rel}`); return map; }
  for (const m of JSON.parse(json)) map.set(m.id, m);
  return map;
}

function readmeFrom(name: string, meta: { tagline?: string; features?: string[]; props?: { name: string; type: string; default?: string; description?: string }[] }, cli?: string) {
  const lines = [`# ${name}`, '', meta.tagline ?? '', ''];
  if (meta.features?.length) lines.push('## Fonctionnalités', '', ...meta.features.map((f) => `- ${f}`), '');
  if (meta.props?.length) lines.push('## Props', '', '| Prop | Type | Défaut | Description |', '| --- | --- | --- | --- |', ...meta.props.map((p) => `| \`${p.name}\` | \`${p.type.replace(/\|/g, '\\|')}\` | ${p.default ? '`' + p.default + '`' : '—'} | ${p.description ?? ''} |`), '');
  if (cli) lines.push('## Installation d’origine', '', '```bash', cli, '```', '');
  lines.push('_Généré par Component Atlas depuis les métadonnées publiées par la source._');
  return lines.join('\n');
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
  for (const item of items) for (const f of item.files ?? []) {
    const id = `${src.id}/${slugify(item.name)}`;
    declaredBy.set(f.path, (declaredBy.get(f.path) ?? new Set()).add(id));
  }
  const owners = new Map([...declaredBy].filter(([, s]) => s.size === 1).map(([p, s]) => [p, [...s][0]]));

  const demos = new Map<string, string>();
  if (src.demos) for (const demo of expandGlob(dir, src.demos)) {
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
    if (!type || type === 'theme') { collector.skip(id, `Type shadcn non géré : ${item.type}`); continue; }
    const declared = (item.files ?? []).map((f) => f.path);
    if (!declared.length) { collector.skip(id, 'Aucun fichier déclaré'); continue; }
    const missing = declared.filter((p) => read(dir, p) === undefined);
    if (missing.length) { collector.skip(id, `Fichiers déclarés absents du repo : ${missing.join(', ')}`); continue; }
    const w = walk(dir, declared, id, owners, aliases);
    for (const spec of w.unresolved) collector.warn(`${id} : import interne non résolu « ${spec} »`);
    const files: FileMap = new Map(w.files.map((rel) => [rel, read(dir, rel)!]));
    const entries: FileEntry[] = w.files.map((rel) => ({ path: rel, role: roleOf(rel), ...(item.files?.find((f) => f.path === rel)?.target ? { target: item.files!.find((f) => f.path === rel)!.target } : {}) }));
    const demo = demos.get(id);
    if (demo) attachDemo(dir, demo, files, entries);
    const extra = meta.get(item.name);
    if (extra) { files.set('README.md', readmeFrom(item.title ?? item.name, extra)); entries.push({ path: 'README.md', role: 'doc' }); }
    const dependencies = mergeDeps(item.dependencies, w.packages);
    const description = item.description ?? extra?.tagline ?? '';
    collector.write(base(ctx, src.id, slug, {
      name: item.title ?? item.name, type, framework: src.framework ?? 'react', description,
      tags: deriveTags(item.name, description, dependencies, [...(extra?.badges ?? []), ...(extra?.category ? [extra.category] : [])]),
      dependencies,
      registryDependencies: uniq([...(item.registryDependencies ?? []).map((d) => depName(src.id, d)), ...w.dependsOn]).filter((d) => d !== id).sort(),
      sourceUrl: blobUrl(ctx, declared[0]), sourcePath: declared[0],
      files: entries,
      ...(themeId && type !== 'lib' ? { theme: themeId } : {}),
      preview: type === 'lib' ? { kind: 'none', reason: 'Utilitaire sans rendu' } : demo ? { kind: 'live', entry: demo, demo: 'source' } : { kind: 'live', entry: declared[0] },
    }), files, new Map([['LICENSE', ctx.licenseText]]));
  }
  return [src.id];
}

/* ---------- Parser 2 : registre shadcn déjà construit (JSON par item, code inline) ---------- */

const isExample = (item: ShadcnItem) => item.type === 'registry:example' || /-(demo|example)(-[\w-]+)?$/.test(item.name);
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const prettify = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function importBuilt(ctx: Ctx & { src: BuiltSource }) {
  const { src, dir, collector } = ctx;
  for (const variant of src.variants) {
    const abs = path.join(dir, variant.dir);
    const jsons = fs.readdirSync(abs).filter((f) => f.endsWith('.json') && f !== 'registry.json' && f !== 'index.json').sort();
    let parsed = jsons.map((f) => ({ file: f, item: JSON.parse(fs.readFileSync(path.join(abs, f), 'utf8')) as ShadcnItem & { meta?: { tags?: string[] } } }))
      .filter(({ item }) => item && !Array.isArray(item) && item.name);
    // ReUI : fichiers publiés à plat mais importés selon leur emplacement cible (components/reui/…).
    for (const { item } of parsed) for (const f of item.files ?? []) f.path = ((variant.targetPaths && f.target) || f.path).replace(/^@?\/+/, '');

    // Métadonnées complémentaires (Origin UI : meta.tags ; React Bits : titres).
    if (variant.index) {
      const index = JSON.parse(read(dir, variant.index) ?? '{"items":[]}');
      const byName = new Map<string, Record<string, unknown>>(((Array.isArray(index) ? index : index.items) ?? []).map((i: { name: string }) => [i.name, i]));
      for (const p of parsed) { const extra = byName.get(p.item.name); if (extra) p.item = { ...extra, ...p.item, title: p.item.title ?? (extra.title as string), description: p.item.description || (extra.description as string), meta: (p.item.meta ?? extra.meta) as { tags?: string[] } }; }
    }

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
      collector.warn(`${variant.id} : ${chosen.size} composants retenus (variantes ${variant.variantSuffixes.join(' puis ')}) sur ${parsed.length} fichiers`);
      parsed = [...chosen.values()];
    }

    let themeId = variant.theme ? importTheme(ctx, variant.id, variant.theme, 'agnostic') : undefined;
    const examples = parsed.filter(({ item }) => isExample(item));
    const components = parsed.filter(({ item }) => !isExample(item));
    const names = new Set(components.map(({ item }) => item.name));

    // Exemples officiels rattachés au composant qu'ils montrent : ils servent de démo d'usage et d'aperçu live.
    const demosFor = new Map<string, ShadcnItem[]>();
    for (const { item } of examples) {
      const deps = (item.registryDependencies ?? []).map((d) => d.replace(/^https?:\/\/.*\/r\/(?:web\/)?/, '').replace(/\.json$/, '').replace(/^@[\w-]+\//, ''));
      const byPrefix = item.name.replace(/-(demo|example)(-[\w-]+)?$/, '');
      const target = names.has(byPrefix) ? byPrefix : deps.find((d) => names.has(d) && item.name.startsWith(d)) ?? deps.find((d) => names.has(d));
      if (!target) continue;
      demosFor.set(target, [...(demosFor.get(target) ?? []), item]);
    }

    const inline = new Map(components.flatMap(({ item }) => (item.files ?? []).map((f) => [f.path, f.content ?? ''] as const)));
    const owners = new Map(components.flatMap(({ item }) => (item.files ?? []).map((f) => [f.path, `${variant.id}/${slugify(item.name)}`] as const)));
    const listed = variant.componentList ? new Set<string>(JSON.parse(read(dir, variant.componentList.file) ?? '{}')[variant.componentList.key] ?? []) : null;
    const local = new Set(variant.skipExisting ? allMeta().filter(({ meta }) => meta.preview.kind === 'atlas-demo').map(({ meta }) => meta.id) : []);
    const fallback = variant.fallbackSource ? new Set(existingIds(variant.fallbackSource)) : new Set<string>();
    const resolveDep = (d: string) => {
      const own = depName(variant.id, d);
      if (/^https?:/.test(d) && !d.includes(variant.id) && !names.has(own.split('/')[1])) return own;
      if (names.has(own.split('/')[1])) return own;
      const alt = `${variant.fallbackSource}/${own.split('/')[1]}`;
      return fallback.has(alt) ? alt : own;
    };

    for (const { file, item } of components) {
      const slug = slugify(item.name);
      const id = `${variant.id}/${slug}`;
      if (local.has(id)) { collector.keep(id); continue; }
      let type = mapType(item.type, item.name, variant.blockType);
      if (listed && type === 'component' && !listed.has(item.name)) type = 'lib';
      if (!type || (type as string) === 'font') { collector.skip(id, `Type shadcn non géré : ${item.type}`); continue; }
      const itemFiles = (item.files ?? []).filter((f) => typeof f.content === 'string');
      if (!itemFiles.length) { collector.skip(id, 'Aucun contenu inline'); continue; }
      const files: FileMap = new Map(itemFiles.map((f) => [f.path, f.content!]));
      let entries: FileEntry[] = itemFiles.map((f) => ({ path: f.path, role: type === 'theme' ? 'theme' : roleOf(f.path), ...(f.target ? { target: f.target } : {}) }));
      const w = walk(dir, itemFiles.map((f) => f.path), id, owners, variant.aliases ?? {}, (rel) => inline.get(rel));
      let demo: string | undefined;
      if (variant.demos && type !== 'lib' && type !== 'theme') {
        const candidates = expandGlob(dir, variant.demos, item.name);
        const folder = path.join(dir, path.dirname(variant.demos.replace('{name}', item.name)));
        demo = candidates[0] ?? (fs.existsSync(folder) ? fs.readdirSync(folder).filter((f) => f.endsWith('.tsx') && f !== 'thumb.tsx').sort().map((f) => toPosix(path.relative(dir, path.join(folder, f))))[0] : undefined);
        if (demo) attachDemo(dir, demo, files, entries);
      }
      const official = (demosFor.get(item.name) ?? []).sort((a, b) => Number(b.name === `${item.name}-demo`) - Number(a.name === `${item.name}-demo`) || a.name.localeCompare(b.name));
      for (const example of official.slice(0, 4)) for (const f of example.files ?? []) {
        if (typeof f.content !== 'string' || files.has(f.path)) continue;
        files.set(f.path, f.content); entries.push({ path: f.path, role: 'demo' });
        demo = demo ?? f.path;
      }
      if (type === 'theme') {
        const { tokens } = extractTheme(itemFiles.map((f) => f.content).join('\n'));
        entries = entries.map((e) => ({ ...e, role: 'theme' }));
        themeId = themeId ?? id;
        collector.write(base(ctx, variant.id, slug, { name: `Thème ${src.name}${variant.framework === 'react-native' ? ' (React Native)' : ''}`, type, framework: variant.framework, description: item.description ?? '', tags: ['tokens'], files: entries, tokens, sourceUrl: blobUrl(ctx, `${variant.dir}/${file}`), sourcePath: `${variant.dir}/${file}` }), files, new Map([['LICENSE', ctx.licenseText]]));
        continue;
      }
      const tags = item.meta?.tags ?? [];
      const number = item.name.match(/(\d+)$/)?.[1];
      const name = item.title ?? (variant.nameFromTags && tags.length ? `${capitalize(tags[0])}${number ? ` ${number}` : ''}` : prettify(item.name));
      const dependencies = mergeDeps(item.dependencies, w.packages);
      const description = item.description || (tags.length ? `Exemple ${src.name} : ${tags.join(', ')}.` : '');
      collector.write(base(ctx, variant.id, slug, {
        name, type, framework: variant.framework, description,
        tags: deriveTags(`${item.name} ${name}`, description, dependencies, [variant.framework === 'react-native' ? 'expo' : 'web', ...tags]),
        dependencies,
        registryDependencies: uniq([...(item.registryDependencies ?? []).map(resolveDep), ...w.dependsOn]).filter((d) => d !== id).sort(),
        sourceUrl: blobUrl(ctx, `${variant.dir}/${file}`), sourcePath: `${variant.dir}/${file}`,
        files: entries,
        ...(themeId && type !== 'lib' ? { theme: themeId } : {}),
        preview: variant.framework === 'react-native' ? { kind: 'none', reason: 'Composant React Native (Expo) : pas de rendu web' } : type === 'lib' ? { kind: 'none', reason: 'Utilitaire sans rendu' } : demo ? { kind: 'live', entry: demo, demo: 'source' } : { kind: 'live', entry: itemFiles[0].path },
      }), files, new Map([['LICENSE', ctx.licenseText]]));
    }
  }
  return src.variants.map((v) => v.id);
}

/* ---------- Parser 3 : un dossier par bloc (Bencho) ---------- */

function importBlocks(ctx: Ctx & { src: BlocksSource }) {
  const { src, dir, collector } = ctx;
  for (const excluded of src.exclude) if (fs.existsSync(path.join(dir, excluded)))
    collector.skip(excluded + '/', excluded === 'assets' ? 'Visuels et photos : hors licence ou non nécessaires (exclus)' : excluded === 'sounds' ? 'Sons d’interface : type non géré par le registre' : 'Application de démonstration du repo (exclue)');
  const themeId = src.theme ? importTheme(ctx, src.id, src.theme, 'agnostic') : undefined;
  const root = path.join(dir, src.blocks);
  const owners = new Map<string, string>();
  for (const folder of fs.readdirSync(root).sort()) {
    const abs = path.join(root, folder);
    if (!fs.statSync(abs).isDirectory()) continue;
    const slug = slugify(folder);
    const id = `${src.id}/${slug}`;
    const readme = read(root, `${folder}/README.md`) ?? '';
    if (src.excludeReadme && new RegExp(src.excludeReadme, 'i').test(readme)) { collector.skip(id, 'Bloc Pro / payant (exclu)'); continue; }
    const usage = readme.match(/import\s*\{\s*(\w+)\s*\}\s*from\s*["']\.\/(\w+)["']/);
    const tsx = fs.readdirSync(abs).filter((f) => /\.tsx?$/.test(f)).sort();
    const entry = usage ? `${usage[2]}.tsx` : tsx[0];
    if (!entry || !tsx.includes(entry)) { collector.skip(id, 'Aucun composant TSX trouvé'); continue; }
    const rels = fs.readdirSync(abs).filter((f) => /\.(tsx?|css|md)$/.test(f)).map((f) => `${src.blocks}/${folder}/${f}`);
    const w = walk(dir, rels.filter((r) => !r.endsWith('.md')), id, owners, src.aliases ?? {});
    for (const spec of w.unresolved) collector.warn(`${id} : import interne non résolu « ${spec} »`);
    const all = uniq([...rels, ...w.files]).sort();
    const files: FileMap = new Map(all.map((rel) => [rel, read(dir, rel)!]));
    const title = readme.match(/^#\s+(.+)$/m)?.[1].trim() ?? folder;
    const description = readme.split('\n').map((l) => l.trim()).find((l) => l && !l.startsWith('#') && !l.startsWith('**') && !l.startsWith('[')) ?? '';
    const installed = readme.match(/npm install ([^\n`]+)/)?.[1].trim().split(/\s+/) ?? [];
    const dependencies = mergeDeps(installed, w.packages);
    const entryPath = `${src.blocks}/${folder}/${entry}`;
    collector.write(base(ctx, src.id, slug, {
      name: title, type: refineType(title, 'component'), framework: src.framework ?? 'react', description,
      tags: deriveTags(`${folder} ${title}`, description, dependencies, readme.match(/·\s*(\w[\w ]*)\s*$/m)?.[1] ? [readme.match(/·\s*(\w[\w ]*)\s*$/m)![1]] : []),
      dependencies,
      sourceUrl: `${src.repo}/tree/${ctx.commit}/${src.blocks}/${folder}`, sourcePath: `${src.blocks}/${folder}`,
      files: all.map((rel) => ({ path: rel, role: roleOf(rel) })),
      ...(themeId ? { theme: themeId } : {}),
      preview: { kind: 'live', entry: entryPath, ...(usage ? { exportName: usage[1] } : {}) },
    }), files, new Map([['LICENSE', ctx.licenseText]]));
  }
  return [src.id];
}

/* ---------- Orchestration ---------- */

export function loadSources(): Source[] {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'importers', 'sources.json'), 'utf8')).github;
}

export function importGithub(options: { only?: string; offline?: boolean } = {}) {
  const runs = [];
  for (const src of loadSources()) {
    if (options.only && options.only !== src.id) continue;
    const { dir, commit } = syncRepo(src.id, src.repo, options.offline);
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
  }
  return runs;
}
