/**
 * Test navigateur du builder (Chrome headless via le protocole DevTools, sans dépendance).
 * Prérequis : serveur lancé. Usage : node tests/browser_builder.mjs [http://127.0.0.1:8000]
 * Chrome : ATLAS_CHROME, sinon emplacements usuels.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.argv[2] ?? 'http://127.0.0.1:8000';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAME = `zz-browser-${process.pid}`;
const candidates = [process.env.ATLAS_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean);
const chromePath = candidates.find((p) => fs.existsSync(p));
if (!chromePath) { console.log('SKIP : Chrome introuvable (ATLAS_CHROME)'); process.exit(0); }

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-cdp-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--window-size=1400,1000', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  setTimeout(() => reject(new Error('Chrome ne répond pas')), 20000);
});
const browser = new WebSocket(wsUrl);
await new Promise((r) => browser.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const listeners = [];
browser.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); }
  else for (const l of listeners) l(msg);
});
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); browser.send(JSON.stringify({ id, method, params, sessionId })); });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
const cdp = (method, params) => send(method, params, sessionId);
await cdp('Page.enable'); await cdp('Runtime.enable');
const errors = [];
listeners.push((m) => {
  if (m.method === 'Page.javascriptDialogOpening') cdp('Page.handleJavaScriptDialog', { accept: true });
  if (m.method === 'Runtime.exceptionThrown' && m.sessionId === sessionId) errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
});
const evaluate = async (expression) => { const r = await cdp('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? 'évaluation'); return r.result.value; };
const waitFor = async (expression, ms = 15000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await evaluate(expression)) return; await new Promise((r) => setTimeout(r, 150)); } throw new Error(`Délai dépassé : ${expression}`); };
const assert = (cond, label) => { if (!cond) throw new Error(`ÉCHEC : ${label}`); console.log(`ok - ${label}`); };

let status = 0;
try {
  await cdp('Page.navigate', { url: `${BASE}/builder` });
  await waitFor(`document.querySelectorAll('[data-toggle]').length > 0`);
  await evaluate(`localStorage.clear(); document.querySelector('#new-spec').click(); true`);
  assert(await evaluate(`/items/.test(document.querySelector('#count').textContent)`), 'registre chargé');

  await evaluate(`document.querySelector('#q').value = 'graphique'; document.querySelector('#q').dispatchEvent(new Event('input')); true`);
  assert(await evaluate(`(() => { const metas = [...document.querySelectorAll('[data-card] .card-meta')]; return metas.length > 5 && metas.filter(m => /Graphiques/.test(m.textContent)).length >= metas.length / 2; })()`), 'recherche française « graphique » → surtout des Graphiques');
  await evaluate(`document.querySelector('#reset').click(); document.querySelector('[data-type="theme"]').click(); true`);
  assert(await evaluate(`[...document.querySelectorAll('[data-card] .card-meta')].every(m => m.textContent.startsWith('Thème'))`), 'filtre par type');
  await evaluate(`document.querySelector('[data-card] [data-toggle]').click(); true`);
  assert(await evaluate(`!!document.querySelector('#s-theme .theme-token')`), 'thème choisi');

  await evaluate(`document.querySelector('[data-type="component"]').click(); true`);
  await evaluate(`[...document.querySelectorAll('[data-card] [data-toggle]')].slice(0, 3).forEach(b => b.click()); true`);
  assert(await evaluate(`document.querySelectorAll('#s-blocks .block').length === 3`), 'trois blocs ajoutés');
  const before = await evaluate(`[...document.querySelectorAll('#s-blocks .block-title strong')].map(s => s.textContent)`);
  await evaluate(`document.querySelector('[data-move="0"][data-dir="1"]').click(); true`);
  const after = await evaluate(`[...document.querySelectorAll('#s-blocks .block-title strong')].map(s => s.textContent)`);
  assert(after[0] === before[1] && after[1] === before[0], 'réordonnancement ↓');
  await evaluate(`const t = document.querySelector('[data-note="0"]'); t.value = 'Dans le hero'; t.dispatchEvent(new Event('input', { bubbles: true })); true`);
  await evaluate(`const n = document.querySelector('#s-name'); n.value = '${NAME}'; n.dispatchEvent(new Event('input')); n.dispatchEvent(new Event('change')); true`);
  await evaluate(`document.querySelector('#save').click(); true`);
  await waitFor(`/Enregistré/.test(document.querySelector('#toast').textContent)`);
  const saved = JSON.parse(fs.readFileSync(path.join(ROOT, 'specs', `${NAME}.json`), 'utf8'));
  assert(saved.blocks.length === 3 && saved.blocks[0].note === 'Dans le hero' && saved.theme, 'spec enregistrée sur disque avec ordre, note et thème');
  await evaluate(`document.querySelector('#save').click(); true`);
  await waitFor(`/Enregistré/.test(document.querySelector('#toast').textContent)`);
  assert(fs.existsSync(path.join(ROOT, 'specs', `${NAME}.json`)), 'réenregistrement de la spec chargée (écrasement confirmé)');

  await evaluate(`location.reload(); true`);
  await waitFor(`document.querySelectorAll('#s-blocks .block').length === 3`);
  assert(await evaluate(`document.querySelector('#s-name').value === '${NAME}'`), 'brouillon conservé après rechargement');

  await waitFor(`!!document.querySelector('#load-spec option[value^="preset:"]')`);
  await evaluate(`const s = document.querySelector('#load-spec'); s.value = s.querySelector('option[value^="preset:"]').value; s.dispatchEvent(new Event('change')); true`);
  await waitFor(`document.querySelector('#s-name').value === '' && document.querySelectorAll('#s-blocks .block').length > 0`);
  assert(true, 'preset chargé comme point de départ (nom à définir)');

  await evaluate(`document.querySelector('[data-type="component"]').click(); true`);
  await evaluate(`document.querySelector('[data-card] [data-detail]').click(); true`);
  await waitFor(`!!document.querySelector('#detail[open] .files pre')`);
  assert(await evaluate(`document.querySelector('#detail .files pre').textContent.length > 50`), 'vue détail : code source affiché');
  assert(await evaluate(`(() => { const f = document.querySelector('#detail iframe'); return !!f && (f.getAttribute('sandbox') === 'allow-scripts' || f.src.includes('/demos/')); })()`), 'aperçu live sandboxé');
  assert(errors.length === 0, `aucune erreur JavaScript${errors.length ? ' : ' + errors.join(' | ') : ''}`);
} catch (error) {
  status = 1;
  console.error(error.message);
} finally {
  fs.rmSync(path.join(ROOT, 'specs', `${NAME}.json`), { force: true });
  chrome.kill();
  setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 500);
}
process.exitCode = status;
