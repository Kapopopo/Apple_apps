/**
 * Captures des aperçus du registre aux largeurs mobile et bureau, pour la revue visuelle (playwright-core,
 * Chrome ou Edge déjà installés : aucun navigateur téléchargé). Le serveur Atlas doit tourner (npm start).
 *
 *   npx tsx scripts/shoot.ts --only process-like/pill-badge,process-like/hero
 *   npx tsx scripts/shoot.ts --source process-like [--widths 375,1440] [--theme dark] [--reduced] [--base http://127.0.0.1:8000]
 *
 * Images : .cache/shots/<source>/<slug>-<largeur>[-dark][-reduced].png (page entière).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser } from 'playwright-core';
import { ROOT } from '../shared/paths.js';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : undefined;
};

const base = String(flag('base') ?? 'http://127.0.0.1:8000');
const widths = String(flag('widths') ?? '375,1440')
  .split(',')
  .map(Number)
  .filter((n) => n > 0);
const theme = flag('theme') === 'dark' ? 'dark' : 'light';
const reduced = flag('reduced') === true;
const settle = Number(flag('wait') ?? 1600);

function targets(): string[] {
  const only = flag('only');
  if (typeof only === 'string') return only.split(',').filter(Boolean);
  const source = flag('source');
  if (typeof source !== 'string') throw new Error('Préciser --only id1,id2 ou --source <source>');
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'index.json'), 'utf8')) as {
    items: { id: string; sourceId: string; preview?: { kind: string } }[];
  };
  return index.items.filter((i) => i.sourceId === source && i.preview?.kind === 'live').map((i) => i.id);
}

async function launch(): Promise<Browser> {
  for (const channel of ['chrome', 'msedge']) {
    try {
      return await chromium.launch({ channel });
    } catch {
      /* canal suivant */
    }
  }
  throw new Error('Ni Chrome ni Edge trouvés pour playwright-core');
}

const ids = targets();
const browser = await launch();
let failures = 0;
try {
  for (const id of ids) {
    const [source, slug] = id.split('/');
    const dir = path.join(ROOT, '.cache', 'shots', source);
    fs.mkdirSync(dir, { recursive: true });
    for (const width of widths) {
      const context = await browser.newContext({
        viewport: { width, height: width < 768 ? 812 : 900 },
        deviceScaleFactor: width < 768 ? 2 : 1,
        reducedMotion: reduced ? 'reduce' : 'no-preference',
        colorScheme: theme,
      });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
      // Serveur de dev Vite : le premier passage pré-compile les dépendances (et peut recharger la page) ;
      // on attend un rendu réel, avec une seconde tentative.
      let rendered = false;
      for (let attempt = 0; attempt < 2 && !rendered; attempt++) {
        await page.goto(`${base}/registry-previews/?id=${encodeURIComponent(id)}&theme=${theme}`, { waitUntil: 'load', timeout: 180_000 });
        rendered = await page
          .waitForFunction(() => (document.getElementById('root')?.querySelectorAll('*').length ?? 0) > 2, null, { timeout: 60_000 })
          .then(() => true)
          .catch(() => false);
      }
      if (!rendered) {
        failures++;
        console.log(`✗ ${id} @${width}px : rien n'a été rendu`);
        await context.close();
        continue;
      }
      await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => undefined);
      await page.evaluate(() => document.fonts.ready);
      // Défilement progressif jusqu'en bas : déclenche les entrées au scroll (whileInView) avant la capture pleine page.
      await page.evaluate(async () => {
        const step = Math.max(200, Math.round(window.innerHeight * 0.6));
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(settle);
      const broken = await page.evaluate(() => /Aperçu indisponible/.test(document.body.innerText));
      if (broken) errors.push('aperçu indisponible (module manquant ?)');
      const file = path.join(dir, `${slug}-${width}${theme === 'dark' ? '-dark' : ''}${reduced ? '-reduced' : ''}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const status = errors.length ? `✗ ${errors.length} erreur(s) : ${errors.slice(0, 2).join(' | ')}` : '✓';
      if (errors.length) failures++;
      console.log(
        `${status} ${id} @${width}px${overflow > 0 ? ` (débordement horizontal ${overflow}px)` : ''} → ${path.relative(ROOT, file)}`,
      );
      await context.close();
    }
  }
} finally {
  await browser.close();
}
if (failures) process.exit(1);
