/** Importers Fontshare (API simulée) et easings : licences, journal, relance sans doublon. ATLAS_ROOT temporaire. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-import-'));
process.env.ATLAS_ROOT = tmp;
const { importFontshare } = await import('../../importers/fontshare.js');
const { importEasings, easingTokens, generateTs } = await import('../../importers/easings.js');
const { allMeta, buildIndex } = await import('../../shared/registry.js');

const style = (name: string, number: number, italic = false) => ({ is_italic: italic, is_variable: false, weight: { name, number } });
const FONTS = [
  { name: 'Satoshi', slug: 'satoshi', category: 'Sans', license_type: 'itf_ffl', font_tags: [{ name: 'Modern' }], publisher: { name: 'Indian Type Foundry' }, designers: [{ name: 'X' }], styles: [style('Regular', 400), style('Italic', 400, true), style('Bold', 700)] },
  { name: 'Lora', slug: 'lora', category: 'Serif', license_type: 'sil_ofl', styles: [style('Regular', 400)] },
  { name: 'Mystère', slug: 'mystere', category: 'Display', license_type: 'proprietary', styles: [style('Regular', 400)] },
];
const fakeFetch = (async () => new Response(JSON.stringify({ fonts: FONTS, has_more: false }), { status: 200 })) as typeof fetch;

test('Fontshare : nom, styles et lien CSS seulement ; licence inconnue sautée et journalisée', async () => {
  const [run] = await importFontshare(fakeFetch);
  assert.deepEqual(run.added.sort(), ['fontshare/lora', 'fontshare/satoshi']);
  assert.equal(run.skipped[0].item, 'fontshare/mystere');
  const satoshi = allMeta().find((m) => m.meta.id === 'fontshare/satoshi')!;
  assert.equal(satoshi.meta.licenseStatus, 'restricted');
  assert.equal(satoshi.meta.license, 'LicenseRef-ITF-FFL');
  assert.equal(satoshi.meta.font!.cssUrl, 'https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap');
  assert.equal(satoshi.meta.font!.styles.length, 3);
  assert.equal(allMeta().find((m) => m.meta.id === 'fontshare/lora')!.meta.license, 'OFL-1.1');
  const stored = fs.readdirSync(path.join(satoshi.dir, 'files'));
  assert.deepEqual(stored, ['font.css'], 'aucun fichier de police stocké');
  const log = JSON.parse(fs.readFileSync(path.join(tmp, 'registry', '_import-log.json'), 'utf8'));
  assert.equal(log.runs.at(-1).skipped[0].reason, 'Licence absente ou inconnue : proprietary');
});

test('relance : rien de nouveau, aucun doublon', async () => {
  const [run] = await importFontshare(fakeFetch);
  assert.equal(run.added.length, 0);
  assert.equal(run.updated.length, 0);
  assert.equal(run.unchanged, 2);
  assert.equal(allMeta().filter((m) => m.meta.type === 'font').length, 2);
});

test('easings : cubic-bezier + fonctions JS cohérentes', async () => {
  importEasings();
  const tokens = easingTokens();
  const cubic = tokens.find((t) => t.name === 'easeInOutCubic')!;
  assert.equal(cubic.css, 'cubic-bezier(0.65, 0, 0.35, 1)');
  assert.equal(tokens.find((t) => t.name === 'easeOutBounce')!.cubicBezier, null);
  // Les fonctions générées doivent valoir 0 en 0 et 1 en 1.
  const js = generateTs().replace(/: number/g, '').replace(/ as \[number, number, number, number\]/g, '').replace(/ as const/g, '').replace(/^export type .*$/m, '').replace(/export /g, '');
  const fns = new Function(`${js}; return easings;`)() as Record<string, (x: number) => number>;
  for (const [name, fn] of Object.entries(fns)) {
    assert.ok(Math.abs(fn(0)) < 1e-9, `${name}(0)`);
    assert.ok(Math.abs(fn(1) - 1) < 1e-9, `${name}(1)`);
  }
  assert.ok(Math.abs(fns.easeInOutCubic(0.5) - 0.5) < 1e-9);
  const index = buildIndex();
  assert.ok(index.some((e) => e.id === 'atlas/easings-standard' && e.type === 'easing'));
});

test('easings : ressorts (linear() + durée) et durées de référence', () => {
  const tokens = easingTokens();
  const snappy = tokens.find((t) => t.name === 'springSnappy')!;
  assert.equal(snappy.kind, 'spring');
  assert.deepEqual(snappy.spring, { stiffness: 400, damping: 30, mass: 1 });
  assert.match(snappy.css, /^linear\(0, [\d., ]+, 1\)$/);
  assert.ok(snappy.durationMs! > 100 && snappy.durationMs! < 1500);
  assert.equal(tokens.find((t) => t.name === 'durationBase')!.css, '200ms');
  assert.match(generateTs(), /export const spring = \{[\s\S]*snappy: \{ stiffness: 400/);
});

test('démos de route : registre paresseux rendu statique, limité aux entrées utilisées', async () => {
  const { lazyEntries, usedKeys, staticRegistry, labelOf } = await import('../../importers/github.js');
  const registry = "export const DEMO_COMPONENTS = {\n  Button: lazyNamed(() => import('../../ui/Button'), 'Button'),\n  Card: lazyNamed(() => import('../../ui/Card'), 'GlassCard'),\n  Alert: lazyWithPreload(() => import('./demos/alert.demo'), 'default'),\n};";
  const entries = lazyEntries(registry);
  assert.deepEqual([...entries.keys()], ['Button', 'Card', 'Alert']);
  const keys = usedKeys('const { Button, Card: Glass } = DEMO_COMPONENTS;\nDEMO_COMPONENTS.Alert.preload();', 'DEMO_COMPONENTS');
  assert.deepEqual([...keys].sort(), ['Alert', 'Button', 'Card']);
  const code = staticRegistry('DEMO_COMPONENTS', entries, new Set(['Button', 'Card']));
  assert.match(code, /import \{ Button \} from '\.\.\/\.\.\/ui\/Button';/);
  assert.match(code, /import \{ GlassCard as Card \} from '\.\.\/\.\.\/ui\/Card';/);
  assert.match(code, /export const DEMO_COMPONENTS = \{ Button, Card \} as const;/);
  assert.ok(!code.includes('alert.demo'), 'entrée inutilisée absente');
  assert.equal(labelOf('<Label htmlFor={id}>Simple input</Label>'), 'Simple input');
  assert.equal(labelOf('<div>{x}</div>'), undefined);
});
