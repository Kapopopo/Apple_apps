/**
 * Bundle d'une spec complète : blocs et sons (code + dépendances, imports réécrits), thème en CSS,
 * polices, easings, CREDITS.md et une commande npm install unique. Partagé par le MCP
 * (get_spec_bundle, build-from-spec) et le CLI `npm run bundle`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { nativeEquivalent, supports, TEMPLATE_ID } from '../web/lib/mobile.js';
import { bundleItems, CN_ITEM, credits, metaOf, registryContext, type Bundle, type BundleFile, type BundleOptions } from './bundle.js';
import { DEFAULT_THEME, mobileApp } from './mobile.js';
import { indexItems } from './registry.js';
import { packageName } from './resolve.js';
import type { Spec } from './schema.js';
import { skinCss } from './themes.js';

export interface SpecBundle extends Bundle {
  /** Fichiers hors composants : thème, polices, easings, crédits. */
  extras: BundleFile[];
  /** `npm install …`, ou `npx expo install …` en mobile (vide si aucun paquet). */
  install: string;
  /** Mobile : blocs sans code natif, avec leur consigne de remplacement. */
  replaced: { id: string; name: string; instruction: string }[];
  /** Mobile : choix de style sans équivalent natif. */
  ignored: string[];
}

const EASING_TARGETS: Record<string, string> = { '.ts': 'lib/easings.ts', '.css': 'styles/easings.css' };

/** Paquets d'items natifs à installer en plus de ceux de mobile-base, sans version (choisie par `expo install`). */
export function nativePackages(dependencies: string[]): string[] {
  const name = (dep: string) => packageName(dep.replace(/(.)@[^@/]*$/, '$1'));
  const provided = new Set(['react-native', ...(metaOf(TEMPLATE_ID)?.dependencies ?? []).map(name)]);
  // panelui-native : le paquet amont, cité dans les commentaires du code copié, jamais importé.
  provided.add('panelui-native');
  return [...new Set(dependencies.map(name))].filter((d) => !provided.has(d) && /^(@[\w.-]+\/)?\w[\w.-]*$/.test(d)).sort();
}

/** Bundle mobile : code natif seulement. Le web n'est jamais copié, il devient une consigne. */
function mobileBundle(spec: Spec, options: BundleOptions): SpecBundle {
  const entries = new Map(indexItems().map((e) => [e.id, e]));
  const native: string[] = [];
  const replaced: SpecBundle['replaced'] = [];
  const missing = new Set<string>();
  for (const { id } of spec.blocks) {
    const entry = entries.get(id);
    if (!entry) missing.add(id);
    else if (supports(entry, 'mobile')) native.push(id);
    else replaced.push({ id, name: entry.name, instruction: nativeEquivalent(entry) });
  }
  const bundle = bundleItems([...new Set(native)], options);
  for (const m of bundle.missing) missing.add(m);

  const app = mobileApp(spec);
  const credited = new Set([...bundle.used, TEMPLATE_ID, spec.theme ?? DEFAULT_THEME]);
  for (const id of spec.fonts.filter((f) => supports(entries.get(f), 'mobile')).slice(0, 2)) credited.add(id);
  const extras: BundleFile[] = [];
  const { byId } = registryContext();
  for (const id of spec.easings) {
    const item = byId.get(id);
    if (!item) {
      missing.add(id);
      continue;
    }
    credited.add(id);
    for (const f of item.meta.files)
      if (f.path.endsWith('.ts'))
        extras.push({
          path: EASING_TARGETS['.ts'],
          itemId: id,
          role: f.role,
          content: fs.readFileSync(path.join(item.dir, 'files', f.path), 'utf8'),
        });
  }
  const allCredits = credits([...credited].map((id) => metaOf(id)).filter((m) => !!m));
  extras.push({ path: 'CREDITS.md', itemId: 'atlas/credits', role: 'doc', content: allCredits });
  const dependencies = nativePackages(bundle.dependencies);
  return {
    ...bundle,
    // Le template a déjà son lib/utils.ts.
    files: bundle.files.filter((f) => f.itemId !== CN_ITEM),
    dependencies,
    credits: allCredits,
    missing: [...missing].sort(),
    extras,
    install: dependencies.length ? `npx expo install ${dependencies.join(' ')}` : '',
    replaced,
    ignored: app.ignored,
  };
}

export function specBundle(spec: Spec, options: BundleOptions = {}): SpecBundle {
  if (spec.target === 'mobile') return mobileBundle(spec, options);
  const ids = [...new Set([...spec.blocks.map((b) => b.id), ...spec.sounds])];
  const bundle = bundleItems(ids, options);
  const extras: BundleFile[] = [];
  const credited = new Set(bundle.used);
  const missing = new Set(bundle.missing);

  if (spec.theme) {
    const theme = metaOf(spec.theme);
    if (theme?.tokens) {
      credited.add(theme.id);
      extras.push({
        path: 'styles/atlas-theme.css',
        itemId: theme.id,
        role: 'theme',
        content: `/* Thème « ${theme.name} » — ${theme.source} (${theme.license}). Variables CSS clair / sombre (.dark). */\n${skinCss(theme.tokens)}`,
      });
    } else missing.add(spec.theme);
  }

  const fonts = spec.fonts.map((id) => ({ id, meta: metaOf(id) }));
  for (const f of fonts) if (!f.meta?.font) missing.add(f.id);
  const loaded = fonts.filter((f) => f.meta?.font);
  if (loaded.length) {
    for (const f of loaded) credited.add(f.id);
    extras.push({
      path: 'styles/atlas-fonts.css',
      itemId: loaded[0].id,
      role: 'style',
      content: [
        '/* Polices de la spec (licences dans CREDITS.md). À importer avant les autres feuilles. */',
        ...loaded.map((f) => `@import url("${f.meta!.font!.cssUrl}");`),
        '',
        ':root {',
        ...loaded.map(
          (f, i) =>
            `  --font-${i === 0 ? 'sans' : i === 1 ? 'display' : `extra-${i}`}: '${f.meta!.font!.family}', ui-sans-serif, system-ui, sans-serif;`,
        ),
        '}',
        '',
      ].join('\n'),
    });
  }

  const { byId } = registryContext();
  for (const id of spec.easings) {
    const item = byId.get(id);
    if (!item) {
      missing.add(id);
      continue;
    }
    credited.add(id);
    for (const f of item.meta.files) {
      const target = EASING_TARGETS[path.extname(f.path)];
      if (target)
        extras.push({ path: target, itemId: id, role: f.role, content: fs.readFileSync(path.join(item.dir, 'files', f.path), 'utf8') });
    }
  }

  const allCredits = credits([...credited].map((id) => metaOf(id)).filter((m) => !!m));
  extras.push({ path: 'CREDITS.md', itemId: 'atlas/credits', role: 'doc', content: allCredits });
  return {
    ...bundle,
    credits: allCredits,
    missing: [...missing].sort(),
    extras,
    install: bundle.dependencies.length ? `npm install ${bundle.dependencies.join(' ')}` : '',
    replaced: [],
    ignored: [],
  };
}
