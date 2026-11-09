/**
 * Audit des aperçus : ouvre chaque item dans Chrome headless, classe le rendu et capture une vignette.
 *   ok     : quelque chose est réellement dessiné (contenu DOM visible ET pixels non uniformes)
 *   empty  : aucune erreur mais rien de visible (composant qui attend des props, rendu invisible)
 *   error  : erreur de chargement ou de rendu
 * Incrémental : un item n'est ré-audité que si son code (contentHash), son chunk compilé ou sa vignette ont changé.
 * Résultat : registry/_previews.json (lu par le serveur : seuls les « ok » sont interactifs) + web/thumbs/<id>.jpg.
 * Usage : npm --prefix previews run audit [-- --all] [-- --only id1,id2] [-- --no-thumbs]
 *         (après npm run previews ; Chrome ou Edge requis, ATLAS_CHROME sinon)
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PREVIEWS = path.resolve(here, '..');
const ROOT = path.resolve(here, '../..');
const WEB = path.join(ROOT, 'web');
const BUILD = path.join(WEB, 'registry-previews');
const THUMBS = path.join(WEB, 'thumbs');
const OUT = path.join(ROOT, 'registry', '_previews.json');
const TABS = Number(process.env.AUDIT_TABS || 6);
const TIMEOUT = 9000;
const VIEW = { width: 720, height: 480 };

const args = process.argv.slice(2);
const all = args.includes('--all');
const thumbs = !args.includes('--no-thumbs');
const only = (() => { const i = args.indexOf('--only'); return i >= 0 ? new Set(String(args[i + 1] || '').split(',').filter(Boolean)) : null; })();

if (!fs.existsSync(path.join(BUILD, 'index.html'))) { console.error('Aperçus non compilés : lancer npm run previews.'); process.exit(1); }
const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', 'index.json'), 'utf8'));
const previous = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')).results ?? {} : {};

/* Chunk compilé de chaque item (manifeste Vite) : un changement de code, de shim ou de dépendance change son nom. */
const manifestFile = path.join(BUILD, '.vite', 'manifest.json');
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};
const posix = (p) => p.split(path.sep).join('/');
function chunkOf(item) {
  if (item.preview?.kind !== 'live') return 'atlas-demo';
  const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'registry', item.dir, 'meta.json'), 'utf8'));
  const key = posix(path.relative(PREVIEWS, path.join(ROOT, 'registry', item.dir, 'files', meta.preview.entry)));
  return manifest[key]?.file ?? null;
}

const targets = index.items
  .filter((i) => (i.preview?.kind === 'live' && i.framework === 'react') || i.preview?.kind === 'atlas-demo')
  .map((i) => ({ id: i.id, hash: i.contentHash, chunk: chunkOf(i), url: i.preview.kind === 'atlas-demo' ? `/demos/index.html?demo=${encodeURIComponent(i.preview.demo)}` : `/registry-previews/index.html?id=${encodeURIComponent(i.id)}&theme=dark&card=1`, demo: i.preview.kind === 'atlas-demo' }));
const thumbFile = (id) => path.join(THUMBS, `${id}.jpg`);
const todo = targets.filter((t) => {
  if (only) return only.has(t.id);
  if (all) return true;
  const r = previous[t.id];
  return !r || r.hash !== t.hash || (t.chunk && r.chunk !== t.chunk) || (thumbs && r.status === 'ok' && !fs.existsSync(thumbFile(t.id)));
});
console.log(`Audit : ${todo.length} item(s) à vérifier sur ${targets.length}${all ? ' (--all)' : ''}`);

/* Serveur statique minimal (aperçus + démos Atlas), sans dépendre du serveur de l'application. */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const m = decodeURIComponent(url.pathname).match(/^\/(registry-previews|demos)\/?(.*)$/);
  const base = m && path.join(WEB, m[1]);
  const file = base && path.resolve(base, m[2] || 'index.html');
  if (!file || !file.startsWith(base) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const chromePath = [process.env.ATLAS_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].filter(Boolean).find((p) => fs.existsSync(p));
if (!chromePath) { console.error('Chrome ou Edge introuvable (ATLAS_CHROME).'); process.exit(1); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-audit-'));
const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', `--user-data-dir=${profile}`, '--remote-debugging-port=0', '--mute-audio', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
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

/* Contenu DOM visible : texte, média, contrôle de formulaire, ou surface peinte (fond, bordure, ombre). */
const PROBE = `(() => {
  const fail = document.querySelector('.atlas-failure');
  if (fail) return { state: 'error', message: fail.querySelector('p')?.textContent || 'erreur' };
  const stage = document.querySelector('.atlas-stage, .demo-stage');
  if (!stage) return { state: 'loading' };
  let content = 0;
  for (const el of stage.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || Number(s.opacity) === 0) continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const media = /^(IMG|SVG|CANVAS|VIDEO|INPUT|BUTTON|SELECT|TEXTAREA|svg|canvas)$/.test(el.tagName);
    const painted = (s.backgroundColor && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(s.backgroundColor)) || s.backgroundImage !== 'none' || parseFloat(s.borderTopWidth) > 0 || s.boxShadow !== 'none';
    if (text || media || painted) { content++; if (content > 2) break; }
  }
  const broken = [...stage.querySelectorAll('img')].filter((i) => i.complete && i.naturalWidth === 0).length;
  return { state: content ? 'ok' : 'empty', broken };
})()`;

/* Décodeur PNG minimal (8 bits, RGB/RGBA, non entrelacé) pour mesurer l'uniformité d'une capture. */
function decodePng(buffer) {
  let pos = 8, width = 0, height = 0, channels = 4;
  const idat = [];
  while (pos < buffer.length) {
    const len = buffer.readUInt32BE(pos), type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0; if (data[8] !== 8 || !channels || data[12]) return null; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels, out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? out[y * stride + x - channels] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= channels && y ? out[(y - 1) * stride + x - channels] : 0;
      const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
      const pred = f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : f === 4 ? (pa <= pb && pa <= pc ? a : pb <= pc ? b : c) : 0;
      out[y * stride + x] = (row[x] + pred) & 255;
    }
  }
  return { width, height, channels, data: out };
}

/** Nombre de pixels qui se distinguent du fond (couleur du coin haut-gauche). */
function distinctPixels(png) {
  const { data, channels, width, height } = png;
  const [r0, g0, b0] = [data[0], data[1], data[2]];
  let n = 0;
  for (let i = 0; i < width * height; i++) {
    const k = i * channels;
    if (Math.max(Math.abs(data[k] - r0), Math.abs(data[k + 1] - g0), Math.abs(data[k + 2] - b0)) > 12) n++;
  }
  return n;
}

async function capture(sessionId, format, scale, quality) {
  const r = await send('Page.captureScreenshot', { format, ...(quality ? { quality } : {}), clip: { x: 0, y: 0, ...VIEW, scale }, captureBeyondViewport: false }, sessionId);
  return r.result?.data ? Buffer.from(r.result.data, 'base64') : null;
}

async function auditOne(sessionId, target) {
  exceptions.set(sessionId, []);
  await send('Page.navigate', { url: origin + target.url }, sessionId);
  const start = Date.now();
  let last = { state: 'loading' };
  while (Date.now() - start < TIMEOUT) {
    await new Promise((r) => setTimeout(r, 400));
    const r = await send('Runtime.evaluate', { expression: PROBE, returnByValue: true }, sessionId);
    last = r.result?.result?.value ?? last;
    if (last.state === 'error') break;
    if (last.state === 'ok' && Date.now() - start > 1600) break;
  }
  const errors = exceptions.get(sessionId);
  if (last.state === 'loading') return { status: 'error', message: errors[0] || 'délai dépassé' };
  if (last.state === 'error') return { status: 'error', message: last.message };
  // Contrôle visuel : une capture uniforme = rien n'est dessiné (animation d'entrée lente : seconde chance).
  let pixels = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const png = await capture(sessionId, 'png', 0.5);
    const decoded = png && decodePng(png);
    pixels = decoded ? distinctPixels(decoded) : null;
    if (pixels === null || pixels > 40) break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  const visible = pixels === null ? last.state === 'ok' : pixels > 40;
  const result = visible ? { status: 'ok' } : { status: 'empty', message: last.state === 'ok' ? 'rendu invisible (capture uniforme)' : errors[0] || 'rien de visible sans props' };
  if (last.broken) result.brokenImages = last.broken;
  if (visible && thumbs) {
    const jpg = await capture(sessionId, 'jpeg', 0.75, 72);
    if (jpg) { fs.mkdirSync(path.dirname(thumbFile(target.id)), { recursive: true }); fs.writeFileSync(thumbFile(target.id), jpg); result.thumb = true; }
  }
  return result;
}

const results = { ...previous };
const queue = [...todo];
let done = 0;
const t0 = Date.now();
async function worker() {
  const { result: { targetId } } = await send('Target.createTarget', { url: 'about:blank' });
  const { result: { sessionId } } = await send('Target.attachToTarget', { targetId, flatten: true });
  await send('Page.enable', {}, sessionId);
  await send('Runtime.enable', {}, sessionId);
  await send('Emulation.setDeviceMetricsOverride', { ...VIEW, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] }, sessionId);
  while (queue.length) {
    const target = queue.shift();
    let result;
    try { result = await auditOne(sessionId, target); }
    catch (error) { result = { status: 'error', message: String(error.message || error) }; }
    results[target.id] = { ...result, hash: target.hash, ...(target.chunk ? { chunk: target.chunk } : {}), at: new Date().toISOString() };
    if (result.status !== 'ok') fs.rmSync(thumbFile(target.id), { force: true });
    if (++done % 100 === 0 || done === todo.length) console.log(`${done}/${todo.length} · ${Math.round((Date.now() - t0) / 1000)} s`);
  }
}
await Promise.all(Array.from({ length: Math.min(TABS, Math.max(1, todo.length)) }, worker));
chrome.kill();
server.close();
setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 500);

// Items disparus du registre : résultat et vignette retirés.
const known = new Set(targets.map((t) => t.id));
for (const id of Object.keys(results)) if (!known.has(id)) { delete results[id]; fs.rmSync(thumbFile(id), { force: true }); }
const counts = Object.values(results).reduce((m, r) => ({ ...m, [r.status]: (m[r.status] || 0) + 1 }), {});
const broken = Object.values(results).filter((r) => r.brokenImages).length;
const sorted = Object.fromEntries(Object.entries(results).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), counts, results: sorted }, null, 1) + '\n');
console.log(`Audit : ${JSON.stringify(counts)}${broken ? ` · ${broken} aperçu(s) avec images introuvables` : ''} → registry/_previews.json${thumbs ? ' · vignettes dans web/thumbs/' : ''}`);
process.exit(0);
