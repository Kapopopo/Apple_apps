/** Serveur web : protection DNS rebinding et cross-origin, pages, API du registre, specs (historique), thèmes, registre shadcn. */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { makeRoot, seedRegistry } from './fixture.js';

const root = makeRoot('atlas-server-');
await seedRegistry();
const { createAtlasServer } = await import('../../server/app.js');

let server: http.Server;
let port = 0;
before(async () => {
  server = createAtlasServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  port = (server.address() as AddressInfo).port;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));

interface Reply {
  status: number;
  headers: http.IncomingHttpHeaders;
  text: string;
  json: () => any;
}

function request(
  method: string,
  url: string,
  options: { body?: unknown; headers?: Record<string, string>; host?: string } = {},
): Promise<Reply> {
  const payload = options.body === undefined ? undefined : typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  const headers: Record<string, string> = {
    Host: options.host ?? `127.0.0.1:${port}`,
    ...(payload !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, method, path: url, headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve({ status: res.statusCode ?? 0, headers: res.headers, text, json: () => JSON.parse(text) });
      });
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

test('DNS rebinding : Host étranger refusé, Host local accepté', async () => {
  assert.equal((await request('GET', '/api/specs', { host: `evil.example:${port}` })).status, 403);
  assert.equal((await request('GET', '/', { host: 'evil.example' })).status, 403);
  assert.equal((await request('GET', '/', { host: `127.0.0.1:${port + 1}` })).status, 403, 'mauvais port');
  assert.equal((await request('GET', '/', { host: `localhost:${port}` })).status, 200);
  const evil = await request('POST', '/api/specs', { host: `evil.example:${port}`, body: { spec: { name: 'pirate', blocks: [] } } });
  assert.equal(evil.status, 403);
  assert.ok(!fs.existsSync(path.join(root, 'specs/pirate.json')), 'aucune écriture');
});

test('écritures : même origine et JSON uniquement', async () => {
  const cross = await request('POST', '/api/specs', {
    body: { spec: { name: 'x', blocks: [] } },
    headers: { Origin: 'http://evil.example' },
  });
  assert.equal(cross.status, 403);
  const site = await request('POST', '/api/specs', {
    body: { spec: { name: 'x', blocks: [] } },
    headers: { 'Sec-Fetch-Site': 'cross-site' },
  });
  assert.equal(site.status, 403);
  const form = await request('POST', '/api/specs', { body: 'spec=1', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  assert.equal(form.status, 415);
  assert.equal((await request('POST', '/api/specs', { body: '{"spec":', headers: {} })).status, 400);
  assert.equal((await request('PUT', '/api/specs')).status, 405);
});

test('pages et fichiers : CSP, nosniff, aucune sortie du dossier web', async () => {
  const page = await request('GET', '/');
  assert.equal(page.status, 200);
  assert.match(String(page.headers['content-security-policy']), /frame-ancestors 'none'/);
  assert.equal(page.headers['x-content-type-options'], 'nosniff');
  assert.equal((await request('GET', '/builder')).status, 200);
  assert.equal((await request('GET', '/app.js')).status, 200);
  assert.equal((await request('GET', '/../package.json')).status, 404);
  assert.equal((await request('GET', '/registry-previews/..%2F..%2Fdata%2Fcuration.json')).status, 404);
  const preview = await request('GET', '/registry-previews/index.html');
  assert.equal(preview.headers['access-control-allow-origin'], '*');
  assert.match(String(preview.headers['content-security-policy']), /connect-src 'none'/);
});

test('API registre : textes de licence restaurés, état d’aperçu', async () => {
  const reg = (await request('GET', '/api/registry')).json();
  assert.equal(reg.count, 5);
  assert.ok(reg.sources['demo-src']);
  const card = reg.items.find((i: { id: string }) => i.id === 'demo-src/card');
  assert.equal(card.previewState, 'interactive', 'aperçus construits, pas encore d’audit');
  const item = (await request('GET', '/api/registry/item?id=demo-src/card')).json();
  assert.equal(item.attribution, 'Crédit « Demo UI » obligatoire');
  assert.match(item.files.find((f: { path: string }) => f.path === 'components/card/card.tsx').content, /export function Card/);
  assert.equal((await request('GET', '/api/registry/item?id=../../etc')).status, 404);
  const catalogue = (await request('GET', '/api/catalog')).json();
  assert.ok(catalogue.components.some((c: { id: string; attribution: string }) => c.id === 'demo-src/card' && c.attribution));
});

test('specs : création, conflit, remplacement archivé, historique, renommage, suppression', async () => {
  const spec = {
    name: 'site-client',
    title: 'Site client',
    theme: 'demo-src/theme',
    blocks: [{ id: 'demo-src/card', note: 'hero', page: 'Accueil' }],
  };
  assert.equal((await request('POST', '/api/specs', { body: { spec } })).status, 200);
  const again = await request('POST', '/api/specs', { body: { spec } });
  assert.equal(again.status, 409);
  assert.equal(again.json().exists, true);
  const bad = await request('POST', '/api/specs', {
    body: { spec: { ...spec, blocks: [{ id: 'demo-src/theme', note: '' }] }, overwrite: true },
  });
  assert.equal(bad.status, 400, 'un thème n’est pas un bloc');
  const unknown = await request('POST', '/api/specs', { body: { spec: { ...spec, extra: 1 }, overwrite: true } });
  assert.equal(unknown.status, 400, 'champ inconnu refusé');
  assert.equal((await request('POST', '/api/specs', { body: { spec: { ...spec, title: 'Version 2' }, overwrite: true } })).status, 200);
  const list = (await request('GET', '/api/specs')).json();
  assert.deepEqual(
    list.map((s: { name: string; versions: number }) => [s.name, s.versions]),
    [['site-client', 1]],
  );
  const history = (await request('GET', '/api/specs/site-client/history')).json();
  assert.equal(history.length, 1);
  const old = (await request('GET', `/api/specs/site-client/history/${history[0].stamp}`)).json();
  assert.equal(old.title, 'Site client', 'version remplacée conservée');
  assert.equal((await request('GET', '/api/specs/site-client')).json().blocks[0].page, 'Accueil');
  const renamed = await request('POST', '/api/specs/site-client/rename', { body: { to: 'site-boulangerie' } });
  assert.equal(renamed.status, 200);
  assert.equal((await request('GET', '/api/specs/site-client')).status, 404);
  assert.equal((await request('GET', '/api/specs/site-boulangerie/history')).json().length, 1, 'l’historique suit le renommage');
  assert.equal((await request('DELETE', '/api/specs/site-boulangerie')).status, 200);
  assert.equal((await request('GET', '/api/specs/site-boulangerie')).status, 404);
  const afterDelete = (await request('GET', '/api/specs/site-boulangerie/history')).json();
  assert.ok(
    afterDelete.some((v: { deleted: boolean }) => v.deleted),
    'suppression archivée',
  );
});

test('thèmes personnels : création, skin CSS, valeurs dangereuses refusées, suppression', async () => {
  const theme = {
    name: 'Boulangerie',
    light: { '--background': '#fffaf0', '--primary': 'oklch(0.55 0.15 60)' },
    dark: { '--background': '#1a1410' },
    radius: '12px',
  };
  const created = await request('POST', '/api/themes', { body: { theme } });
  assert.equal(created.status, 200, created.text);
  assert.equal(created.json().id, 'perso/boulangerie');
  const skin = await request('GET', '/api/skin.css?id=perso/boulangerie');
  assert.equal(skin.headers['access-control-allow-origin'], '*');
  assert.match(skin.text, /--background: #fffaf0;/);
  assert.match(skin.text, /\.dark, \[data-theme="dark"\] \{\n {2}--background: #1a1410;/);
  assert.equal((await request('POST', '/api/themes', { body: { theme } })).status, 409);
  for (const value of ['red; } body { display:none', 'url(https://evil.example/x)', '"quoted"', 'a /* b */']) {
    const res = await request('POST', '/api/themes', { body: { theme: { name: 'Pirate', light: { '--background': value } } } });
    assert.equal(res.status, 400, value);
  }
  assert.equal(
    (await request('GET', '/api/registry')).json().items.some((i: { id: string }) => i.id === 'perso/boulangerie'),
    true,
    'thème indexé',
  );
  assert.equal((await request('DELETE', '/api/themes/perso/boulangerie')).status, 200);
  assert.equal((await request('GET', '/api/skin.css?id=perso/boulangerie')).status, 404);
  assert.equal((await request('DELETE', '/api/themes/demo-src/theme')).status, 404, 'seuls les thèmes personnels se suppriment');
});

test('registre shadcn : index, item installable, dépendances en URL', async () => {
  const index = (await request('GET', '/r/registry.json')).json();
  assert.ok(index.items.some((i: { name: string }) => i.name === 'demo-src--card'));
  assert.ok(!index.items.some((i: { name: string }) => i.name === 'demo-src--theme'), 'les thèmes ne passent pas par shadcn add');
  const item = (await request('GET', '/r/demo-src/card.json')).json();
  assert.equal(item.type, 'registry:component');
  assert.ok(item.registryDependencies.includes('utils'));
  assert.ok(item.registryDependencies.includes(`http://127.0.0.1:${port}/r/shadcn/button.json`));
  assert.deepEqual(item.dependencies, ['clsx', 'motion', 'tailwind-merge'], 'les paquets du bouton viennent avec sa propre URL');
  const card = item.files.find((f: { path: string }) => f.path.endsWith('card.tsx'));
  assert.match(card.content, /from '@\/components\/ui\/button'/);
  assert.ok(!item.files.some((f: { path: string }) => f.path === 'lib/utils.ts'), 'cn fourni par la dépendance utils de shadcn');
  assert.equal(item.meta.licenseStatus, 'restricted');
  assert.equal((await request('GET', '/r/demo-src/absent.json')).status, 404);
});

test('enrichissement français : affiché et cherchable si à jour, ignoré si le code a changé', async () => {
  const items = JSON.parse(fs.readFileSync(path.join(root, 'registry/index.json'), 'utf8')).items as { id: string; contentHash: string }[];
  const card = items.find((i) => i.id === 'demo-src/card')!;
  const button = items.find((i) => i.id === 'shadcn/button')!;
  const entry = (hash: string, description: string) => ({
    hash,
    description,
    usages: ['page d’accueil'],
    keywords: ['carte animée'],
    model: 'test',
    at: '',
  });
  fs.writeFileSync(
    path.join(root, 'registry/_enrichment.json'),
    JSON.stringify({
      items: { [card.id]: entry(card.contentHash, 'Carte qui s’anime au survol.'), [button.id]: entry('ancien-hash', 'Bouton obsolète') },
    }),
  );
  const reg = (await request('GET', '/api/registry')).json();
  const enriched = reg.items.find((i: { id: string }) => i.id === card.id);
  assert.equal(enriched.descriptionFr, 'Carte qui s’anime au survol.');
  assert.deepEqual(enriched.keywords, ['carte animée']);
  assert.equal(reg.items.find((i: { id: string }) => i.id === button.id).descriptionFr, undefined, 'version périmée ignorée');
  const catalogue = (await request('GET', '/api/catalog')).json();
  const c = catalogue.components.find((x: { id: string }) => x.id === card.id);
  assert.equal(c.description, 'Carte qui s’anime au survol.');
  assert.match(c.search_terms, /carte animee/);
  fs.rmSync(path.join(root, 'registry/_enrichment.json'));
});
