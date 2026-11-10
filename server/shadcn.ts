/**
 * Registre au format shadcn : `npx shadcn@latest add http://127.0.0.1:8000/r/<source>/<slug>.json`
 * installe un composant du registre Atlas (imports normalisés sur @/, dépendances npm et de registre).
 */
import { bundleItems, CN_ITEM } from '../shared/bundle.js';
import { indexItems } from '../shared/registry.js';

export const ITEM_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/;
const TYPES: Record<string, string> = {
  component: 'registry:component',
  section: 'registry:block',
  screen: 'registry:block',
  lib: 'registry:lib',
};
const installable = (e: { type: string; framework: string }) => !!TYPES[e.type] && e.framework === 'react';

export function shadcnIndex(base: string) {
  return {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'component-atlas',
    homepage: base,
    items: indexItems()
      .filter(installable)
      .map((e) => ({
        name: e.id.replace('/', '--'),
        type: TYPES[e.type],
        title: e.name,
        description: e.description,
        url: `${base}/r/${e.id}.json`,
      })),
  };
}

export function shadcnItem(id: string, base: string) {
  const entry = indexItems().find((e) => e.id === id);
  if (!entry || !installable(entry)) return null;
  // Fichiers propres à l'item ; les items qu'il importe sont des URL que shadcn installe à leur tour,
  // et le helper cn est la dépendance standard « utils » de shadcn.
  const bundle = bundleItems([id], { alias: '@/', shallow: true });
  const needsCn = bundle.files.some((f) => f.itemId === CN_ITEM);
  const registryDeps = [...new Set([...entry.registryDependencies, ...bundle.external])].filter((d) => d !== id);
  return {
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: id.replace('/', '--'),
    type: TYPES[entry.type],
    title: entry.name,
    description: entry.description,
    dependencies: bundle.dependencies,
    registryDependencies: [...(needsCn ? ['utils'] : []), ...registryDeps.map((d) => `${base}/r/${d}.json`)],
    files: bundle.files
      .filter((f) => f.itemId !== CN_ITEM)
      .map((f) => ({
        path: f.path,
        type: f.path.startsWith('lib/') ? 'registry:lib' : f.path.startsWith('hooks/') ? 'registry:hook' : 'registry:file',
        target: f.path,
        content: f.content,
      })),
    docs: entry.attribution
      ? `Licence ${entry.license}${entry.licenseStatus === 'restricted' ? ' (conditions)' : ''} — ${entry.attribution}`
      : `Licence ${entry.license}`,
    meta: { license: entry.license, licenseStatus: entry.licenseStatus, source: entry.sourceUrl, attribution: entry.attribution ?? null },
  };
}
