/**
 * Génère src/generated/ à partir de registry/index.json :
 *  - registry.ts : un chargeur dynamique par item « live » (un chunk par item, erreurs isolées) ;
 *  - <source>.css : une compilation Tailwind par source (les tokens d'une source ne débordent pas sur une autre).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const registry = path.resolve(root, '../registry');
const out = path.join(root, 'src/generated');
const posix = (p) => p.split(path.sep).join('/');

const { items } = JSON.parse(fs.readFileSync(path.join(registry, 'index.json'), 'utf8'));
const live = items.filter((i) => i.preview?.kind === 'live' && i.framework === 'react');
fs.rmSync(out, { recursive: true, force: true });
fs.rmSync(path.join(root, 'missing-modules.txt'), { force: true });
fs.mkdirSync(out, { recursive: true });

const sources = [...new Set(live.map((i) => i.sourceId))].sort();
for (const source of sources) {
  const theme = items.find((i) => i.type === 'theme' && i.sourceId === source);
  const extra = path.join(root, 'src/extra', `${source}.css`);
  const lines = [
    `/* Généré par scripts/generate.mjs — ne pas modifier. */`,
    `@import "tailwindcss" source(none);`,
    `@source "../../../registry/items/${source}";`,
    `@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *));`,
  ];
  if (theme) lines.push(`@import "../../../registry/${theme.dir}/files/theme.css";`);
  if (fs.existsSync(extra)) lines.push(`@import "../extra/${source}.css";`);
  fs.writeFileSync(path.join(out, `${source}.css`), lines.join('\n') + '\n');
}

const entries = live.map((item) => {
  const meta = JSON.parse(fs.readFileSync(path.join(registry, item.dir, 'meta.json'), 'utf8'));
  const file = (rel, dir = item.dir) => `@registry/${posix(dir)}/files/${rel}`;
  const styles = meta.files.filter((f) => f.role === 'style').map((f) => `() => import(${JSON.stringify(file(f.path))})`);
  // Sons : moteur de lecture (React Bits) chargé depuis l'item dont dépend la recette.
  let engine = 'null';
  if (meta.sound?.engine === 'react-bits') {
    const dep = items.find((i) => meta.registryDependencies.includes(i.id) && i.id.endsWith('/sound-engine'));
    const engineMeta = dep && JSON.parse(fs.readFileSync(path.join(registry, dep.dir, 'meta.json'), 'utf8'));
    if (engineMeta) engine = `() => import(${JSON.stringify(file(engineMeta.files[0].path, dep.dir))})`;
  }
  return `  ${JSON.stringify(item.id)}: { source: ${JSON.stringify(item.sourceId)}, name: ${JSON.stringify(item.name)}, exportName: ${JSON.stringify(meta.preview.exportName ?? null)}, demo: ${meta.preview.demo === 'source'}, sound: ${JSON.stringify(meta.sound ?? null)}, engine: ${engine}, load: () => import(${JSON.stringify(file(meta.preview.entry))}), css: () => import(${JSON.stringify(`./${item.sourceId}.css`)}), styles: [${styles.join(', ')}] },`;
});

fs.writeFileSync(
  path.join(out, 'registry.ts'),
  [
    '/* Généré par scripts/generate.mjs — ne pas modifier. */',
    'type Loader = () => Promise<Record<string, unknown>>;',
    'export interface PreviewEntry { source: string; name: string; exportName: string | null; demo: boolean; sound: { engine: string; names: string[] } | null; engine: Loader | null; load: Loader; css: () => Promise<unknown>; styles: (() => Promise<unknown>)[] }',
    'export const ITEMS: Record<string, PreviewEntry> = {',
    ...entries,
    '};',
    '',
  ].join('\n'),
);

console.log(`previews : ${live.length} items live, ${sources.length} feuilles Tailwind (${sources.join(', ')})`);
