/**
 * Bundle prêt à poser dans un projet : code des items et de leurs dépendances de registre, imports
 * réécrits vers les alias du projet cible, une seule liste de paquets npm et les crédits de licence.
 * Utilisé par le MCP (get_spec_bundle, get_component avec target_alias), le CLI `npm run bundle` et le
 * registre au format shadcn (/r/...).
 */
import fs from 'node:fs';
import path from 'node:path';
import { allMeta, indexVersion } from './registry.js';
import type { Meta } from './schema.js';
import { buildContext, IMPORT_SPEC, isCnOnly, packageName, resolveImport, type FileRef, type ResolveContext } from './resolve.js';

export interface BundleOptions {
  /** Préfixe des imports internes réécrits ('@/' par défaut, '~/', ou 'relative' pour des chemins relatifs). */
  alias?: string;
  /** Inclure les fichiers de démo d'usage (dossier demo/ de chaque item). */
  demos?: boolean;
  /**
   * N'émettre que les fichiers des items demandés : les fichiers d'autres items qu'ils importent sont
   * seulement référencés (leurs items sont listés dans `external`), comme le fait le registre shadcn.
   */
  shallow?: boolean;
}

export interface BundleFile {
  path: string;
  content: string;
  itemId: string;
  role: string;
}
export interface Bundle {
  files: BundleFile[];
  /** Paquets npm à installer (hors react, react-dom, next). */
  dependencies: string[];
  /** CREDITS.md : licences et attributions des sources utilisées. */
  credits: string;
  /** Imports non résolus et ids absents du registre. */
  missing: string[];
  /** Items inclus, dépendances d'abord. */
  items: string[];
  /** Mode shallow : items importés mais non émis. */
  external: string[];
  /** Tous les items crédités (demandés, repris en partie, référencés). */
  used: string[];
}

export const CN_ITEM = 'atlas/cn';
const CN = `import { clsx, type ClassValue } from 'clsx';\nimport { twMerge } from 'tailwind-merge';\n\nexport function cn(...inputs: ClassValue[]) {\n  return twMerge(clsx(inputs));\n}\n`;
const stripExt = (p: string) => p.replace(/\.(tsx|ts|jsx|js|mjs)$/, '');
/** Un même fichier d'origine (source + chemin) n'est émis qu'une fois, même s'il est copié dans plusieurs items. */
const keyOf = (ref: FileRef) => `${ref.sourceId}::${ref.rel}`;
const read = (abs: string) => fs.readFileSync(abs, 'utf8');

let cache: {
  key: number;
  metas: { meta: Meta; dir: string }[];
  byId: Map<string, { meta: Meta; dir: string }>;
  ctx: ResolveContext;
} | null = null;

/** Contexte de résolution sur tout le registre (relu quand l'index change). */
export function registryContext() {
  const key = indexVersion();
  if (!cache || cache.key !== key) {
    const metas = allMeta();
    cache = { key, metas, byId: new Map(metas.map((m) => [m.meta.id, m])), ctx: buildContext(metas) };
  }
  return cache;
}

/** Dossier commun aux fichiers source d'un item (pour garder sa structure interne). */
function commonRoot(meta: Meta): string {
  const dirs = meta.files.filter((f) => f.role === 'source' || f.role === 'style').map((f) => path.posix.dirname(f.path));
  if (!dirs.length) return '';
  let root = dirs[0];
  for (const d of dirs) while (root && root !== '.' && !(d === root || d.startsWith(root + '/'))) root = path.posix.dirname(root);
  return root === '.' ? '' : root;
}

/** Emplacement conseillé dans le projet : primitives shadcn au standard, le reste rangé par source et item. */
export function targetOf(ref: Pick<FileRef, 'rel' | 'role'>, meta: Meta): string {
  if (meta.sourceId === 'shadcn') {
    const m = ref.rel.match(/(?:^|\/)(ui|hooks|lib)\/(.+)$/);
    if (m) return `${m[1] === 'ui' ? 'components/ui' : m[1]}/${m[2]}`;
  }
  const [source, slug] = meta.id.split('/');
  const root = commonRoot(meta);
  const inner = root && ref.rel.startsWith(root + '/') ? ref.rel.slice(root.length + 1) : path.posix.basename(ref.rel);
  return `components/atlas/${source}/${slug}/${ref.role === 'demo' ? 'demo/' : ''}${inner}`;
}

function importPath(fromTarget: string, toTarget: string, alias: string, keepExt: boolean): string {
  const to = keepExt ? toTarget : stripExt(toTarget);
  if (alias === 'relative') {
    const rel = path.posix.relative(path.posix.dirname(fromTarget), to);
    return rel.startsWith('.') ? rel : './' + rel;
  }
  return alias + to;
}

export function bundleItems(ids: string[], options: BundleOptions = {}): Bundle {
  const { byId, ctx } = registryContext();
  const alias = options.alias ?? '@/';
  const order: string[] = [];
  const missing = new Set<string>();
  const visit = (id: string, trail: Set<string>) => {
    if (order.includes(id) || trail.has(id)) return;
    const item = byId.get(id);
    if (!item) {
      missing.add(id);
      return;
    }
    if (!options.shallow) for (const dep of item.meta.registryDependencies) visit(dep, new Set([...trail, id]));
    order.push(id);
  };
  for (const id of ids) visit(id, new Set());

  const emitted = new Map<string, { ref: FileRef; meta: Meta; target: string }>();
  const external = new Set<string>();
  const deps = new Set<string>();
  const hasDep = (name: string) => [...deps].some((d) => packageName(d.replace(/(.)@[^@/]*$/, '$1')) === name);
  let needsCn = false;
  const queue: { ref: FileRef; meta: Meta }[] = [];
  for (const id of order) {
    const { meta } = byId.get(id)!;
    for (const d of meta.dependencies) deps.add(d);
    for (const ref of ctx.items.get(id)?.values() ?? []) {
      if (ref.role === 'doc' || (ref.role === 'demo' && !options.demos)) continue;
      queue.push({ ref, meta });
    }
  }
  /** Import résolu, avec les helpers cn de chaque source ramenés au lib/utils.ts unique. */
  const resolve = (spec: string, ref: FileRef) => {
    const r = resolveImport(ctx, spec, { itemId: ref.itemId, sourceId: ref.sourceId, rel: ref.rel });
    return r.kind === 'file' && isCnOnly(r.ref, read) ? { kind: 'cn' as const } : r;
  };
  // Parcours du graphe d'imports : les fichiers d'autres items importés par le code sont ajoutés (ou référencés en shallow).
  while (queue.length) {
    const { ref, meta } = queue.shift()!;
    if (emitted.has(keyOf(ref))) continue;
    if (isCnOnly(ref, read)) {
      needsCn = true;
      continue;
    }
    emitted.set(keyOf(ref), { ref, meta, target: targetOf(ref, meta) });
    for (const m of read(ref.abs).matchAll(IMPORT_SPEC)) {
      const r = resolve(m[3], ref);
      if (r.kind === 'cn') needsCn = true;
      else if (r.kind === 'file') {
        if (emitted.has(keyOf(r.ref))) continue;
        if (options.shallow && !order.includes(r.ref.itemId)) external.add(r.ref.itemId);
        else queue.push({ ref: r.ref, meta: byId.get(r.ref.itemId)!.meta });
      } else if (r.kind === 'package') {
        if (!/^node:/.test(m[3]) && !hasDep(r.name)) deps.add(r.name);
      } else missing.add(`${m[3]} (importé par ${ref.itemId})`);
    }
  }

  // Réécriture des imports internes vers les emplacements cibles (y compris ceux des items externes).
  const files: BundleFile[] = [];
  for (const { ref, target } of emitted.values()) {
    const code = read(ref.abs).replace(IMPORT_SPEC, (whole, head: string, quote: string, spec: string) => {
      const r = resolve(spec, ref);
      if (r.kind === 'cn') return `${head}${quote}${importPath(target, 'lib/utils.ts', alias, false)}${quote}`;
      if (r.kind === 'file') {
        const to = emitted.get(keyOf(r.ref))?.target ?? targetOf(r.ref, byId.get(r.ref.itemId)!.meta);
        return `${head}${quote}${importPath(target, to, alias, /\.(css|json)$/.test(to))}${quote}`;
      }
      return whole;
    });
    files.push({ path: target, content: code, itemId: ref.itemId, role: ref.role });
  }
  if (needsCn) {
    if (!files.some((f) => f.path === 'lib/utils.ts')) files.push({ path: 'lib/utils.ts', content: CN, itemId: CN_ITEM, role: 'source' });
    for (const d of ['clsx', 'tailwind-merge']) if (!hasDep(d)) deps.add(d);
  }

  // Crédits : items demandés, items dont un fichier a été repris, items référencés.
  const used = new Set([...order, ...[...emitted.values()].map((e) => e.ref.itemId), ...external]);
  return {
    files: files.sort((a, b) => a.path.localeCompare(b.path)),
    dependencies: [...deps].filter((d) => !/^(react|react-dom|next)(@|$)/.test(d)).sort(),
    credits: credits([...used].map((id) => byId.get(id)!.meta)),
    missing: [...missing].sort(),
    items: order,
    external: [...external].sort(),
    used: [...used],
  };
}

/** Lecture d'un meta du registre par id (contexte en cache). */
export const metaOf = (id: string): Meta | undefined => registryContext().byId.get(id)?.meta;

/** Mentions de licence à reprendre dans le projet (sources à attribution obligatoire en premier). */
export function credits(metas: Meta[]): string {
  const bySource = new Map<string, Meta[]>();
  for (const m of metas) if (m.sourceId !== 'perso') bySource.set(m.sourceId, [...(bySource.get(m.sourceId) ?? []), m]);
  const restricted = (list: Meta[]) => Number(list.some((m) => m.licenseStatus === 'restricted'));
  const groups = [...bySource.values()].sort((a, b) => restricted(b) - restricted(a) || a[0].source.localeCompare(b[0].source));
  const lines = [
    '# Crédits',
    '',
    'Composants et ressources issus de bibliothèques tierces (registre Component Atlas). Conserver ces mentions.',
    '',
  ];
  for (const list of groups) {
    lines.push(`## ${list[0].source}`, '');
    const byLicense = new Map<string, Meta[]>();
    for (const m of list) byLicense.set(m.license, [...(byLicense.get(m.license) ?? []), m]);
    for (const [license, items] of byLicense) {
      const m = items[0];
      lines.push(`- Licence : ${license}${m.licenseStatus === 'restricted' ? ' (conditions particulières)' : ''}`);
      if (m.attribution) lines.push(`  - ${m.licenseStatus === 'restricted' ? 'Attribution obligatoire' : 'Mention'} : ${m.attribution}`);
      if (m.licenseNotes && m.licenseStatus === 'restricted') lines.push(`  - Conditions : ${m.licenseNotes}`);
      lines.push(`  - Source : ${m.sourceUrl || '—'}`, `  - Éléments : ${[...new Set(items.map((x) => x.name))].join(', ')}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
