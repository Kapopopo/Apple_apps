/**
 * Audit des aperçus live : ouvre chaque item dans Chrome headless et classe le rendu.
 *   ok     : le composant s'affiche avec une taille visible
 *   empty  : aucune erreur mais rien de visible (composant qui attend des props)
 *   error  : erreur de chargement ou de rendu
 * Résultat : registry/_previews.json, lu par server.py (le builder et le catalogue n'affichent que « ok »).
 * Usage : npm --prefix previews run audit   (après npm run previews ; Chrome ou Edge requis, ATLAS_CHROME sinon)
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../..');
const BUILD = path.join(ROOT, 'web', 'registry-previews');
const OUT = path.join(ROOT, 'registry', '_previews.json');
const TABS = Number(process.env.AUDIT_TABS || 6);
const TIMEOUT = 9000;

if (!fs.existsSync(path.join(BUILD, 'index.html'))) { console.error('Aperçus non compilés : lancer npm run previews.'); process.exit(1); }
const { items } = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'index.json'), 'utf8'));
const ids = items.filter((i) => i.preview?.kind === 'live' && i.framework === 'react').map((i) => i.id);

// Serveur statique minimal pour web/registry-previews (aucune dépendance au serveur Python).
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const rel = decodeURIComponent(url.pathname.replace(/^\/registry-previews\/?/, '')) || 'index.html';
  const file = path.resolve(BUILD, rel);
  if (!file.startsWith(BUILD) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}/registry-previews/index.html`;

const chromePath = [process.env.ATLAS_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find((p) => fs.existsSync(p));
if (!chromePath) { console.error('Chrome ou Edge introuvable (ATLAS_CHROME).'); process.exit(1); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-audit-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
  setTimeout(() => reject(new Error('Chrome ne démarre pas')), 20000);
});
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
const exceptions = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); return; }
  if (msg.method === 'Runtime.exceptionThrown' && msg.sessionId) exceptions.get(msg.sessionId)?.push(msg.params.exceptionDetails.exception?.description?.split('\n')[0] ?? msg.params.exceptionDetails.text);
});
const send = (method, params = {}, sessionId) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params, sessionId })); });

const PROBE = `(() => {
  const fail = document.querySelector('.atlas-failure');
  if (fail) return { state: 'error', message: fail.querySelector('p')?.textContent || 'erreur' };
  const stage = document.querySelector('.atlas-stage');
  if (!stage) return { state: 'loading' };
  let visible = 0;
  for (const el of stage.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.width >= 8 && r.height >= 8) { visible++; if (visible > 1) break; } }
  const canvas = stage.querySelector('canvas, svg, img, video');
  return { state: visible > 1 || canvas ? 'ok' : 'empty' };
})()`;

async function auditOne(sessionId, id) {
  exceptions.set(sessionId, []);
  await send('Page.navigate', { url: `${base}?id=${encodeURIComponent(id)}&theme=dark` }, sessionId);
  const start = Date.now();
  let last = { state: 'loading' };
  while (Date.now() - start < TIMEOUT) {
    await new Promise((r) => setTimeout(r, 400));
    const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true }, sessionId);
    last = r.result?.result?.value ?? last;
    if (last.state === 'error') break;
    if (last.state === 'ok' && Date.now() - start > 1500) break;
  }
  const errors = exceptions.get(sessionId);
  if (last.state === 'loading') return { status: 'error', message: errors[0] || 'délai dépassé' };
  if (last.state === 'error') return { status: 'error', message: last.message };
  if (last.state === 'empty') return { status: 'empty', message: errors[0] || 'rien de visible sans props' };
  return { status: 'ok' };
}

const results = {};
const queue = [...ids];
let done = 0;
const t0 = Date.now();
async function worker() {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 1, mobile: false }, sessionId);
  while (queue.length) {
    const id = queue.shift();
    try { results[id] = await auditOne(sessionId, id); }
    catch (error) { results[id] = { status: 'error', message: String(error.message || error) }; }
    if (++done % 100 === 0 || done === ids.length) console.log(`${done}/${ids.length} · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
}
await Promise.all(Array.from({ length: TABS }, worker));
chrome.kill();
server.close();
setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 500);

const counts = Object.values(results).reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {});
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), counts, results }, null, 1) + '\n');
console.log(`Audit : ${JSON.stringify(counts)} → registry/_previews.json`);
process.exit(0);
