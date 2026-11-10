/**
 * Catalogue dans Chrome headless (registre réel du dépôt, serveur sur un port libre) :
 * chargement, recherche française, panier partagé avec le builder, détail sandboxé, prompt, mobile.
 * Ignoré si Chrome est introuvable (ATLAS_CHROME).
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Browser, startServer, type Page } from './browser.js';

let browser: Browser | null = null;
let server: Awaited<ReturnType<typeof startServer>>;
let page: Page;
/** Aperçus du registre compilés (npm run previews) ? Sinon seuls les 44 composants Atlas sont interactifs. */
let built = false;

before(async () => {
  server = await startServer();
  built = (await (await fetch(`${server.base}/api/registry`)).json()).previewsBuilt;
  browser = await Browser.launch();
  if (!browser) return;
  page = await browser.page();
  await page.goto(`${server.base}/`);
  await page.waitFor(`document.querySelectorAll('[data-card]').length > 5`);
  await page.evaluate(`localStorage.clear(); location.reload(); true`);
  await page.waitFor(`document.querySelectorAll('[data-card]').length > 5`);
});
after(async () => {
  browser?.close();
  await server?.close();
});

test('sélection Atlas affichée, aperçus montés à la demande', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  assert.ok((await page.evaluate<number>(`document.querySelectorAll('[data-card]').length`)) >= 20);
  await page.waitFor(`document.querySelectorAll('.visual > iframe').length > 0`);
  assert.ok((await page.evaluate<number>(`document.querySelectorAll('.visual > iframe').length`)) <= 12, 'plafond d’iframes actives');
  assert.ok(
    await page.evaluate<boolean>(`[...document.querySelectorAll('.visual > iframe')].every((f) => f.tabIndex === -1)`),
    'aperçus hors de l’ordre de tabulation',
  );
});

test('recherche française : « graphique » ouvre tout le catalogue et classe les graphiques', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  if (!built) return t.skip('aperçus du registre non compilés');
  await page.fill('#search', 'graphique', ['input']);
  await page.waitFor(`document.querySelector('#title').textContent === 'Tous les composants'`);
  const types = await page.evaluate<string[]>(
    `[...document.querySelectorAll('[data-card] .component-type')].slice(0, 8).map((p) => p.textContent)`,
  );
  assert.ok(types.filter((x) => /Graphiques/.test(x)).length >= 6, types.join(' | '));
  await page.click('#reset-filters');
});

test('panier partagé : ajouter ici, retrouver dans le builder', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.click('[data-view="recommend"]');
  await page.waitFor(`document.querySelectorAll('[data-card] [data-select]').length > 2`);
  await page.evaluate(`[...document.querySelectorAll('[data-card] [data-select]')].slice(0, 2).forEach((b) => b.click()); true`);
  assert.match(await page.evaluate<string>(`document.querySelector('#selection-total').textContent`), /2 blocs dans la spec/);
  const builder = await browser.page();
  await builder.goto(`${server.base}/builder`);
  await builder.waitFor(`document.querySelectorAll('#s-blocks .block').length === 2`);
  assert.deepEqual(builder.errors, []);
});

test('détail : aperçu sandboxé pour le code tiers, équivalents, prompt texte', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.click('[data-view="components"]');
  await page.waitFor(`document.querySelectorAll('[data-card]').length > 5`);
  const id = await page.evaluate<string>(
    `[...document.querySelectorAll('[data-card]')].map((c) => c.dataset.card).find((x) => !x.startsWith('magic-ui/') && !x.startsWith('motion-primitives/'))`,
  );
  if (id) {
    await page.click(`[data-detail="${id}"]`);
    await page.waitFor(`!!document.querySelector('#detail[open] .detail-zone iframe')`);
    assert.equal(
      await page.evaluate<string>(`document.querySelector('#detail .detail-zone iframe').getAttribute('sandbox')`),
      'allow-scripts',
    );
    await page.evaluate(`document.querySelector('#detail').close(); true`);
  }
  await page.click('#open-prompt');
  await page.waitFor(`!!document.querySelector('#prompt-output')`);
  assert.match(await page.evaluate<string>(`document.querySelector('#prompt-output').value`), /COMPOSANTS À INTÉGRER \(2\)/);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
});

test('mobile : aucun défilement horizontal, aucune erreur JavaScript', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  const mobile = await browser.page(390, 844);
  await mobile.viewport(390, 844, true);
  await mobile.goto(`${server.base}/`);
  await mobile.waitFor(`document.querySelectorAll('[data-card]').length > 3`);
  assert.equal(await mobile.evaluate<number>(`document.documentElement.scrollWidth - window.innerWidth`), 0);
  assert.deepEqual([...page.errors, ...mobile.errors], []);
});
