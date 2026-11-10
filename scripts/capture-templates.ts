/**
 * Captures des templates : chaque page déclarée (importers/sources.json → templates[].pages) est ouverte
 * sur la démo officielle dans Chrome headless, en bureau (1440 × 900) puis la page d'accueil en mobile.
 * Résultat : registry/templates/<id>/template/screens/*.jpg + screens.json (lus par le builder).
 * Sans démo en ligne, l'image de présentation du dépôt (`cover`) sert de visuel.
 *
 *   npm run capture:templates [-- --only saas-starter]
 */
import fs from 'node:fs';
import path from 'node:path';
import { REGISTRY } from '../shared/paths.js';
import { loadTemplateSources } from '../importers/templates.js';
import { Browser, type Page } from '../tests/e2e/browser.js';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface Screen {
  file: string;
  path: string;
  title: string;
  viewport: 'desktop' | 'mobile';
}

async function shoot(page: Page, url: string, file: string, size: { width: number; height: number; mobile: boolean }): Promise<boolean> {
  await page.viewport(size.width, size.height, size.mobile);
  await page.goto(url);
  try {
    await page.waitFor(`document.readyState === 'complete'`, 30000);
  } catch {
    return false;
  }
  await wait(3500); // animations d'entrée, polices, images
  const status = await page.evaluate<number>(`performance.getEntriesByType('navigation')[0]?.responseStatus ?? 200`);
  const text = await page.evaluate<string>(`document.title + ' ' + (document.body?.innerText ?? '').slice(0, 300)`);
  if (status >= 400 || /\b(404|not found|deployment (is )?paused|page introuvable)\b/i.test(text)) return false;
  const r = await page.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 78,
    clip: { x: 0, y: 0, width: size.width, height: size.height, scale: size.mobile ? 1 : 0.75 },
  });
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  return true;
}

const browser = await Browser.launch();
if (!browser) {
  console.error('Chrome ou Edge introuvable (ATLAS_CHROME).');
  process.exit(1);
}
try {
  for (const src of loadTemplateSources()) {
    if (only && only !== src.id) continue;
    const itemDir = path.join(REGISTRY, 'templates', src.id, 'template');
    if (!fs.existsSync(path.join(itemDir, 'meta.json'))) {
      console.log(`${src.id} : non importé (npm run import -- templates)`);
      continue;
    }
    const dir = path.join(itemDir, 'screens');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const screens: Screen[] = [];
    if (src.demo) {
      const page = await browser.page(1440, 900);
      for (const [i, p] of src.pages.entries()) {
        const file = `${String(i + 1).padStart(2, '0')}-desktop.jpg`;
        if (await shoot(page, new URL(p.path, src.demo).href, path.join(dir, file), { width: 1440, height: 900, mobile: false }))
          screens.push({ file, path: p.path, title: p.title, viewport: 'desktop' });
        else console.log(`  ${src.id} ${p.path} : page indisponible sur la démo, ignorée`);
      }
      const first = src.pages[0];
      if (
        first &&
        (await shoot(page, new URL(first.path, src.demo).href, path.join(dir, '00-mobile.jpg'), { width: 390, height: 844, mobile: true }))
      )
        screens.push({ file: '00-mobile.jpg', path: first.path, title: `${first.title} (mobile)`, viewport: 'mobile' });
    }
    if (!screens.length && src.cover) {
      const cover = path.join(itemDir, 'files', src.cover);
      if (fs.existsSync(cover)) {
        const file = `cover${path.extname(src.cover)}`;
        fs.copyFileSync(cover, path.join(dir, file));
        screens.push({ file, path: '/', title: 'Présentation (image du dépôt, pas de démo en ligne)', viewport: 'desktop' });
      }
    }
    fs.writeFileSync(path.join(dir, 'screens.json'), JSON.stringify(screens, null, 1) + '\n');
    console.log(`${src.id} : ${screens.length} capture(s)`);
  }
} finally {
  browser.close();
}
