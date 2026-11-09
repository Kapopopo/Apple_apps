/** Bundle : chemins cibles, imports réécrits, helper cn unique, dépendances, crédits, mode shallow, bundle de spec et CLI. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { makeRoot, seedRegistry } from './fixture.js';

const root = makeRoot('atlas-bundle-');
await seedRegistry();
const { bundleItems } = await import('../../shared/bundle.js');
const { specBundle } = await import('../../shared/spec-bundle.js');
const { saveSpec } = await import('../../shared/specs.js');
const { indexItems } = await import('../../shared/registry.js');

const file = (b: { files: { path: string; content: string }[] }, p: string) => b.files.find((f) => f.path === p)?.content ?? '';

test('bundle complet : dépendances d’abord, chemins cibles, imports réécrits', () => {
  const b = bundleItems(['demo-src/card']);
  assert.deepEqual(b.items, ['shadcn/utils', 'shadcn/button', 'demo-src/card']);
  assert.deepEqual(b.files.map((f) => f.path), [
    'components/atlas/demo-src/card/card.css', 'components/atlas/demo-src/card/card.tsx', 'components/atlas/demo-src/card/helper.ts', 'components/ui/button.tsx', 'lib/utils.ts',
  ]);
  const card = file(b, 'components/atlas/demo-src/card/card.tsx');
  assert.match(card, /from '@\/components\/ui\/button'/, 'primitive shadcn à son emplacement standard');
  assert.match(card, /from '@\/lib\/utils'/);
  assert.match(card, /from '@\/components\/atlas\/demo-src\/card\/helper'/);
  assert.match(card, /import '@\/components\/atlas\/demo-src\/card\/card\.css'/, 'extension CSS conservée');
  assert.match(file(b, 'components/ui/button.tsx'), /from '@\/lib\/utils'/);
  assert.match(file(b, 'lib/utils.ts'), /export function cn/, 'un seul helper cn');
});

test('dépendances npm uniques, react exclu ; import manquant signalé', () => {
  const b = bundleItems(['demo-src/card']);
  assert.deepEqual(b.dependencies, ['@radix-ui/react-slot', 'clsx', 'motion', 'tailwind-merge']);
  assert.deepEqual(b.missing, ['@/components/ghost (importé par demo-src/card)']);
});

test('alias relatif et alias personnalisé', () => {
  const rel = bundleItems(['demo-src/card'], { alias: 'relative' });
  const card = file(rel, 'components/atlas/demo-src/card/card.tsx');
  assert.match(card, /from '\.\.\/\.\.\/\.\.\/ui\/button'/);
  assert.match(card, /from '\.\.\/\.\.\/\.\.\/\.\.\/lib\/utils'/);
  assert.match(card, /from '\.\/helper'/);
  const tilde = bundleItems(['shadcn/button'], { alias: '~/' });
  assert.match(file(tilde, 'components/ui/button.tsx'), /from '~\/lib\/utils'/);
});

test('crédits : sources à attribution obligatoire en premier, conditions reprises', () => {
  const { credits } = bundleItems(['demo-src/card']);
  assert.ok(credits.indexOf('## Demo UI') < credits.indexOf('## shadcn/ui'));
  assert.match(credits, /Attribution obligatoire : Crédit « Demo UI » obligatoire/);
  assert.match(credits, /Conditions : Revente interdite/);
  assert.match(credits, /Éléments : Fancy Card/);
});

test('shallow : seuls les fichiers de l’item, items importés listés à part', () => {
  const b = bundleItems(['demo-src/card'], { shallow: true });
  assert.deepEqual(b.files.map((f) => f.path).filter((p) => !p.startsWith('lib/')), ['components/atlas/demo-src/card/card.css', 'components/atlas/demo-src/card/card.tsx', 'components/atlas/demo-src/card/helper.ts']);
  assert.deepEqual(b.external, ['shadcn/button']);
  assert.match(file(b, 'components/atlas/demo-src/card/card.tsx'), /from '@\/components\/ui\/button'/, 'import réécrit vers l’emplacement que shadcn installera');
});

test('démos incluses sur demande, réécrites vers le composant', () => {
  const b = bundleItems(['shadcn/button'], { demos: true });
  assert.match(file(b, 'components/atlas/shadcn/button/demo/button-demo.tsx'), /from '@\/components\/ui\/button'/);
});

test('bundle de spec : thème CSS, easings, CREDITS.md, une commande npm install', () => {
  const saved = saveSpec({ name: 'demo', title: 'Démo', theme: 'demo-src/theme', easings: ['atlas/easings-standard'], blocks: [{ id: 'demo-src/card', note: 'hero' }, { id: 'shadcn/button', note: '' }] }, indexItems());
  assert.ok(saved.ok, saved.ok ? '' : saved.error);
  const b = specBundle(saved.ok ? saved.spec : (null as never));
  const extras = Object.fromEntries(b.extras.map((f) => [f.path, f.content]));
  assert.match(extras['styles/atlas-theme.css'], /--background: #ffffff;/);
  assert.match(extras['styles/atlas-theme.css'], /\.dark, \[data-theme="dark"\] \{\n {2}--background: #000000;/);
  assert.match(extras['lib/easings.ts'], /easeOutCubic/);
  assert.match(extras['styles/easings.css'], /--ease-out-cubic/);
  assert.match(extras['CREDITS.md'], /## Component Atlas[\s\S]*BSD-3-Clause/);
  assert.equal(b.install, 'npm install @radix-ui/react-slot clsx motion tailwind-merge');
  assert.equal(b.files.filter((f) => f.path === 'components/ui/button.tsx').length, 1, 'bloc partagé émis une fois');
});

test('CLI bundle : écrit dans src/, refuse d’écraser sans --force', () => {
  const project = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-project-'));
  fs.mkdirSync(path.join(project, 'src'));
  const cli = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../scripts/bundle.ts');
  const run = (...args: string[]) => spawnSync(process.execPath, ['--import', 'tsx', cli, ...args], { encoding: 'utf8', env: { ...process.env, ATLAS_ROOT: root } });
  const first = run('demo', '--out', project);
  assert.equal(first.status, 0, first.stderr);
  assert.ok(fs.existsSync(path.join(project, 'src/components/ui/button.tsx')));
  assert.ok(fs.existsSync(path.join(project, 'src/styles/atlas-theme.css')));
  assert.ok(fs.existsSync(path.join(project, 'CREDITS.md')), 'crédits à la racine du projet');
  assert.match(first.stdout, /npm install @radix-ui\/react-slot clsx motion tailwind-merge/);
  assert.equal(run('demo', '--out', project).status, 0, 'relance identique : rien à écrire');
  fs.writeFileSync(path.join(project, 'src/lib/utils.ts'), '// modifié par le projet\n');
  const conflict = run('demo', '--out', project);
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /src\/lib\/utils\.ts/);
  assert.equal(fs.readFileSync(path.join(project, 'src/lib/utils.ts'), 'utf8'), '// modifié par le projet\n', 'fichier du projet intact');
  assert.equal(run('demo', '--out', project, '--force').status, 0);
  assert.match(fs.readFileSync(path.join(project, 'src/lib/utils.ts'), 'utf8'), /export function cn/);
});
