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
  {
    name: 'Satoshi',
    slug: 'satoshi',
    category: 'Sans',
    license_type: 'itf_ffl',
    font_tags: [{ name: 'Modern' }],
    publisher: { name: 'Indian Type Foundry' },
    designers: [{ name: 'X' }],
    styles: [style('Regular', 400), style('Italic', 400, true), style('Bold', 700)],
  },
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
  const js = generateTs()
    .replace(/: number/g, '')
    .replace(/ as \[number, number, number, number\]/g, '')
    .replace(/ as const/g, '')
    .replace(/^export type .*$/m, '')
    .replace(/export /g, '');
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
  const registry =
    "export const DEMO_COMPONENTS = {\n  Button: lazyNamed(() => import('../../ui/Button'), 'Button'),\n  Card: lazyNamed(() => import('../../ui/Card'), 'GlassCard'),\n  Alert: lazyWithPreload(() => import('./demos/alert.demo'), 'default'),\n};";
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

test('templates : fichiers repris (sans dépendances, verrous ni secrets), commandes et variables', async () => {
  const { collectTemplateFiles, templateRuntime } = await import('../../importers/templates.js');
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-tpl-'));
  const write = (rel: string, content: string | Buffer) => {
    fs.mkdirSync(path.dirname(path.join(repo, rel)), { recursive: true });
    fs.writeFileSync(path.join(repo, rel), content);
  };
  write('package.json', JSON.stringify({ scripts: { dev: 'next dev' }, dependencies: { next: '15.0.0' } }));
  write('pnpm-lock.yaml', 'lockfileVersion: 9');
  write('app/page.tsx', 'export default () => null;');
  write('app/globals.css', 'body{}');
  write('node_modules/x/index.js', 'x');
  write('.env', 'SECRET=1');
  write('.env.example', 'POSTGRES_URL=\n# commentaire\nexport AUTH_SECRET=xyz\n');
  write('public/logo.png', Buffer.from([1, 0, 2]));
  const { files, entries } = collectTemplateFiles(repo);
  assert.deepEqual(entries.map((e) => `${e.path}:${e.role}`).sort(), [
    '.env.example:source',
    'app/globals.css:style',
    'app/page.tsx:source',
    'package.json:source',
    'public/logo.png:asset',
  ]);
  assert.ok(Buffer.isBuffer(files.get('public/logo.png')));
  const runtime = templateRuntime(repo);
  assert.equal(runtime.install, 'pnpm install');
  assert.equal(runtime.dev, 'pnpm run dev');
  assert.deepEqual(runtime.env, ['POSTGRES_URL', 'AUTH_SECRET']);
  assert.deepEqual(runtime.dependencies, ['next@15.0.0']);
});

test('sections de template : imports locaux suivis (alias du tsconfig), styles globaux, paquets, images de public/', async () => {
  const { sectionFiles } = await import('../../importers/templates.js');
  const files = new Map<string, string | Buffer>([
    ['tsconfig.json', '{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }'],
    ['src/app/globals.css', '@import "tailwindcss";\n@import "../styles/utils.css";\n'],
    ['src/styles/utils.css', '.glass { backdrop-filter: blur(8px); }\n'],
    [
      'src/components/sections/hero.tsx',
      "import { Button } from '@/components/ui/button';\nimport data from './hero.json';\nimport { motion } from 'motion/react';\nimport { Ghost } from '@/components/absent';\nexport const Hero = () => <img src=\"/hero.png\" />;\n",
    ],
    ['src/components/sections/hero.json', '{ "title": "Bonjour" }'],
    ['src/components/ui/button.tsx', "import { cn } from '@/lib/utils';\nimport { Slot } from '@radix-ui/react-slot';\n"],
    ['src/lib/utils.ts', "import { clsx } from 'clsx';\n"],
    ['src/components/unused.tsx', 'export {}'],
    ['public/hero.png', Buffer.from([1, 2, 3])],
  ]);
  const r = sectionFiles(files, ['src/components/sections/hero.tsx'], ['src/app/globals.css']);
  assert.deepEqual(r.paths.sort(), [
    'src/app/globals.css',
    'src/components/sections/hero.json',
    'src/components/sections/hero.tsx',
    'src/components/ui/button.tsx',
    'src/lib/utils.ts',
    'src/styles/utils.css',
  ]);
  assert.deepEqual(r.packages, ['@radix-ui/react-slot', 'clsx', 'motion', 'tailwindcss']);
  assert.deepEqual(r.missing, ['@/components/absent (src/components/sections/hero.tsx)']);
  assert.deepEqual(r.publicAssets, ['public/hero.png']);
});

test('captures de template : URL des pages, texte de la démo vérifié contre le code', async () => {
  const { pageUrl, textMatchesCode } = await import('../../importers/templates.js');
  assert.equal(pageUrl('https://demo.dev', '/'), 'https://demo.dev');
  assert.equal(pageUrl('https://demo.dev/', '/pricing'), 'https://demo.dev/pricing');
  assert.equal(pageUrl('', 'https://docs.dev/sections/hero'), 'https://docs.dev/sections/hero');
  const code =
    'title = "Questions and Answers";\nconst faq = [{ question: "Why use Launch UI instead of a no-code tool?" }, { question: "Are Figma files included?" }];\n<p>Here&apos;s a list of your tasks</p>';
  assert.ok(textMatchesCode('Questions and Answers\nWhy use Launch UI instead of a no-code tool?\nAre Figma files included?', code));
  assert.ok(
    textMatchesCode("QUESTIONS AND ANSWERS\nHere's a list of your tasks\nTASK-9366", code),
    'casse, entités JSX, données aléatoires minoritaires',
  );
  assert.ok(
    !textMatchesCode(
      'Questions and Answers\nWhy good design is critical for your business?\nWho builds the best landing pages?\nCan I get a refund?',
      code,
    ),
    'autre variante de la section',
  );
  assert.ok(textMatchesCode('42 %\n1,234', code), 'rien de vérifiable : accepté');
  const table =
    "const head = ['Views', 'Avg Time', 'Bounce']; const rows = [{ page: '/dashboard', views: '64.2k' }]; const title = 'Page Performance';";
  assert.ok(textMatchesCode('Page Performance\nViews\tAvg Time\tBounce\n/dashboard\t64.2k\t3m 12s', table), 'cellules de tableau');
  assert.ok(textMatchesCode('Traffic Quality\nWeek 1\nWeek 2', 'title="Traffic Quality" label: `Week ${i}`'), 'libellés générés ignorés');
});
