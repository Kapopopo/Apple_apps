/**
 * Bundle d'une spec complète : blocs et sons (code + dépendances, imports réécrits), thème en CSS,
 * polices, easings, CREDITS.md et une commande npm install unique. Partagé par le MCP
 * (get_spec_bundle, build-from-spec) et le CLI `npm run bundle`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { bundleItems, credits, metaOf, registryContext, type Bundle, type BundleFile, type BundleOptions } from './bundle.js';
import type { Spec } from './schema.js';
import { skinCss } from './themes.js';

export interface SpecBundle extends Bundle {
  /** Fichiers hors composants : thème, polices, easings, crédits. */
  extras: BundleFile[];
  /** `npm install …` (vide si aucun paquet). */
  install: string;
}

const EASING_TARGETS: Record<string, string> = { '.ts': 'lib/easings.ts', '.css': 'styles/easings.css' };

export function specBundle(spec: Spec, options: BundleOptions = {}): SpecBundle {
  const ids = [...new Set([...spec.blocks.map((b) => b.id), ...spec.sounds])];
  const bundle = bundleItems(ids, options);
  const extras: BundleFile[] = [];
  const credited = new Set(bundle.used);
  const missing = new Set(bundle.missing);

  if (spec.theme) {
    const theme = metaOf(spec.theme);
    if (theme?.tokens) {
      credited.add(theme.id);
      extras.push({ path: 'styles/atlas-theme.css', itemId: theme.id, role: 'theme', content: `/* Thème « ${theme.name} » — ${theme.source} (${theme.license}). Variables CSS clair / sombre (.dark). */\n${skinCss(theme.tokens)}` });
    } else missing.add(spec.theme);
  }

  const fonts = spec.fonts.map((id) => ({ id, meta: metaOf(id) }));
  for (const f of fonts) if (!f.meta?.font) missing.add(f.id);
  const loaded = fonts.filter((f) => f.meta?.font);
  if (loaded.length) {
    for (const f of loaded) credited.add(f.id);
    extras.push({
      path: 'styles/atlas-fonts.css', itemId: loaded[0].id, role: 'style',
      content: [
        '/* Polices de la spec (licences dans CREDITS.md). À importer avant les autres feuilles. */',
        ...loaded.map((f) => `@import url("${f.meta!.font!.cssUrl}");`),
        '',
        ':root {',
        ...loaded.map((f, i) => `  --font-${i === 0 ? 'sans' : i === 1 ? 'display' : `extra-${i}`}: '${f.meta!.font!.family}', ui-sans-serif, system-ui, sans-serif;`),
        '}',
        '',
      ].join('\n'),
    });
  }

  const { byId } = registryContext();
  for (const id of spec.easings) {
    const item = byId.get(id);
    if (!item) { missing.add(id); continue; }
    credited.add(id);
    for (const f of item.meta.files) {
      const target = EASING_TARGETS[path.extname(f.path)];
      if (target) extras.push({ path: target, itemId: id, role: f.role, content: fs.readFileSync(path.join(item.dir, 'files', f.path), 'utf8') });
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
  };
}
