/**
 * Serveur MCP réel (stdio, SDK client) sur le registre du repo : code source réel, dépendances,
 * licences, specs, prompt build-from-spec et parité des outils historiques avec catalog.py.
 */
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry/index.json'), 'utf8')).items as { id: string; type: string; dir: string; licenseStatus: string; registryDependencies: string[]; sourceId: string }[];
const SPEC = `zz-test-${process.pid}`;
const specFile = path.join(ROOT, 'specs', `${SPEC}.json`);
const client = new Client({ name: 'atlas-tests', version: '1.0.0' });

const call = async (name: string, args: Record<string, unknown> = {}) => (await client.callTool({ name, arguments: args })) as { content: { type: string; text: string }[]; isError?: boolean };
const textOf = async (name: string, args: Record<string, unknown> = {}) => (await call(name, args)).content[0].text;

const block = index.find((e) => e.registryDependencies.length && e.licenseStatus === 'restricted' && e.type === 'component')!;
const theme = index.find((e) => e.type === 'theme')!;

before(async () => {
  fs.writeFileSync(specFile, JSON.stringify({ name: SPEC, title: 'Spec de test', brief: 'Tester le MCP', theme: theme.id, fonts: [], easings: ['atlas/easings-standard'], blocks: [{ id: block.id, note: 'Dans le hero' }, { id: 'absent/item', note: '' }] }));
  await client.connect(new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', path.join(ROOT, 'mcp/index.ts')], cwd: ROOT, stderr: 'ignore' }));
});
after(async () => { await client.close(); fs.rmSync(specFile, { force: true }); });

test('outils et prompt exposés', async () => {
  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepEqual(tools, ['get_component', 'get_spec', 'get_theme', 'list_sources', 'list_specs', 'recommend_components', 'search_components', 'search_registry']);
  assert.ok((await client.listTools()).tools.every((t) => t.annotations?.readOnlyHint));
  assert.deepEqual((await client.listPrompts()).prompts.map((p) => p.name), ['build-from-spec']);
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
  const missing = await call('get_component', { id: 'absent/item' });
  assert.equal(missing.isError, true);
});

test('get_theme : thèmes, polices et easings ; refuse un composant', async () => {
  assert.match(await textOf('get_theme', { id: theme.id }), /## Tokens/);
  assert.match(await textOf('get_theme', { id: 'atlas/easings-standard' }), /easeInOutCubic.*cubic-bezier\(0.65, 0, 0.35, 1\)/);
  assert.equal((await call('get_theme', { id: block.id })).isError, true);
});

test('search_registry : vocabulaire français, filtres, utilitaires masqués', async () => {
  const rows = JSON.parse(await textOf('search_registry', { query: 'bouton', limit: 200 }));
  assert.ok(rows.length > 5);
  assert.ok(rows.every((r: { type: string }) => r.type !== 'lib'));
  const native = JSON.parse(await textOf('search_registry', { framework: 'react-native', type: 'screen' }));
  assert.ok(native.length && native.every((r: { framework: string; type: string }) => r.framework === 'react-native' && r.type === 'screen'));
  const fonts = JSON.parse(await textOf('search_registry', { type: 'font', license_status: 'open', limit: 5 }));
  assert.ok(fonts.every((r: { licenseStatus: string }) => r.licenseStatus === 'open'));
  assert.equal((await call('search_registry', { type: 'widget' })).isError, true);
});

test('specs : list_specs, get_spec, prompt build-from-spec', async () => {
  const specs = JSON.parse(await textOf('list_specs'));
  assert.ok(specs.some((s: { name: string; preset: boolean }) => s.name === SPEC && !s.preset));
  assert.ok(specs.some((s: { preset: boolean }) => s.preset), 'presets listés');
  const spec = JSON.parse(await textOf('get_spec', { name: SPEC }));
  assert.equal(spec.blocks[0].note, 'Dans le hero');
  assert.equal(spec.blocks[0].found, true);
  assert.equal(spec.blocks[1].found, false);
  assert.equal((await call('get_spec', { name: 'inexistante' })).isError, true);
  const prompt = await client.getPrompt({ name: 'build-from-spec', arguments: { name: SPEC } });
  const body = (prompt.messages[0].content as { text: string }).text;
  assert.match(body, /CODE SOURCE RÉEL/);
  assert.match(body, /Consigne : Dans le hero/);
  assert.match(body, /Attributions obligatoires/);
  assert.match(body, /introuvables.*absent\/item/);
  assert.ok(body.includes(`## Thème`));
  const completion = await client.complete({ ref: { type: 'ref/prompt', name: 'build-from-spec' }, argument: { name: 'name', value: 'zz-test' } });
  assert.ok(completion.completion.values.includes(SPEC));
});

test('outils historiques : validation stricte des arguments', async () => {
  for (const args of [{ limit: true }, { limit: -1 }, { query: [] }, { verified_only: 'yes' }, { unknown: 1 }, { kind: 'script' }]) {
    assert.equal((await call('search_components', args)).isError, true, JSON.stringify(args));
  }
  const rec = JSON.parse(await textOf('recommend_components', { source: 'motion-primitives', limit: 4 }));
  assert.equal(rec.length, 4);
  assert.ok(rec.every((c: { source_id: string; curation: unknown }) => c.source_id === 'motion-primitives' && c.curation));
  const charts = JSON.parse(await textOf('search_components', { query: 'graphique', limit: 100 }));
  assert.ok(charts.length && charts.every((c: { type_label: string }) => c.type_label === 'Graphiques'));
});

function python(): string[] | null {
  for (const cmd of [['py', '-3.12'], ['py', '-3'], ['python3'], ['python']]) {
    const r = spawnSync(cmd[0], [...cmd.slice(1), '-c', 'import sys; assert sys.version_info >= (3, 9)'], { encoding: 'utf8' });
    if (r.status === 0) return cmd;
  }
  return null;
}

test('parité avec catalog.py (mêmes ids, même ordre)', async (t) => {
  const py = python();
  if (!py) { t.skip('Python ≥ 3.9 introuvable'); return; }
  for (const args of [{ query: 'graphique' }, { query: 'carrousel' }, { query: 'bouton anime' }, { source: 'magic-ui' }, { kind: 'Référence visuelle' }, {}]) {
    const code = `import json,sys; sys.path.insert(0, r'${ROOT}'); from catalog import search; print(json.dumps([c['id'] for c in search(**json.loads(sys.argv[1]), limit=100)]))`;
    const r = spawnSync(py[0], [...py.slice(1), '-c', code, JSON.stringify(args)], { encoding: 'utf8', cwd: ROOT, env: { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' } });
    assert.equal(r.status, 0, r.stderr);
    const expected = JSON.parse(r.stdout);
    const actual = JSON.parse(await textOf('search_components', { ...args, limit: 100 })).map((c: { id: string }) => c.id);
    assert.deepEqual(actual, expected, JSON.stringify(args));
  }
});
