/**
 * Pilote Chrome headless minimal (protocole DevTools, WebSocket natif de Node 22) et serveur Atlas
 * de test sur un port libre. Chrome : ATLAS_CHROME, sinon emplacements usuels ; absent → tests ignorés.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

export const chromePath = [process.env.ATLAS_CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .filter((p): p is string => !!p).find((p) => fs.existsSync(p));

type Message = { id?: number; method?: string; params?: any; result?: any; error?: { message: string }; sessionId?: string };

export class Page {
  readonly errors: string[] = [];
  constructor(private browser: Browser, readonly sessionId: string) {}
  send(method: string, params: Record<string, unknown> = {}) { return this.browser.send(method, params, this.sessionId); }
  async goto(url: string) { await this.send('Page.navigate', { url }); }
  async evaluate<T = unknown>(expression: string): Promise<T> {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text ?? 'évaluation');
    return r.result.value as T;
  }
  async waitFor(expression: string, ms = 15000) {
    const start = Date.now();
    while (Date.now() - start < ms) {
      try { if (await this.evaluate(expression)) return; } catch { /* page en cours de chargement */ }
      await new Promise((r) => setTimeout(r, 120));
    }
    throw new Error(`Délai dépassé : ${expression}`);
  }
  click(selector: string) { return this.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) throw new Error('introuvable : ${selector.replace(/'/g, "\\'")}'); el.click(); return true; })()`); }
  fill(selector: string, value: string, events = ['input', 'change']) {
    return this.evaluate(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); el.value = ${JSON.stringify(value)}; for (const e of ${JSON.stringify(events)}) el.dispatchEvent(new Event(e, { bubbles: true })); return true; })()`);
  }
  async viewport(width: number, height: number, mobile = false) {
    await this.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile });
  }
  async screenshot(file: string) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
  }
}

export class Browser {
  private seq = 0;
  private pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void }>();
  private pages = new Map<string, Page>();
  private constructor(private ws: WebSocket, private chrome: ChildProcess, private profile: string) {
    ws.addEventListener('message', (e) => {
      const msg: Message = JSON.parse(String(e.data));
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id)!; this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
        return;
      }
      const page = msg.sessionId ? this.pages.get(msg.sessionId) : undefined;
      if (!page) return;
      if (msg.method === 'Runtime.exceptionThrown') page.errors.push(msg.params.exceptionDetails.exception?.description?.split('\n')[0] ?? msg.params.exceptionDetails.text);
      if (msg.method === 'Page.javascriptDialogOpening') page.send('Page.handleJavaScriptDialog', { accept: true, promptText: '' }).catch(() => {});
    });
  }

  static async launch(): Promise<Browser | null> {
    if (!chromePath) return null;
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-e2e-'));
    const chrome = spawn(chromePath, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars', '--mute-audio', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
    const wsUrl = await new Promise<string>((resolve, reject) => {
      let buf = '';
      chrome.stderr!.on('data', (d) => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) resolve(m[1]); });
      setTimeout(() => reject(new Error('Chrome ne démarre pas')), 20000);
    });
    const ws = new WebSocket(wsUrl);
    await new Promise((r) => ws.addEventListener('open', r, { once: true }));
    return new Browser(ws, chrome, profile);
  }

  send(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = ++this.seq;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  async page(width = 1400, height = 1000): Promise<Page> {
    const { targetId } = await this.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    const page = new Page(this, sessionId);
    this.pages.set(sessionId, page);
    await page.send('Page.enable'); await page.send('Runtime.enable');
    await page.viewport(width, height);
    return page;
  }

  close() {
    this.ws.close();
    this.chrome.kill();
    setTimeout(() => fs.rmSync(this.profile, { recursive: true, force: true }), 800);
  }
}

/** Serveur Atlas sur un port libre (registre réel du dépôt). */
export async function startServer() {
  const { createAtlasServer } = await import('../../server/app.js');
  const server = createAtlasServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { base, close: () => new Promise<void>((resolve) => server.close(() => resolve())) };
}
