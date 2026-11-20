/**
 * Planche contact des captures de scripts/shoot.ts, pour relire beaucoup d'aperçus d'un coup.
 *   npx tsx scripts/contact-sheet.ts --source process-like --width 1440 [--only a,b] [--cols 2]
 * → .cache/shots/<source>/_sheet-<width>.png
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { ROOT } from '../shared/paths.js';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const source = flag('source') ?? 'process-like';
const width = flag('width') ?? '1440';
const cols = Number(flag('cols') ?? (width === '375' ? 4 : 2));
const only = flag('only')?.split(',');
const dir = path.join(ROOT, '.cache', 'shots', source);
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(`-${width}.png`) && !f.startsWith('_'))
  .filter((f) => !only || only.some((o) => f === `${o}-${width}.png`))
  .sort();

const cell = width === '375' ? 300 : 700;
const html = `<!doctype html><body style="margin:0;background:#ddd;font:12px sans-serif">
<div style="display:grid;grid-template-columns:repeat(${cols},${cell}px);gap:10px;padding:10px;align-items:start">
${files.map((f) => `<figure style="margin:0;background:#fff"><figcaption style="padding:4px 6px">${f}</figcaption><img style="width:100%;display:block" src="${pathToFileURL(path.join(dir, f)).href}"></figure>`).join('\n')}
</div></body>`;
const name = flag('name') ?? `_sheet-${width}`;
const page = path.join(dir, `${name}.html`);
fs.writeFileSync(page, html);

const browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch({ channel: 'msedge' }));
const tab = await browser.newPage({ viewport: { width: cols * (cell + 10) + 10, height: 800 } });
await tab.goto(pathToFileURL(page).href, { waitUntil: 'load' });
const out = path.join(dir, `${name}.png`);
await tab.screenshot({ path: out, fullPage: true });
await browser.close();
console.log(`${files.length} captures → ${path.relative(ROOT, out)}`);
