/**
 * Builder dans Chrome headless : galerie, filtres, composition (thème, blocs, ordre, consigne, page),
 * enregistrement sur disque, historique, renommage, suppression, preset, aperçu de page, éditeur de thème.
 * Les specs de test sont supprimées à la fin (historique compris).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Browser, startServer, type Page } from './browser.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const NAME = `zz-e2e-${process.pid}`;
const RENAMED = `${NAME}-b`;
let browser: Browser | null = null;
let server: Awaited<ReturnType<typeof startServer>>;
let page: Page;
let built = false;

const specFile = (name: string) => path.join(ROOT, 'specs', `${name}.json`);
const cleanup = () => {
  for (const name of [NAME, RENAMED]) {
    fs.rmSync(specFile(name), { force: true });
    fs.rmSync(path.join(ROOT, 'specs', '.history', 'specs', name), { recursive: true, force: true });
  }
};

before(async () => {
  cleanup();
  server = await startServer();
  built = (await (await fetch(`${server.base}/api/registry`)).json()).previewsBuilt;
  browser = await Browser.launch();
  if (!browser) return;
  page = await browser.page();
  await page.goto(`${server.base}/builder`);
  await page.waitFor(`document.querySelectorAll('[data-toggle]').length > 0`);
  await page.evaluate(`localStorage.clear(); location.reload(); true`);
  await page.waitFor(`document.querySelectorAll('[data-toggle]').length > 0`);
});
after(async () => {
  browser?.close();
  await server?.close();
  cleanup();
});

test('galerie : registre chargé, recherche française, filtre par type', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  assert.match(await page.evaluate<string>(`document.querySelector('#count').textContent`), /items/);
  if (built) {
    await page.fill('#q', 'graphique', ['input']);
    await page.waitFor(`[...document.querySelectorAll('[data-card] .card-meta')].length > 5`);
    assert.ok(
      await page.evaluate<boolean>(
        `(() => { const m = [...document.querySelectorAll('[data-card] .card-meta')].slice(0, 10); return m.filter((x) => /Graphiques/.test(x.textContent)).length >= 6; })()`,
      ),
    );
  }
  await page.click('#reset');
  await page.click('[data-type="theme"]');
  assert.ok(
    await page.evaluate<boolean>(
      `[...document.querySelectorAll('[data-card] .card-meta')].every((m) => m.textContent.startsWith('Thème'))`,
    ),
  );
});

test('composition : thème, trois blocs, ordre, consigne, page, enregistrement', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.click('[data-card] [data-toggle]');
  assert.ok(await page.evaluate<boolean>(`!!document.querySelector('#s-theme .theme-token')`));
  await page.click('[data-type="component"]');
  await page.evaluate(`[...document.querySelectorAll('[data-card] [data-toggle]')].slice(0, 3).forEach((b) => b.click()); true`);
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#s-blocks .block').length`), 3);
  const before = await page.evaluate<string[]>(`[...document.querySelectorAll('#s-blocks .block-title strong')].map((s) => s.textContent)`);
  await page.click('[data-move="0"][data-dir="1"]');
  const after = await page.evaluate<string[]>(`[...document.querySelectorAll('#s-blocks .block-title strong')].map((s) => s.textContent)`);
  assert.deepEqual([after[0], after[1]], [before[1], before[0]]);
  await page.fill('[data-note="0"]', 'Dans le hero', ['input']);
  await page.fill('[data-page="0"]', 'Accueil', ['input', 'change']);
  await page.fill('#s-name', NAME);
  await page.click('#save');
  await page.waitFor(`/Enregistré/.test(document.querySelector('#toast').textContent)`);
  const saved = JSON.parse(fs.readFileSync(specFile(NAME), 'utf8'));
  assert.equal(saved.blocks.length, 3);
  assert.equal(saved.blocks[0].note, 'Dans le hero');
  assert.equal(saved.blocks[0].page, 'Accueil');
  assert.ok(saved.theme);
});

test('gestion : remplacement archivé, historique, renommage, suppression', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.fill('#s-title', 'Version 2', ['input']);
  await page.click('#save');
  await page.waitFor(
    `/Enregistré/.test(document.querySelector('#toast').textContent) && JSON.parse(localStorage.getItem('atlas-builder-draft')).title === 'Version 2'`,
  );
  await page.evaluate(`document.querySelector('#spec-menu').open = true; document.querySelector('#history-spec').click(); true`);
  await page.waitFor(`document.querySelectorAll('#detail[open] .history li').length === 1`);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await page.evaluate(`document.querySelector('#spec-menu').open = true; document.querySelector('#rename-spec').click(); true`);
  await page.waitFor(`!!document.querySelector('#rename-to')`);
  await page.fill('#rename-to', RENAMED, ['input']);
  await page.evaluate(`document.querySelector('#rename-form').requestSubmit(); true`);
  await page.waitFor(`document.querySelector('#spec-state').textContent.includes('${RENAMED}')`);
  assert.ok(fs.existsSync(specFile(RENAMED)) && !fs.existsSync(specFile(NAME)));
  await page.evaluate(`document.querySelector('#spec-menu').open = true; document.querySelector('#delete-spec').click(); true`);
  await page.waitFor(`document.querySelector('#spec-state').textContent.includes('Brouillon')`);
  assert.ok(!fs.existsSync(specFile(RENAMED)), 'spec supprimée');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#s-blocks .block').length`), 3, 'contenu conservé dans le builder');
});

test('aperçu composé de la page et éditeur de thème', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.click('#preview-page');
  await page.waitFor(`!!document.querySelector('#detail[open] #page-frames')`);
  assert.ok((await page.evaluate<number>(`document.querySelectorAll('#page-frames iframe, #page-frames .page-missing').length`)) >= 1);
  assert.ok(
    await page.evaluate<boolean>(`[...document.querySelectorAll('#page-frames iframe')].every((f) => parseInt(f.style.height) >= 80)`),
    'hauteur appliquée',
  );
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await page.click('#create-theme');
  await page.waitFor(`document.querySelectorAll('#token-grid .token-row').length === 16`);
  await page.click('[data-mode="dark"]');
  await page.waitFor(`document.querySelector('[data-mode="dark"]').getAttribute('aria-pressed') === 'true'`);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
});

test('preset chargé comme point de départ, aucune erreur JavaScript', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.waitFor(`!!document.querySelector('#load-spec option[value^="preset:"]')`);
  await page.evaluate(
    `const s = document.querySelector('#load-spec'); s.value = s.querySelector('option[value^="preset:"]').value; s.dispatchEvent(new Event('change')); true`,
  );
  await page.waitFor(`document.querySelector('#s-name').value === '' && document.querySelectorAll('#s-blocks .block').length > 0`);
  assert.deepEqual(page.errors, []);
});
