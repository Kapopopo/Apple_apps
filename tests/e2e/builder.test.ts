/**
 * Builder en étapes dans Chrome headless : parcours web et mobile, galerie filtrée par étape, état modifié et
 * commande, erreurs au champ, annulation, historique, renommage, suppression, preset, thème, petit écran.
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
const MOBILE = `${NAME}-app`;
let browser: Browser | null = null;
let server: Awaited<ReturnType<typeof startServer>>;
let page: Page;
let built = false;

const specFile = (name: string) => path.join(ROOT, 'specs', `${name}.json`);
const cleanup = () => {
  for (const name of [NAME, RENAMED, MOBILE]) {
    fs.rmSync(specFile(name), { force: true });
    fs.rmSync(path.join(ROOT, 'specs', '.history', 'specs', name), { recursive: true, force: true });
  }
};

/** Le builder a fini de charger : une étape est affichée. */
const ready = () => page.waitFor(`!!document.querySelector('#steps [data-current]')`);
const restart = async () => {
  await page.evaluate(`localStorage.clear(); location.href = '/builder'; true`);
  await page.waitFor(
    `document.querySelector('#steps [data-current]')?.dataset.step === 'project' && !document.querySelector('#s-title').value`,
  );
};
const go = async (step: string) => {
  await page.click(`#steps [data-step="${step}"]`);
  await page.waitFor(`document.body.dataset.step === '${step}'`);
};
const text = (selector: string) => page.evaluate<string>(`document.querySelector('${selector}').textContent`);
const is = (expression: string) => page.evaluate<boolean>(`!!(${expression})`);
const toast = (pattern: string) => page.waitFor(`/${pattern}/.test(document.querySelector('#toast').textContent)`);

before(async () => {
  cleanup();
  server = await startServer();
  built = (await (await fetch(`${server.base}/api/registry`)).json()).previewsBuilt;
  browser = await Browser.launch();
  if (!browser) return;
  page = await browser.page();
  await page.goto(`${server.base}/builder`);
  await ready();
  await restart();
});
after(async () => {
  browser?.close();
  await server?.close();
  cleanup();
});

test('une tâche par étape : pas de galerie au projet, galerie filtrée au style et aux blocs', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  assert.ok(await is(`document.querySelector('#gallery').hidden`), 'projet sans galerie');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#steps [data-step]').length`), 4);

  await go('style');
  assert.ok(
    await is(`[...document.querySelectorAll('[data-card] .card-meta')].every((m) => m.textContent.startsWith('Thème'))`),
    'thèmes seulement',
  );
  await page.click('[data-type="font"]');
  assert.ok(
    await is(`[...document.querySelectorAll('[data-card] .card-meta')].every((m) => m.textContent.startsWith('Police'))`),
    'polices seulement',
  );

  await go('blocks');
  assert.match(await text('#count'), /items/);
  if (built) {
    await page.fill('#q', 'graphique', ['input']);
    await page.waitFor(`[...document.querySelectorAll('[data-card] .card-meta')].length > 5`);
    assert.ok(
      await is(
        `(() => { const m = [...document.querySelectorAll('[data-card] .card-meta')].slice(0, 10); return m.filter((x) => /Graphiques/.test(x.textContent)).length >= 6; })()`,
      ),
      'recherche en français',
    );
    await page.click('#reset');
  }
  await page.click('#suggestions [data-q="hero"]');
  assert.equal(await page.evaluate<string>(`document.querySelector('#q').value`), 'hero');
  await page.click('#reset');
});

test('erreurs : en français, au champ, focus posé dessus', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.click('#save');
  await page.waitFor(`document.body.dataset.step === 'project'`);
  assert.equal(await page.evaluate<string>(`document.activeElement.id`), 's-title');
  assert.equal(await page.evaluate<string>(`document.querySelector('#s-title').getAttribute('aria-invalid')`), 'true');
  assert.match(await text('.field-error'), /Donnez un nom au projet/);
  await page.fill('#s-title', 'Boulangerie', ['input']);
  assert.ok(await is(`!document.querySelector('.field-error')`), 'erreur effacée dès la correction');
  assert.equal(await page.evaluate<string>(`document.querySelector('#s-name').value`), 'boulangerie', 'nom de fichier déduit');
});

test('composition : thème, trois blocs, ordre, consigne, page, enregistrement', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await go('style');
  await page.click('[data-type="theme"]');
  await page.click('[data-card] [data-toggle]');
  assert.ok(await is(`document.querySelector('#s-theme .theme-token')`), 'thème choisi');

  await go('blocks');
  await page.click('[data-type="component"]');
  await page.evaluate(`[...document.querySelectorAll('[data-card] [data-toggle]')].slice(0, 3).forEach((b) => b.click()); true`);
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#s-blocks .block').length`), 3);
  const names = `[...document.querySelectorAll('#s-blocks .block-title strong')].map((s) => s.textContent)`;
  const before = await page.evaluate<string[]>(names);
  await page.click('[data-move="0"][data-dir="1"]');
  const after = await page.evaluate<string[]>(names);
  assert.deepEqual([after[0], after[1]], [before[1], before[0]]);

  await page.click('[data-open="0"]');
  assert.ok(await is(`!document.querySelector('[data-note="0"]').closest('.block-fields').hidden`), 'consigne dépliée');
  await page.fill('[data-note="0"]', 'Dans le hero', ['input']);
  await page.fill('[data-page="0"]', 'Accueil', ['input', 'change']);
  await page.fill('#s-name', NAME);

  await go('launch');
  assert.ok(await is(`document.querySelector('#command-ready').hidden`), 'pas de commande avant enregistrement');
  await page.click('#save');
  await toast('Enregistré');
  const saved = JSON.parse(fs.readFileSync(specFile(NAME), 'utf8'));
  assert.equal(saved.blocks.length, 3);
  assert.equal(saved.blocks[0].note, 'Dans le hero');
  assert.equal(saved.blocks[0].page, 'Accueil');
  assert.ok(saved.theme, 'thème enregistré');
  await page.waitFor(`!document.querySelector('#command-ready').hidden`);
  assert.equal(await text('#mcp-command'), `/mcp__atlas__build-from-spec ${NAME}`);
});

test('état modifié : la commande disparaît jusqu’à l’enregistrement, et survit au rechargement', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.fill('#s-brief', 'Vitrine de la boulangerie', ['input']);
  assert.equal(await page.evaluate<string>(`document.querySelector('#save-state').dataset.status`), 'dirty');
  assert.ok(await is(`document.querySelector('#command-ready').hidden`), 'commande périmée cachée');
  await page.click('#save-copy');
  await page.waitFor(
    `document.querySelector('#save-state').dataset.status === 'saved' && !document.querySelector('#command-ready').hidden`,
  );
  await page.evaluate(`location.reload(); true`);
  await page.waitFor(`document.querySelector('#save-state')?.dataset.status === 'saved' && document.body.dataset.step === 'launch'`);
});

test('fichier changé par le MCP : la nouvelle version est reprise si rien n’a été modifié ici', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  const changed = { ...JSON.parse(fs.readFileSync(specFile(NAME), 'utf8')), style: 'Chaleureux' };
  fs.writeFileSync(specFile(NAME), JSON.stringify(changed));
  await page.evaluate(`window.dispatchEvent(new Event('focus')); true`);
  await page.waitFor(`document.querySelector('#s-style').value === 'Chaleureux'`);
  assert.equal(await page.evaluate<string>(`document.querySelector('#save-state').dataset.status`), 'saved');
});

test('annuler une suppression ; Précédent du navigateur suit les étapes', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await go('blocks');
  await page.click('[data-remove="0"]');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#s-blocks .block').length`), 2);
  await page.click('#toast button');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#s-blocks .block').length`), 3);
  assert.equal(await page.evaluate<string>(`document.querySelector('#save-state').dataset.status`), 'saved', 'retour à l’état enregistré');
  await page.evaluate(`history.back(); true`);
  await page.waitFor(`document.body.dataset.step === 'launch'`);
});

test('gestion : remplacement archivé, historique, renommage, suppression', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  const versions = async () => ((await (await fetch(`${server.base}/api/specs/${NAME}/history`)).json()) as unknown[]).length;
  const count = await versions();
  await page.fill('#s-title', 'Version 2', ['input']);
  assert.equal(await page.evaluate<string>(`document.querySelector('#s-name').value`), NAME, 'le fichier enregistré garde son nom');
  await page.click('#save');
  await page.waitFor(`document.querySelector('#save-state').dataset.status === 'saved'`);
  assert.equal(await versions(), count + 1);
  await page.evaluate(`document.querySelector('#spec-menu').open = true; document.querySelector('#history-spec').click(); true`);
  await page.waitFor(`document.querySelectorAll('#detail[open] .history li').length === ${count + 1}`);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await page.evaluate(`document.querySelector('#spec-menu').open = true; document.querySelector('#rename-spec').click(); true`);
  await page.waitFor(`!!document.querySelector('#rename-to')`);
  await page.fill('#rename-to', RENAMED, ['input']);
  await page.evaluate(`document.querySelector('#rename-form').requestSubmit(); true`);
  await page.waitFor(`document.querySelector('#spec-state').textContent.includes('${RENAMED}')`);
  await page.waitFor(`document.querySelector('#save-state').dataset.status === 'saved'`);
  assert.ok(fs.existsSync(specFile(RENAMED)) && !fs.existsSync(specFile(NAME)), 'fichier renommé');
  await page.evaluate(`document.querySelector('#spec-menu').open = true; document.querySelector('#delete-spec').click(); true`);
  await page.waitFor(`document.querySelector('#spec-state').textContent.includes('Brouillon')`);
  assert.ok(!fs.existsSync(specFile(RENAMED)), 'spec supprimée');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#s-blocks .block').length`), 3, 'contenu conservé dans le builder');
});

test('aperçu composé de la page et éditeur de thème', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await go('blocks');
  await page.click('#preview-page');
  await page.waitFor(`!!document.querySelector('#detail[open] #page-frames')`);
  assert.ok(
    (await page.evaluate<number>(`document.querySelectorAll('#page-frames iframe, #page-frames .page-missing').length`)) >= 1,
    'blocs',
  );
  assert.ok(
    await is(`[...document.querySelectorAll('#page-frames iframe')].every((f) => parseInt(f.style.height) >= 80)`),
    'hauteur appliquée',
  );
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await go('style');
  await page.click('#palette-open');
  await page.waitFor(`!document.querySelector('#palette-form').hidden`);
  await page.click('#create-theme');
  await page.waitFor(`document.querySelectorAll('#token-grid .token-row').length === 16`);
  await page.click('[data-mode="dark"]');
  await page.waitFor(`document.querySelector('[data-mode="dark"]').getAttribute('aria-pressed') === 'true'`);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await page.click('#pal-cancel');
});

test('ma palette : liste collée, code refusé, lancement bloqué tant qu’elle n’est pas enregistrée', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await go('style');
  await page.click('#palette-open');
  await page.waitFor(`!document.querySelector('#palette-form').hidden`);
  await page.evaluate(`(() => {
    const data = new DataTransfer();
    data.setData('text', '#2a9d8f #FFF, #1a1a1a');
    document.querySelector('[data-hex="0"]').dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
    );
    return true;
  })()`);
  assert.equal(await page.evaluate<string>(`document.querySelector('[data-hex="2"]').value`), '#1a1a1a');
  assert.equal(await text('#pal-role-0'), 'Principale', 'rôle choisi sans ordre');
  assert.equal(await text('#pal-role-1'), 'Fond');
  await page.click('#pal-add');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#pal-rows li').length`), 4, 'couleur ajoutée');
  await page.click('[data-drop="3"]');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#pal-rows li').length`), 3, 'couleur retirée');
  assert.ok(await is(`!document.querySelector('#pal-preview').hidden`), 'aperçu');

  await go('launch');
  assert.ok(await is(`document.querySelector('#save-copy').disabled`), 'commande bloquée');
  assert.match(await text('#launch-checks'), /Palette pas encore enregistrée/);

  await go('style');
  await page.fill('[data-hex="0"]', 'zzz');
  assert.match(await text('#pal-errors'), /n’est pas un code hexa/);
  await page.fill('[data-hex="0"]', '1D45C9');
  assert.equal(await page.evaluate<string>(`document.querySelector('[data-hex="0"]').value`), '#1d45c9');

  // L'envoi est intercepté : ce test ne doit pas écrire dans le registre réel.
  await page.evaluate(`(() => {
    const real = window.fetch;
    window.fetch = async (url, options) => {
      if (!String(url).includes('/api/themes')) return real(url, options);
      window.fetch = real;
      window.sentPalette = JSON.parse(options.body).theme;
      return new Response(JSON.stringify({ error: 'refus de test' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    };
    return true;
  })()`);
  await page.click('#pal-save');
  await toast('refus de test');
  assert.equal(await page.evaluate<string>(`window.sentPalette.light['--primary']`), '#1d45c9');
  assert.equal(await page.evaluate<number>(`Object.keys(window.sentPalette.dark).length`), 18);
  assert.ok(await is(`!document.querySelector('#palette-form').hidden`), 'saisie gardée après un refus');

  await page.click('#pal-cancel');
  assert.ok(await is(`document.querySelector('#palette-form').hidden`), 'annulée');
});

test('template : choix au projet, sections capturées, ajout d’une section à la spec', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await go('project');
  await page.click('[data-template="launch-ui/template"]');
  assert.equal(
    await page.evaluate<string>(`document.querySelector('[data-template="launch-ui/template"]').getAttribute('aria-pressed')`),
    'true',
  );
  await page.click('[data-detail="launch-ui/template"]');
  await page.waitFor(`document.querySelectorAll('#detail[open] .section-shot').length >= 5`);
  assert.ok(
    await is(
      `(() => { const c = document.querySelector('#detail .tpl-aside .command-line code'); return c.scrollWidth <= c.clientWidth + 1 && /launch-ui\\/template/.test(c.textContent); })()`,
    ),
    'commande scaffold affichée en entier (pas coupée ni écrasée par le bouton copier)',
  );
  // Visionneuse : capture en grand, section suivante, ajout depuis la visionneuse, Échap la referme sans fermer la fiche.
  await page.click('#detail .section-shot [data-view]');
  await page.waitFor(`!document.querySelector('#detail .shot-viewer').hidden && !!document.querySelector('#detail .viewer-stage img')`);
  await page.click('#detail [data-viewer="1"]');
  assert.match(await text('#detail .viewer-pos'), /^2 \/ 9$/);
  await page.evaluate(`document.querySelector('#detail').dispatchEvent(new Event('cancel', { cancelable: true })); true`);
  assert.ok(
    await is(`document.querySelector('#detail').open && document.querySelector('#detail .shot-viewer').hidden`),
    'fiche restée ouverte',
  );
  await page.click('#detail .section-shot [data-toggle="launch-ui/hero"]');
  await page.waitFor(`document.querySelector('#detail [data-toggle="launch-ui/hero"]').getAttribute('aria-pressed') === 'true'`);
  assert.match(await text('#s-blocks'), /Hero avec capture produit/);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await go('blocks');
  await page.click('#preview-page');
  await page.waitFor(`!!document.querySelector('#detail[open] #page-frames')`);
  // La section rejoint la page des derniers blocs : ouvrir son onglet si la spec en a plusieurs.
  await page.evaluate(`(() => {
    const p = document.querySelector('#s-blocks [data-detail="launch-ui/hero"]').closest('.block').querySelector('[data-page]').value;
    document.querySelector('[data-page-tab="' + CSS.escape(p) + '"]')?.click();
    return true;
  })()`);
  await page.waitFor(`!!document.querySelector('#detail[open] #page-frames img.page-shot')`);
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  await page.click('#s-blocks [data-detail="launch-ui/hero"]');
  await page.waitFor(`!!document.querySelector('#detail[open] .back-template')`);
  await page.click('#detail .back-template');
  await page.waitFor(`document.querySelectorAll('#detail[open] .section-shot').length >= 5`);
  await page.click('#detail [data-toggle="launch-ui/hero"]');
  await page.evaluate(`document.querySelector('#detail').close(); true`);
  assert.doesNotMatch(await text('#s-blocks'), /Hero avec capture produit/);
});

test('app mobile : six étapes, web grisé, Varier, aperçus, erreurs, enregistrement sans bloc, retour en Web', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await restart();
  await page.click('[data-target="mobile"]');
  await page.waitFor(`document.querySelectorAll('#steps [data-step]').length === 6`);
  assert.ok(await is(`document.querySelector('[data-template="launch-ui/template"]').disabled`), 'template web désactivé');

  await page.fill('#s-title', 'Respire', ['input']);
  await go('blocks');
  assert.ok(await is(`!document.querySelector('[data-card]').classList.contains('is-off')`), 'natif en tête');
  await page.fill('#q', 'marquee', ['input']);
  await page.waitFor(`!!document.querySelector('.card.is-off .badge.off')`);
  assert.equal(await text('.card.is-off .badge.off'), 'web only');

  await go('style');
  assert.match(await page.evaluate<string>(`document.querySelector('[data-card]').dataset.card`), /^mobile-base\//, 'palettes en tête');
  await page.click('#vary');
  const varied = await page.evaluate<{ theme: string; fonts: string[]; mobile: { layouts: { paywall: string } } }>(
    `JSON.parse(localStorage.getItem('atlas-builder-draft'))`,
  );
  assert.match(varied.theme, /^mobile-base\//);
  assert.equal(varied.fonts.length, 1);
  assert.notEqual(varied.mobile.layouts.paywall, 'benefits');

  await go('onboarding');
  assert.equal(await page.evaluate<number>(`document.querySelectorAll('#onboarding-layouts .ph-screen').length`), 3, 'variantes dessinées');
  await page.click('[data-layout="onboarding:fullscreen"]');
  await page.fill('[data-m="slides.0.title"]', 'Respirez', ['input']);
  assert.match(await text('[data-layout="onboarding:fullscreen"]'), /Respirez/, 'aperçu suivi en direct');
  assert.equal(
    await page.evaluate<string>(`document.querySelector('[data-layout="onboarding:fullscreen"]').getAttribute('aria-pressed')`),
    'true',
  );

  await go('paywall');
  await page.fill('[data-m="termsUrl"]', 'mon-site.fr/cgu', ['input', 'change']);
  assert.match(await text('.field-error'), /https/);
  await go('launch');
  assert.ok(await is(`document.querySelector('#save-copy').disabled`), 'lancement bloqué');
  await page.click('#launch-checks .error [data-fix]');
  await page.waitFor(`document.body.dataset.step === 'paywall' && document.activeElement.dataset.m === 'termsUrl'`);
  await page.fill('[data-m="termsUrl"]', '', ['input', 'change']);

  await page.evaluate(`location.reload(); true`);
  await page.waitFor(`document.body.dataset.step === 'paywall' && document.querySelector('#s-title').value === 'Respire'`);
  assert.equal(await page.evaluate<string>(`document.querySelector('[data-target="mobile"]').getAttribute('aria-pressed')`), 'true');

  await page.fill('#s-name', MOBILE);
  await page.click('#save');
  await toast('Enregistré');
  const saved = JSON.parse(fs.readFileSync(specFile(MOBILE), 'utf8'));
  assert.equal(saved.target, 'mobile');
  assert.equal(saved.title, 'Respire');
  assert.equal(saved.mobile.layouts.onboarding, 'fullscreen');
  assert.equal(saved.blocks.length, 0);

  await page.click('[data-target="web"]');
  await page.waitFor(`document.querySelectorAll('#steps [data-step]').length === 4 && document.body.dataset.step === 'style'`);
  await go('blocks');
  assert.ok(await is(`!document.querySelector('.card.is-off')`), 'rien de grisé en Web');
});

test('petit écran : pas de débordement, récapitulatif en volet', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await page.viewport(390, 844);
  for (const step of ['project', 'style', 'blocks', 'launch']) {
    await go(step);
    assert.ok(await is(`document.documentElement.scrollWidth <= innerWidth`), `débordement : ${step}`);
  }
  await page.waitFor(`getComputedStyle(document.querySelector('#rail')).visibility === 'hidden'`);
  await page.click('#jump-spec');
  await page.waitFor(`getComputedStyle(document.querySelector('#rail')).visibility === 'visible'`);
  await page.click('#jump-spec');
  await page.viewport(1400, 1000);
});

test('preset : garde le nom saisi ; aucune erreur JavaScript', async (t) => {
  if (!browser) return t.skip('Chrome introuvable');
  await restart();
  await page.fill('#s-title', 'Mon client', ['input']);
  await page.waitFor(`!!document.querySelector('[data-start^="preset:"]')`);
  await page.click('[data-start^="preset:"]');
  await page.waitFor(`document.querySelectorAll('#s-blocks .block').length > 0`);
  assert.equal(await page.evaluate<string>(`document.querySelector('#s-name').value`), 'mon-client');
  assert.deepEqual(page.errors, []);
});
