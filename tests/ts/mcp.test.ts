/**
 * Serveur MCP réel (stdio, SDK client) sur le registre du repo : code source réel, dépendances,
 * licences, bundle de spec, création de spec, prompt build-from-spec (light / full).
 */
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/index.json'), 'utf8')).items as {
  id: string;
  type: string;
  dir: string;
  licenseStatus: string;
  registryDependencies: string[];
  sourceId: string;
  framework: string;
}[];
const SPEC = `zz-test-${process.pid}`;
const CREATED = `zz-created-${process.pid}`;
const specFile = path.join(ROOT, 'specs', `${SPEC}.json`);
const client = new Client({ name: 'atlas-tests', version: '1.0.0' });

const call = async (name: string, args: Record<string, unknown> = {}) =>
  (await client.callTool({ name, arguments: args })) as { content: { type: string; text: string }[]; isError?: boolean };
const textOf = async (name: string, args: Record<string, unknown> = {}) => (await call(name, args)).content[0].text;

const block = index.find((e) => e.registryDependencies.length && e.licenseStatus === 'restricted' && e.type === 'component')!;
const theme = index.find((e) => e.type === 'theme' && e.sourceId !== 'perso')!;

const cleanup = () => {
  for (const name of [SPEC, CREATED]) {
    fs.rmSync(path.join(ROOT, 'specs', `${name}.json`), { force: true });
    fs.rmSync(path.join(ROOT, 'specs', '.history', 'specs', name), { recursive: true, force: true });
  }
};

before(async () => {
  fs.writeFileSync(
    specFile,
    JSON.stringify({
      name: SPEC,
      title: 'Spec de test',
      brief: 'Tester le MCP',
      theme: theme.id,
      fonts: [],
      easings: ['atlas/easings-standard'],
      blocks: [
        { id: block.id, note: 'Dans le hero', page: 'Accueil' },
        { id: 'absent/item', note: '' },
      ],
    }),
  );
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', path.join(ROOT, 'mcp/index.ts')],
      cwd: ROOT,
      stderr: 'ignore',
    }),
  );
});
after(async () => {
  await client.close();
  cleanup();
});

test('outils et prompt exposés ; seul create_spec écrit', async () => {
  const tools = (await client.listTools()).tools;
  assert.deepEqual(tools.map((t) => t.name).sort(), [
    'create_spec',
    'get_component',
    'get_spec',
    'get_spec_bundle',
    'get_theme',
    'list_specs',
    'search_registry',
  ]);
  assert.ok(tools.filter((t) => t.name !== 'create_spec').every((t) => t.annotations?.readOnlyHint));
  assert.equal(tools.find((t) => t.name === 'create_spec')!.annotations?.readOnlyHint, false);
  assert.deepEqual(
    (await client.listPrompts()).prompts.map((p) => p.name),
    ['build-from-spec'],
  );
});

test('get_component renvoie le code réel, la licence et les dépendances', async () => {
  const md = await textOf('get_component', { id: block.id });
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', block.dir, 'meta.json'), 'utf8'));
  const source = meta.files.find((f: { role: string }) => f.role === 'source');
  const content = fs.readFileSync(path.join(ROOT, 'registry', block.dir, 'files', source.path), 'utf8').trimEnd();
  assert.ok(md.includes(content), 'contenu exact du fichier');
  assert.match(md, /Attribution OBLIGATOIRE/);
  for (const dep of block.registryDependencies) assert.ok(md.includes(`Dépendance du registre : \`${dep}\``), dep);
  const lean = await textOf('get_component', { id: block.id, include_dependencies: false, include_demo: false });
  assert.ok(!lean.includes('Dépendance du registre :') && !lean.includes('Démo d’usage'));
  assert.equal((await call('get_component', { id: 'absent/item' })).isError, true);
});

test('get_component avec target_alias : chemins cibles et imports réécrits', async () => {
  const md = await textOf('get_component', { id: 'shadcn/button', target_alias: '@/' });
  assert.match(md, /### `components\/ui\/button\.tsx`/);
  assert.match(md, /from "@\/lib\/utils"|from '@\/lib\/utils'/);
  assert.match(md, /### `lib\/utils\.ts`/);
  assert.match(md, /Installation : `npm install [^`]*class-variance-authority/);
  assert.equal((await call('get_component', { id: 'shadcn/button', target_alias: 'src/' })).isError, true, 'alias invalide refusé');
});

test('get_theme : thèmes, polices, easings (courbes, ressorts, durées) ; refuse un composant', async () => {
  assert.match(await textOf('get_theme', { id: theme.id }), /## Tokens/);
  const easings = await textOf('get_theme', { id: 'atlas/easings-standard' });
  assert.match(easings, /easeInOutCubic.*cubic-bezier\(0.65, 0, 0.35, 1\)/);
  assert.match(easings, /## Ressorts[\s\S]*springSnappy.*stiffness: 400/);
  assert.match(easings, /## Durées[\s\S]*durationBase.*200ms/);
  assert.equal((await call('get_theme', { id: block.id })).isError, true);
});

test('search_registry : vocabulaire français, filtres, interactifs d’abord', async () => {
  const rows = JSON.parse(await textOf('search_registry', { query: 'bouton', limit: 200 }));
  assert.ok(rows.length > 5);
  assert.ok(rows.every((r: { type: string }) => r.type !== 'lib'));
  assert.ok(rows.every((r: { interactive: unknown }) => typeof r.interactive === 'boolean'));
  const interactive = JSON.parse(await textOf('search_registry', { query: 'bouton', interactive_only: true, limit: 50 }));
  assert.ok(interactive.length && interactive.every((r: { interactive: boolean }) => r.interactive));
  const native = JSON.parse(await textOf('search_registry', { framework: 'react-native', type: 'screen' }));
  assert.ok(
    native.length && native.every((r: { framework: string; type: string }) => r.framework === 'react-native' && r.type === 'screen'),
  );
  const fonts = JSON.parse(await textOf('search_registry', { type: 'font', license_status: 'open', limit: 5 }));
  assert.ok(fonts.every((r: { licenseStatus: string }) => r.licenseStatus === 'open'));
  for (const args of [{ type: 'widget' }, { limit: true }, { limit: -1 }, { query: [] }, { unknown: 1 }]) {
    assert.equal((await call('search_registry', args)).isError, true, JSON.stringify(args));
  }
});

test('specs : list_specs, get_spec (pages), get_spec_bundle', async () => {
  const specs = JSON.parse(await textOf('list_specs'));
  const mine = specs.find((s: { name: string }) => s.name === SPEC);
  assert.ok(mine && !mine.preset);
  assert.deepEqual(mine.pages, ['Accueil']);
  assert.ok(
    specs.some((s: { preset: boolean }) => s.preset),
    'presets listés',
  );
  const spec = JSON.parse(await textOf('get_spec', { name: SPEC }));
  assert.equal(spec.blocks[0].note, 'Dans le hero');
  assert.equal(spec.blocks[0].page, 'Accueil');
  assert.equal(spec.blocks[0].found, true);
  assert.equal(spec.blocks[1].found, false);
  assert.equal((await call('get_spec', { name: 'inexistante' })).isError, true);
  const bundle = await textOf('get_spec_bundle', { name: SPEC });
  assert.match(bundle, /Installation : `npm install /);
  assert.match(bundle, /`styles\/atlas-theme\.css`/);
  assert.match(bundle, /`CREDITS\.md`/);
  assert.match(bundle, /Non résolus : .*absent\/item/);
  const manifest = await textOf('get_spec_bundle', { name: SPEC, include_code: false });
  assert.ok(!manifest.includes('## Contenu') && manifest.length < bundle.length);
});

test('create_spec : ids vérifiés, conflit sans overwrite, version archivée', async () => {
  const blocks = [{ id: block.id, note: 'Hero', page: 'Accueil' }];
  const created = JSON.parse(await textOf('create_spec', { name: CREATED, title: 'Créée par Claude', theme: theme.id, blocks }));
  assert.equal(created.saved, `specs/${CREATED}.json`);
  const conflict = await call('create_spec', { name: CREATED, blocks });
  assert.equal(conflict.isError, true);
  assert.match(conflict.content[0].text, /overwrite: true/);
  assert.equal((await call('create_spec', { name: CREATED, blocks: [{ id: theme.id }] })).isError, true, 'un thème n’est pas un bloc');
  assert.equal(
    (await call('create_spec', { name: CREATED, blocks: [{ id: 'absent/item' }], overwrite: true })).isError,
    true,
    'id inconnu',
  );
  assert.equal((await call('create_spec', { name: 'Nom Invalide', blocks })).isError, true);
  assert.equal((await call('create_spec', { name: CREATED, title: 'V2', blocks, overwrite: true })).isError, undefined);
  const listed = JSON.parse(await textOf('list_specs')).find((s: { name: string }) => s.name === CREATED);
  assert.equal(listed.title, 'V2');
  assert.equal(listed.versions, 1);
});

test('prompt build-from-spec : light par défaut, full avec le code', async () => {
  const light = ((await client.getPrompt({ name: 'build-from-spec', arguments: { name: SPEC } })).messages[0].content as { text: string })
    .text;
  assert.match(light, /CODE SOURCE RÉEL/);
  assert.match(light, /### Page : Accueil/);
  assert.match(light, /Consigne : Dans le hero/);
  assert.match(light, new RegExp(`get_component\\(\\{ id: "${block.id}", target_alias: "@/" \\}\\)`));
  assert.match(light, /Attributions obligatoires/);
  assert.match(light, /introuvables.*absent\/item/);
  assert.match(light, /Paquets \(une seule commande\) : `npm install /);
  assert.ok(!light.includes('## Code ('), 'mode light : pas de code inline');
  const full = (
    (await client.getPrompt({ name: 'build-from-spec', arguments: { name: SPEC, mode: 'full' } })).messages[0].content as { text: string }
  ).text;
  assert.match(full, /## Code \(fichiers prêts à copier/);
  assert.ok(full.length > light.length);
  const completion = await client.complete({
    ref: { type: 'ref/prompt', name: 'build-from-spec' },
    argument: { name: 'name', value: 'zz-test' },
  });
  assert.ok(completion.completion.values.includes(SPEC));
});
