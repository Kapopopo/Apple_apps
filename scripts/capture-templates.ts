/**
 * Captures des templates, sur la démo officielle dans Chrome headless (le code du template n'est jamais
 * exécuté ici) :
 *  - pages (importers/sources.json → templates[].pages) : bureau 1440 × 900, puis l'accueil en mobile ;
 *  - sections (templates[].sections) : chaque bloc déclaré, à sa taille réelle, après vérification que
 *    son texte figure bien dans le code de l'item (sinon la capture est refusée : elle tromperait).
 * Résultat : registry/templates/<id>/template/screens/ (screens.json, sections.json et les images).
 * Sans démo en ligne, l'image de présentation du dépôt (`cover`) sert de visuel.
 *
 *   npm run capture:templates [-- --only saas-starter] [--sections | --pages] [--slug hero,faq]
 *   --demo <url> (avec --only) : capturer sur une démo locale (build servi en local) sans l'enregistrer comme démo.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REGISTRY } from '../shared/paths.js';
import { readMeta } from '../shared/registry.js';
import { loadTemplateSources, pageUrl, textCheck, type TemplateSectionDef } from '../importers/templates.js';
import { Browser, type Page } from '../tests/e2e/browser.js';
import { decodePng, distinctRatio } from './lib/png.js';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : undefined;
const slugs = args.includes('--slug') ? args[args.indexOf('--slug') + 1]?.split(',') : undefined;
const demoOverride = args.includes('--demo') ? args[args.indexOf('--demo') + 1] : undefined;
const doPages = !args.includes('--sections');
const doSections = !args.includes('--pages');
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const DESKTOP = { width: 1440, height: 900 };
/** Hauteur maximale capturée (px CSS) : au-delà, le haut du bloc suffit à le reconnaître. */
const MAX_HEIGHT = 1800;
/** Page entière : hauteur maximale capturée (px CSS) et réduction de l'image (1440 → 864 px de large). */
const FULL_MAX_HEIGHT = 9000;
const FULL_SCALE = 0.6;

export interface Screen {
  file: string;
  path: string;
  title: string;
  /** full : la page d'accueil entière (visuel de l'en-tête de la fiche). */
  viewport: 'desktop' | 'mobile' | 'full';
  /** Dimensions de la page d'origine en px CSS (page entière seulement). */
  width?: number;
  height?: number;
}
export interface SectionShot {
  slug: string;
  file: string;
  page: string;
  width: number;
  height: number;
}

async function open(page: Page, url: string): Promise<boolean> {
  await page.goto(url);
  try {
    await page.waitFor(`document.readyState === 'complete'`, 30000);
  } catch {
    return false;
  }
  await wait(3000); // animations d'entrée, polices, images
  const status = await page.evaluate<number>(`performance.getEntriesByType('navigation')[0]?.responseStatus ?? 200`);
  const text = await page.evaluate<string>(`document.title + ' ' + (document.body?.innerText ?? '').slice(0, 300)`);
  return !(status >= 400 || /\b(404|not found|deployment (is )?paused|page introuvable)\b/i.test(text));
}

async function shoot(page: Page, url: string, file: string, size: { width: number; height: number; mobile: boolean }): Promise<boolean> {
  await page.viewport(size.width, size.height, size.mobile);
  if (!(await open(page, url))) return false;
  const r = await page.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 78,
    clip: { x: 0, y: 0, width: size.width, height: size.height, scale: size.mobile ? 1 : 0.75 },
  });
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  return true;
}

/**
 * Page d'accueil entière : la fenêtre prend la hauteur du document le temps de la capture (contenu peint,
 * apparitions au défilement déjà déclenchées), dans la limite de FULL_MAX_HEIGHT.
 */
async function captureFullPage(page: Page, url: string, file: string): Promise<{ width: number; height: number } | null> {
  await page.viewport(DESKTOP.width, DESKTOP.height);
  if (!(await open(page, url))) return null;
  await page.evaluate(SCROLL_THROUGH);
  await wait(800);
  const measure = async () =>
    Math.min(
      await page.evaluate<number>('Math.max(document.documentElement.scrollHeight, document.body?.scrollHeight ?? 0)'),
      FULL_MAX_HEIGHT,
    );
  let height = await measure();
  // Deux ajustements : une hauteur en vh peut grandir avec la fenêtre.
  for (let k = 0; k < 2; k++) {
    await page.viewport(DESKTOP.width, height);
    await wait(1200);
    const next = await measure();
    if (next === height) break;
    height = next;
  }
  await page.evaluate('window.scrollTo(0, 0)');
  await wait(300);
  const r = await page.send('Page.captureScreenshot', {
    format: 'jpeg',
    quality: 76,
    clip: { x: 0, y: 0, width: DESKTOP.width, height, scale: FULL_SCALE },
  });
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  await page.viewport(DESKTOP.width, DESKTOP.height);
  return { width: DESKTOP.width, height };
}

/**
 * Sans démo du template entier (Launch UI) : la page d'accueil reconstituée en empilant ses sections
 * capturées, dans l'ordre déclaré (celui de la page). Rendu par Chrome, sans outil d'image.
 */
async function composeFullPage(page: Page, dir: string, shots: SectionShot[]): Promise<{ width: number; height: number } | null> {
  if (!shots.length) return null;
  const width = Math.round(DESKTOP.width * FULL_SCALE);
  const html = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#000}img{display:block;width:${width}px;height:auto}</style>${shots
    .map((s) => `<img src="${pathToFileURL(path.join(dir, s.file)).href}" alt="">`)
    .join('')}`;
  const tmp = path.join(os.tmpdir(), `atlas-page-entiere-${process.pid}.html`);
  fs.writeFileSync(tmp, html);
  try {
    await page.viewport(width, 900);
    await page.goto(pathToFileURL(tmp).href);
    await page.waitFor(`document.readyState === 'complete' && [...document.images].every((i) => i.complete && i.naturalWidth > 0)`, 20000);
    const height = await page.evaluate<number>('document.documentElement.scrollHeight');
    await page.viewport(width, height);
    await wait(300);
    const r = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 80, clip: { x: 0, y: 0, width, height, scale: 1 } });
    fs.writeFileSync(path.join(dir, 'full.jpg'), Buffer.from(r.data, 'base64'));
    return { width: DESKTOP.width, height: Math.round(height / FULL_SCALE) };
  } finally {
    fs.rmSync(tmp, { force: true });
    await page.viewport(DESKTOP.width, DESKTOP.height);
  }
}

/** Fait défiler toute la page pour déclencher les apparitions au défilement, puis revient en haut. */
const SCROLL_THROUGH = `(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
  window.scrollTo(0, 0);
  return true;
})()`;

/**
 * Repère l'élément de la section (window.__atlasTarget), le sort de son cadre si demandé et masque
 * les éléments fixes ou collants qui ne lui appartiennent pas (en-têtes, docks) pour qu'ils ne le recouvrent pas.
 */
const LOCATE = (def: TemplateSectionDef) => `(() => {
  const norm = (s) => (s || '').replace(/\\s+/g, ' ').trim();
  for (const h of window.__atlasHidden || []) h.style.visibility = '';
  window.__atlasHidden = [];
  const find = ${JSON.stringify(def.find)}, text = ${JSON.stringify(def.text ?? '')};
  let el;
  if (find === '@viewport') el = document.body;
  else {
    const all = [...document.querySelectorAll(find)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 40 && r.height > 20; });
    el = text ? all.find((e) => norm(e.innerText).includes(text)) : all[0];
  }
  if (!el) return null;
  for (let k = 0; k < ${def.up ?? 0} && el.parentElement; k++) el = el.parentElement;
  if (${def.isolate ? 'true' : 'false'}) {
    const wrap = document.createElement('div');
    wrap.className = 'bg-background text-foreground';
    wrap.style.cssText = 'container-type:inline-size;width:100%;min-height:0;';
    wrap.append(el);
    document.body.replaceChildren(wrap);
    document.body.style.cssText = 'margin:0;padding:0;overflow:auto;';
  }
  if (find !== '@viewport')
    for (const other of document.querySelectorAll('body *')) {
      const pos = getComputedStyle(other).position;
      if ((pos === 'fixed' || pos === 'sticky') && !other.contains(el) && !el.contains(other)) {
        other.style.visibility = 'hidden';
        window.__atlasHidden.push(other);
      }
    }
  window.__atlasTarget = el;
  return (el.innerText || '').slice(0, 6000);
})()`;

const BOX = `(() => { const r = window.__atlasTarget.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`;

/** Page actuellement chargée et prête (défilée) : les sections suivantes de la même page la réutilisent. */
let loaded = '';

async function captureSection(page: Page, url: string, def: TemplateSectionDef, code: string, file: string): Promise<SectionShot | string> {
  await page.viewport(DESKTOP.width, DESKTOP.height);
  if (loaded !== url) {
    loaded = '';
    // Une démo peut limiter les chargements rapprochés (429, 503 passagers) : deux nouvelles tentatives, pauses croissantes.
    let ok = await open(page, url);
    for (const pause of [15000, 40000]) {
      if (ok) break;
      await wait(pause);
      ok = await open(page, url);
    }
    if (!ok) return 'page indisponible (après trois tentatives)';
    await page.evaluate(SCROLL_THROUGH);
    await wait(800);
    loaded = url;
  } else {
    await page.evaluate('window.scrollTo(0, 0)');
    await wait(400);
  }
  // Une section isolée remplace le contenu de la page : la suivante devra la recharger.
  if (def.isolate) loaded = '';
  const visible = await page.evaluate<string | null>(LOCATE(def));
  if (visible === null) return `élément introuvable (${def.find}${def.text ? ` « ${def.text} »` : ''})`;
  if (def.verify !== false) {
    const check = textCheck(visible, code);
    if (!check.ok)
      return `texte de la démo absent du code (${check.matched}/${check.total} lignes retrouvées ; absentes : ${check.missing
        .slice(0, 5)
        .map((l) => `« ${l.slice(0, 40)} »`)
        .join(', ')})`;
  }
  let box = await page.evaluate<{ x: number; y: number; w: number; h: number }>(BOX);
  if (def.find === '@viewport') box = { x: 0, y: 0, w: DESKTOP.width, h: DESKTOP.height };
  // Bloc plus haut que l'écran : la fenêtre est agrandie le temps de la capture (pas de collage d'images).
  const height = Math.min(Math.ceil(box.h), MAX_HEIGHT);
  if (height > DESKTOP.height) {
    await page.viewport(DESKTOP.width, height + 40);
    await wait(900);
    box = await page.evaluate(BOX);
  }
  // L'élément est amené dans la fenêtre (apparitions au défilement, zone peinte) ; le clip CDP est en coordonnées du document.
  await page.evaluate(`(() => { window.__atlasTarget.scrollIntoView({ block: 'start' }); return true; })()`);
  await wait(1200);
  const at =
    def.find === '@viewport'
      ? { x: 0, y: await page.evaluate<number>('scrollY'), w: DESKTOP.width, h: DESKTOP.height }
      : await page.evaluate<typeof box>(BOX);
  const clip = { x: Math.max(0, at.x), y: Math.max(0, at.y), width: Math.ceil(at.w), height: Math.min(Math.ceil(at.h), MAX_HEIGHT) };
  // Une capture presque uniforme = zone non peinte ou contenu encore invisible : refusée.
  const probe = await page.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 0.25 } });
  const png = decodePng(Buffer.from(probe.data, 'base64'));
  const ratio = png ? distinctRatio(png) : 1;
  if (ratio < 0.01) return `capture uniforme (${(ratio * 100).toFixed(1)} % de pixels distincts du fond)`;
  const scale = Math.min(1.5, Math.max(0.5, 1080 / clip.width));
  const r = await page.send('Page.captureScreenshot', { format: 'jpeg', quality: 78, clip: { ...clip, scale } });
  fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  return { slug: def.slug, file: path.basename(file), page: def.page, width: clip.width, height: clip.height };
}

/** Code d'une section (tous ses fichiers), pour vérifier que la capture lui correspond. */
function sectionCode(templateId: string, slug: string): string | null {
  const dir = path.join(REGISTRY, 'items', templateId, slug);
  const meta = readMeta(dir);
  if (!meta) return null;
  return meta.files.map((f) => fs.readFileSync(path.join(dir, 'files', f.path), 'utf8')).join('\n');
}

const browser = await Browser.launch();
if (!browser) {
  console.error('Chrome ou Edge introuvable (ATLAS_CHROME).');
  process.exit(1);
}
let failures = 0;
try {
  for (const src of loadTemplateSources()) {
    if (only && only !== src.id) continue;
    const demo = only && demoOverride ? demoOverride : src.demo;
    const itemDir = path.join(REGISTRY, 'templates', src.id, 'template');
    if (!fs.existsSync(path.join(itemDir, 'meta.json'))) {
      console.log(`${src.id} : non importé (npm run import -- templates)`);
      continue;
    }
    const dir = path.join(itemDir, 'screens');
    fs.mkdirSync(dir, { recursive: true });
    const page = await browser.page(DESKTOP.width, DESKTOP.height);

    if (doPages) {
      // Seulement les fichiers de cette étape : les captures de sections et sections.json restent.
      for (const f of fs.readdirSync(dir)) if (!f.startsWith('section')) fs.rmSync(path.join(dir, f));
      const screens: Screen[] = [];
      if (demo) {
        for (const [i, p] of src.pages.entries()) {
          const file = `${String(i + 1).padStart(2, '0')}-desktop.jpg`;
          if (await shoot(page, pageUrl(demo, p.path), path.join(dir, file), { ...DESKTOP, mobile: false }))
            screens.push({ file, path: p.path, title: p.title, viewport: 'desktop' });
          else console.log(`  ${src.id} ${p.path} : page indisponible sur la démo, ignorée`);
        }
        const first = src.pages[0];
        if (
          first &&
          (await shoot(page, pageUrl(demo, first.path), path.join(dir, '00-mobile.jpg'), { width: 390, height: 844, mobile: true }))
        )
          screens.push({ file: '00-mobile.jpg', path: first.path, title: `${first.title} (mobile)`, viewport: 'mobile' });
        const full = first && (await captureFullPage(page, pageUrl(demo, first.path), path.join(dir, 'full.jpg')));
        if (full)
          screens.unshift({ file: 'full.jpg', path: first.path, title: `${first.title} : page entière`, viewport: 'full', ...full });
        else if (first) console.log(`  ${src.id} : page entière indisponible`);
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
      console.log(`${src.id} : ${screens.length} capture(s) de pages`);
    }

    if (doSections && src.sections?.length) {
      // --slug : seulement ces sections ; les autres captures sont gardées telles quelles.
      const index = path.join(dir, 'sections.json');
      const previous: SectionShot[] = slugs && fs.existsSync(index) ? JSON.parse(fs.readFileSync(index, 'utf8')) : [];
      const todo = src.sections.filter((d) => !slugs || slugs.includes(d.slug));
      for (const f of fs.readdirSync(dir))
        if (f.startsWith('section-') && (!slugs || todo.some((d) => f === `section-${d.slug}.jpg`))) fs.rmSync(path.join(dir, f));
      loaded = '';
      const fresh = new Map<string, SectionShot>();
      for (const def of todo) {
        const code = sectionCode(src.id, def.slug);
        if (!code) {
          console.log(`  ${src.id}/${def.slug} : item absent (npm run import:templates)`);
          continue;
        }
        const result = await captureSection(page, pageUrl(demo, def.page), def, code, path.join(dir, `section-${def.slug}.jpg`));
        if (typeof result === 'string') {
          failures++;
          console.log(`  ✗ ${src.id}/${def.slug} : ${result}`);
        } else fresh.set(def.slug, result);
      }
      // Ordre de la page (ordre des sections déclarées).
      const shots = src.sections
        .map((d) => fresh.get(d.slug) ?? (todo.includes(d) ? undefined : previous.find((s) => s.slug === d.slug)))
        .filter((s): s is SectionShot => !!s);
      fs.writeFileSync(index, JSON.stringify(shots, null, 1) + '\n');
      console.log(`${src.id} : ${fresh.size}/${todo.length} section(s) capturée(s), ${shots.length}/${src.sections.length} au total`);
    }

    if (!demo && src.sections?.length) {
      const sectionsFile = path.join(dir, 'sections.json'),
        screensFile = path.join(dir, 'screens.json');
      const shots: SectionShot[] = fs.existsSync(sectionsFile) ? JSON.parse(fs.readFileSync(sectionsFile, 'utf8')) : [];
      const screens: Screen[] = (fs.existsSync(screensFile) ? JSON.parse(fs.readFileSync(screensFile, 'utf8')) : []).filter(
        (x: Screen) => x.viewport !== 'full',
      );
      const full = await composeFullPage(page, dir, shots);
      if (full) {
        screens.unshift({ file: 'full.jpg', path: '/', title: 'Page d’accueil : sections assemblées', viewport: 'full', ...full });
        console.log(`${src.id} : page entière reconstituée à partir de ${shots.length} sections`);
      }
      fs.writeFileSync(screensFile, JSON.stringify(screens, null, 1) + '\n');
    }
  }
} finally {
  browser.close();
}
if (failures) console.log(`${failures} section(s) sans capture : voir les messages ci-dessus.`);
